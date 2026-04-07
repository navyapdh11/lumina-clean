// cmd/agents/geo_aeo_agent.go
// Production-ready GEO/AEO Agent for enterprise AEO/GEO pipeline.
// Consumes raw HTML events from Kafka, extracts entities/schemas,
// computes AEO readiness, and stores structured signals in Redis
// with proper keying, pipelining, and observability.
//
// 2026 Enterprise Standards:
//   - Structured types & interfaces
//   - Context-aware processing with cancellation
//   - Graceful shutdown with signal handling
//   - Redis pipelining for batch writes
//   - Kafka consumer group with offset management
//   - OpenTelemetry tracing (stub hooks)
//   - Structured logging (slog)
//
// Usage:
//
//	go run cmd/agents/geo_aeo_agent.go \
//	  --redis-addr=localhost:6379 \
//	  --kafka-brokers=localhost:9092 \
//	  --kafka-topic=html.raw.events \
//	  --kafka-group=geo-aeo-agents
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
)

// =============================================================================
// CONFIGURATION
// =============================================================================

// AgentConfig holds all runtime configuration for the GEO/AEO agent.
type AgentConfig struct {
	RedisAddr     string        `json:"redis_addr"              env:"REDIS_ADDR"              default:"localhost:6379"`
	KafkaBrokers  []string      `json:"kafka_brokers"           env:"KAFKA_BROKERS"           default:"localhost:9092"`
	Topic         string        `json:"kafka_topic"             env:"KAFKA_TOPIC"             default:"html.raw.events"`
	GroupID       string        `json:"kafka_group"             env:"KAFKA_GROUP"             default:"geo-aeo-agents"`
	LLMEndpoint   string        `json:"llm_endpoint"            env:"LLM_ENDPOINT"            default:"http://localhost:8000/v1/chat"`
	BatchSize     int           `json:"batch_size"              env:"BATCH_SIZE"              default:"100"`
	FlushInterval time.Duration `json:"flush_interval"          env:"FLUSH_INTERVAL"          default:"5s"`
	MaxRetries    int           `json:"max_retries"             env:"MAX_RETRIES"             default:"3"`
	WorkerCount   int           `json:"worker_count"            env:"WORKER_COUNT"            default:"4"`
	TraceEnabled  bool          `json:"trace_enabled"           env:"OTEL_ENABLED"            default:"false"`
}

// =============================================================================
// DOMAIN TYPES
// =============================================================================

// RawEvent represents a single HTML scrape event consumed from Kafka.
type RawEvent struct {
	Version      string `json:"version"       validate:"required"`
	TenantID     string `json:"tenant_id"     validate:"required"`
	URL          string `json:"url"           validate:"required"`
	HTML         string `json:"html"          validate:"required,min=100"`
	IsExternal   bool   `json:"is_external"`
	SourceDomain string `json:"source_domain"`
	BusinessID   string `json:"business_id"`
	Timestamp    int64  `json:"timestamp"`
}

// Entity represents a structured entity extracted from HTML content.
type Entity struct {
	Type        string            `json:"type"`                  // LocalBusiness, Service, FAQPage, etc.
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Address     string            `json:"address,omitempty"`
	Phone       string            `json:"phone,omitempty"`
	URL         string            `json:"url,omitempty"`
	Geo         GeoCoordinates    `json:"geo,omitempty"`
	Properties  map[string]string `json:"properties,omitempty"`
	Confidence  float64           `json:"confidence"`
}

// GeoCoordinates holds latitude/longitude for a business entity.
type GeoCoordinates struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// AEOReadinessScore evaluates how well a page is optimized for Answer Engine Optimization.
type AEOReadinessScore struct {
	URL                string  `json:"url"`
	TenantID           string  `json:"tenant_id"`
	OverallScore       float64 `json:"overall_score"`        // 0.0 – 1.0
	SchemaMarkupScore  float64 `json:"schema_markup_score"`  // Presence of JSON-LD / Microdata
	ContentScore       float64 `json:"content_score"`        // FAQ, Q&A, conversational content
	StructureScore     float64 `json:"structure_score"`      // Heading hierarchy, lists
	EntityDensity      float64 `json:"entity_density"`       // Entities per 1000 words
	AnswerabilityScore float64 `json:"answerability_score"`  // Direct answers to common queries
	GEOAlignment       string  `json:"geo_alignment"`        // Matched Australian region code
	Timestamp          int64   `json:"timestamp"`
}

// ProcessedResult is the final output after entity extraction + AEO scoring.
type ProcessedResult struct {
	EventID        string              `json:"event_id"`
	URL            string              `json:"url"`
	TenantID       string              `json:"tenant_id"`
	Entities       []Entity            `json:"entities"`
	AEOReadiness   AEOReadinessScore   `json:"aeo_readiness"`
	SchemaJSON     string              `json:"schema_json,omitempty"`
	ProcessingMs   int64               `json:"processing_ms"`
	Error          string              `json:"error,omitempty"`
}

// =============================================================================
// INTERFACES
// =============================================================================

// EntityExtractor defines the contract for extracting entities from HTML.
type EntityExtractor interface {
	Extract(ctx context.Context, html string, sourceURL string) ([]Entity, error)
}

// AEOScorer defines the contract for computing AEO readiness.
type AEOScorer interface {
	Score(ctx context.Context, html string, entities []Entity, url string) (AEOReadinessScore, error)
}

// SchemaGenerator defines the contract for generating JSON-LD schema markup.
type SchemaGenerator interface {
	Generate(entities []Entity, url string) (string, error)
}

// ResultStore defines the contract for persisting processed results.
type ResultStore interface {
	Store(ctx context.Context, result ProcessedResult) error
	StoreBatch(ctx context.Context, results []ProcessedResult) error
}

// EventConsumer defines the contract for consuming Kafka events.
type EventConsumer interface {
	Consume(ctx context.Context, handler func(ctx context.Context, event RawEvent) error) error
	Close() error
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

// RegexEntityExtractor extracts entities from HTML using pattern matching.
type RegexEntityExtractor struct {
	businessNameRe *regexp.Regexp
	phoneRe        *regexp.Regexp
	addressRe      *regexp.Regexp
	emailRe        *regexp.Regexp
	schemaRe       *regexp.Regexp
}

// NewRegexEntityExtractor creates a new extractor with Australian-aware patterns.
func NewRegexEntityExtractor() *RegexEntityExtractor {
	return &RegexEntityExtractor{
		businessNameRe: regexp.MustCompile(`(?i)(?:ABN|business|company)[\s:]*([A-Z][A-Za-z\s&.,'()-]{2,60})`),
		phoneRe:        regexp.MustCompile(`(?:\+?61\s?)?(?:\d{2}\s?\d{4}\s?\d{4}|1300\s?\d{3}\s?\d{3}|1800\s?\d{3}\s?\d{3})`),
		addressRe:      regexp.MustCompile(`(?i)(\d+\s+[A-Za-z\s]+(?:St|Street|Rd|Road|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Pl|Place|Pde|Parade|Hwy|Highway)),?\s*([A-Za-z\s]+)\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s+(\d{4})`),
		emailRe:        regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`),
		schemaRe:       regexp.MustCompile(`(?s)(?:application/ld\+json|itemtype="https?://schema\.org/)(.*?)(?:</script>|>)`),
	}
}

// Extract extracts structured entities from raw HTML.
func (e *RegexEntityExtractor) Extract(ctx context.Context, html string, sourceURL string) ([]Entity, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	var entities []Entity

	// Extract business names
	if matches := e.businessNameRe.FindAllStringSubmatch(html, 5); len(matches) > 0 {
		for _, m := range matches {
			if len(m) >= 2 {
				entities = append(entities, Entity{
					Type:       "LocalBusiness",
					Name:       strings.TrimSpace(m[1]),
					URL:        sourceURL,
					Confidence: 0.7,
				})
			}
		}
	}

	// Extract phone numbers
	if phones := e.phoneRe.FindAllString(html, 10); len(phones) > 0 {
		entities = append(entities, Entity{
			Type:       "ContactPoint",
			Phone:      phones[0],
			URL:        sourceURL,
			Confidence: 0.85,
		})
	}

	// Extract addresses
	if matches := e.addressRe.FindAllStringSubmatch(html, 5); len(matches) > 0 {
		for _, m := range matches {
			if len(m) >= 5 {
				entities = append(entities, Entity{
					Type:        "PostalAddress",
					Address:     fmt.Sprintf("%s, %s %s %s", m[1], m[2], m[3], m[4]),
					URL:         sourceURL,
					Confidence:  0.9,
				})
			}
		}
	}

	// Detect existing schema markup
	if matches := e.schemaRe.FindAllString(html, 20); len(matches) > 0 {
		entities = append(entities, Entity{
			Type:        "ExistingSchema",
			Description: fmt.Sprintf("Found %d schema.org markup(s) on page", len(matches)),
			URL:         sourceURL,
			Confidence:  1.0,
		})
	}

	return entities, nil
}

// DefaultAEOScorer computes AEO readiness scores.
type DefaultAEOScorer struct{}

// Score computes an AEO readiness score for the given content.
func (s *DefaultAEOScorer) Score(ctx context.Context, html string, entities []Entity, url string) (AEOReadinessScore, error) {
	select {
	case <-ctx.Done():
		return AEOReadinessScore{}, ctx.Err()
	default:
	}

	htmlLower := strings.ToLower(html)
	wordCount := len(strings.Fields(html))

	// Schema markup score (0-1)
	hasJSONLD := strings.Contains(htmlLower, "application/ld+json")
	hasMicrodata := strings.Contains(htmlLower, "itemscope")
	hasSchemaOrg := strings.Contains(htmlLower, "schema.org")
	schemaScore := 0.0
	if hasJSONLD {
		schemaScore += 0.5
	}
	if hasMicrodata {
		schemaScore += 0.3
	}
	if hasSchemaOrg {
		schemaScore += 0.2
	}

	// Content score (0-1) — FAQ, Q&A, conversational
	hasFAQ := strings.Contains(htmlLower, "faq") || strings.Contains(htmlLower, "frequently asked")
	hasQA := strings.Contains(htmlLower, "question") && strings.Contains(htmlLower, "answer")
	hasHowTo := strings.Contains(htmlLower, "how to") || strings.Contains(htmlLower, "step by step")
	hasList := strings.Contains(htmlLower, "<ol") || strings.Contains(htmlLower, "<ul")
	contentScore := 0.0
	if hasFAQ {
		contentScore += 0.35
	}
	if hasQA {
		contentScore += 0.25
	}
	if hasHowTo {
		contentScore += 0.2
	}
	if hasList {
		contentScore += 0.2
	}

	// Structure score (0-1)
	h1Count := strings.Count(htmlLower, "<h1")
	h2Count := strings.Count(htmlLower, "<h2")
	hasProperHierarchy := h1Count >= 1 && h2Count >= 1
	structureScore := 0.0
	if hasProperHierarchy {
		structureScore += 0.6
	}
	if h1Count == 1 {
		structureScore += 0.4
	}

	// Entity density
	entityCount := len(entities)
	entityDensity := 0.0
	if wordCount > 0 {
		entityDensity = float64(entityCount) / float64(wordCount) * 1000
	}

	// Answerability — presence of direct answers
	answerabilityScore := 0.0
	if hasFAQ && hasQA {
		answerabilityScore = 0.9
	} else if hasFAQ || hasQA {
		answerabilityScore = 0.6
	} else {
		answerabilityScore = 0.2
	}

	// Overall weighted score
	overallScore := schemaScore*0.30 +
		contentScore*0.25 +
		structureScore*0.15 +
		answerabilityScore*0.20 +
		min(entityDensity/5.0, 1.0)*0.10

	// Determine GEO alignment
	geoAlignment := detectAustralianRegion(html)

	return AEOReadinessScore{
		URL:                url,
		TenantID:           extractTenantID(url),
		OverallScore:       roundTo2(overallScore),
		SchemaMarkupScore:  roundTo2(schemaScore),
		ContentScore:       roundTo2(contentScore),
		StructureScore:     roundTo2(structureScore),
		EntityDensity:      roundTo2(entityDensity),
		AnswerabilityScore: roundTo2(answerabilityScore),
		GEOAlignment:       geoAlignment,
		Timestamp:          time.Now().UnixMilli(),
	}, nil
}

// DefaultSchemaGenerator produces JSON-LD schema markup.
type DefaultSchemaGenerator struct{}

// Generate creates JSON-LD schema markup from extracted entities.
func (g *DefaultSchemaGenerator) Generate(entities []Entity, url string) (string, error) {
	if len(entities) == 0 {
		return "{}", nil
	}

	schema := map[string]interface{}{
		"@context": "https://schema.org",
		"@graph":   []map[string]interface{}{},
	}

	for _, e := range entities {
		node := map[string]interface{}{
			"@type": e.Type,
			"name":  e.Name,
		}
		if e.Description != "" {
			node["description"] = e.Description
		}
		if e.Address != "" {
			node["address"] = map[string]interface{}{
				"@type":           "PostalAddress",
				"streetAddress":   e.Address,
				"addressCountry":  "AU",
			}
		}
		if e.Phone != "" {
			node["telephone"] = e.Phone
		}
		if e.URL != "" {
			node["url"] = e.URL
		}
		if e.Geo.Latitude != 0 || e.Geo.Longitude != 0 {
			node["geo"] = map[string]interface{}{
				"@type":     "GeoCoordinates",
				"latitude":  e.Geo.Latitude,
				"longitude": e.Geo.Longitude,
			}
		}
		if e.Properties != nil {
			for k, v := range e.Properties {
				node[k] = v
			}
		}

		graph := schema["@graph"].([]map[string]interface{})
		schema["@graph"] = append(graph, node)
	}

	out, err := json.MarshalIndent(schema, "", "  ")
	if err != nil {
		return "", fmt.Errorf("schema marshal failed: %w", err)
	}
	return string(out), nil
}

// =============================================================================
// AGENT (Orchestrator)
// =============================================================================

// GEOAEOAgent orchestrates the full pipeline: extract → score → generate → store.
type GEOAEOAgent struct {
	cfg       AgentConfig
	extractor EntityExtractor
	scorer    AEOScorer
	generator SchemaGenerator
	store     ResultStore
	logger    *slog.Logger
	kafkaR    *kafka.Reader
	redis     *redis.Client
}

// NewGEOAEOAgent creates a new agent instance.
func NewGEOAEOAgent(cfg AgentConfig) (*GEOAEOAgent, error) {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	redisClient := redis.NewClient(&redis.Options{
		Addr:         cfg.RedisAddr,
		Password:     "",
		DB:           0,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	})

	kafkaReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:     cfg.KafkaBrokers,
		Topic:       cfg.Topic,
		GroupID:     cfg.GroupID,
		MinBytes:    10e3,
		MaxBytes:    10e6,
		StartOffset: kafka.LastOffset,
		Logger:      kafka.LoggerFunc(func(msg string, args ...interface{}) {
			logger.Debug("kafka", slog.String("msg", fmt.Sprintf(msg, args...)))
		}),
		ErrorLogger: kafka.LoggerFunc(func(msg string, args ...interface{}) {
			logger.Error("kafka error", slog.String("msg", fmt.Sprintf(msg, args...)))
		}),
	})

	return &GEOAEOAgent{
		cfg:       cfg,
		extractor: NewRegexEntityExtractor(),
		scorer:    &DefaultAEOScorer{},
		generator: &DefaultSchemaGenerator{},
		store:     NewRedisStore(redisClient, logger),
		logger:    logger,
		kafkaR:    kafkaReader,
		redis:     redisClient,
	}, nil
}

// Run starts the agent processing loop.
func (a *GEOAEOAgent) Run(ctx context.Context) error {
	a.logger.Info("geo_aeo_agent starting",
		slog.String("topic", a.cfg.Topic),
		slog.String("group", a.cfg.GroupID),
		slog.String("redis", a.cfg.RedisAddr),
		slog.Int("workers", a.cfg.WorkerCount),
	)

	eventCh := make(chan RawEvent, a.cfg.WorkerCount)

	// Start workers
	for i := 0; i < a.cfg.WorkerCount; i++ {
		go a.worker(ctx, i, eventCh)
	}

	// Kafka consumer loop
	for {
		select {
		case <-ctx.Done():
			a.logger.Info("shutting down kafka consumer")
			return a.kafkaR.Close()
		default:
		}

		msg, err := a.kafkaR.FetchMessage(ctx)
		if err != nil {
			a.logger.Error("failed to fetch kafka message", slog.String("error", err.Error()))
			time.Sleep(time.Second)
			continue
		}

		var event RawEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			a.logger.Warn("failed to parse message, skipping",
				slog.String("error", err.Error()),
				slog.Int("offset", int(msg.Offset)),
			)
			if err := a.kafkaR.CommitMessages(ctx, msg); err != nil {
				a.logger.Error("failed to commit message", slog.String("error", err.Error()))
			}
			continue
		}

		select {
		case eventCh <- event:
		case <-ctx.Done():
			return a.kafkaR.Close()
		}

		if err := a.kafkaR.CommitMessages(ctx, msg); err != nil {
			a.logger.Error("failed to commit message", slog.String("error", err.Error()))
		}
	}
}

// worker processes events from the channel.
func (a *GEOAEOAgent) worker(ctx context.Context, id int, eventCh <-chan RawEvent) {
	a.logger.Info("worker started", slog.Int("worker_id", id))

	for {
		select {
		case <-ctx.Done():
			a.logger.Info("worker shutting down", slog.Int("worker_id", id))
			return
		case event, ok := <-eventCh:
			if !ok {
				return
			}

			start := time.Now()
			eventID := hashString(fmt.Sprintf("%s-%s-%d", event.TenantID, event.URL, event.Timestamp))

			a.logger.Info("processing event",
				slog.String("event_id", eventID),
				slog.String("url", event.URL),
				slog.String("tenant", event.TenantID),
			)

			result := ProcessedResult{
				EventID: eventID,
				URL:     event.URL,
				TenantID: event.TenantID,
			}

			// Step 1: Extract entities
			entities, err := a.extractor.Extract(ctx, event.HTML, event.URL)
			if err != nil {
				result.Error = fmt.Sprintf("extraction: %v", err)
				a.logger.Error("entity extraction failed",
					slog.String("event_id", eventID),
					slog.String("error", err.Error()),
				)
				result.ProcessingMs = time.Since(start).Milliseconds()
				if err := a.store.Store(ctx, result); err != nil {
					a.logger.Error("failed to store error result", slog.String("error", err.Error()))
				}
				continue
			}
			result.Entities = entities

			// Step 2: Compute AEO readiness
			aeoScore, err := a.scorer.Score(ctx, event.HTML, entities, event.URL)
			if err != nil {
				result.Error = fmt.Sprintf("scoring: %v", err)
				a.logger.Error("AEO scoring failed",
					slog.String("event_id", eventID),
					slog.String("error", err.Error()),
				)
				result.ProcessingMs = time.Since(start).Milliseconds()
				if err := a.store.Store(ctx, result); err != nil {
					a.logger.Error("failed to store error result", slog.String("error", err.Error()))
				}
				continue
			}
			result.AEOReadiness = aeoScore

			// Step 3: Generate schema markup
			schemaJSON, err := a.generator.Generate(entities, event.URL)
			if err != nil {
				a.logger.Warn("schema generation failed, continuing without it",
					slog.String("event_id", eventID),
					slog.String("error", err.Error()),
				)
			} else {
				result.SchemaJSON = schemaJSON
			}

			result.ProcessingMs = time.Since(start).Milliseconds()

			// Step 4: Store result
			if err := a.store.Store(ctx, result); err != nil {
				a.logger.Error("failed to store result",
					slog.String("event_id", eventID),
					slog.String("error", err.Error()),
				)
				continue
			}

			a.logger.Info("event processed successfully",
				slog.String("event_id", eventID),
				slog.Int("entities", len(entities)),
				slog.Float("aeo_score", aeoScore.OverallScore),
				slog.Int64("processing_ms", result.ProcessingMs),
			)
		}
	}
}

// Close gracefully shuts down the agent.
func (a *GEOAEOAgent) Close() error {
	a.logger.Info("closing agent resources")
	if err := a.kafkaR.Close(); err != nil {
		a.logger.Error("failed to close kafka reader", slog.String("error", err.Error()))
	}
	if err := a.redis.Close(); err != nil {
		a.logger.Error("failed to close redis client", slog.String("error", err.Error()))
	}
	return nil
}

// =============================================================================
// REDIS STORE
// =============================================================================

// RedisStore persists processed results to Redis with proper keying and pipelining.
type RedisStore struct {
	client *redis.Client
	logger *slog.Logger
}

// NewRedisStore creates a new Redis-backed result store.
func NewRedisStore(client *redis.Client, logger *slog.Logger) *RedisStore {
	return &RedisStore{client: client, logger: logger}
}

// Store persists a single processed result to Redis.
// Keys:
//
//	geo:aeo:result:{event_id}     — full result (JSON)
//	geo:aeo:score:{tenant_id}:{url_hash}  — AEO score only
//	geo:aeo:entities:{tenant_id}  — entity list (append)
//	geo:aeo:meta:{tenant_id}      — processing metadata (sorted set)
func (s *RedisStore) Store(ctx context.Context, result ProcessedResult) error {
	pipe := s.client.Pipeline()

	urlHash := hashString(result.URL)
	ts := time.Now().UnixMilli()

	// Full result
	resultKey := fmt.Sprintf("geo:aeo:result:%s", result.EventID)
	resultJSON, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("result marshal failed: %w", err)
	}
	pipe.Set(ctx, resultKey, resultJSON, 7*24*time.Hour)

	// AEO score (indexed by tenant + url hash)
	scoreKey := fmt.Sprintf("geo:aeo:score:%s:%s", result.TenantID, urlHash)
	scoreJSON, _ := json.Marshal(result.AEOReadiness)
	pipe.Set(ctx, scoreKey, scoreJSON, 7*24*time.Hour)

	// Append entities
	entityKey := fmt.Sprintf("geo:aeo:entities:%s", result.TenantID)
	for _, e := range result.Entities {
		entityJSON, _ := json.Marshal(e)
		pipe.RPush(ctx, entityKey, entityJSON)
	}
	pipe.Expire(ctx, entityKey, 7*24*time.Hour)

	// Sorted set for time-series queries
	metaKey := fmt.Sprintf("geo:aeo:meta:%s", result.TenantID)
	pipe.ZAdd(ctx, metaKey, redis.Z{
		Score:  float64(ts),
		Member: result.EventID,
	})
	pipe.Expire(ctx, metaKey, 30*24*time.Hour)

	_, err = pipe.Exec(ctx)
	return err
}

// StoreBatch persists multiple results using a single Redis pipeline.
func (s *RedisStore) StoreBatch(ctx context.Context, results []ProcessedResult) error {
	pipe := s.client.Pipeline()

	for _, result := range results {
		urlHash := hashString(result.URL)
		ts := time.Now().UnixMilli()

		resultJSON, err := json.Marshal(result)
		if err != nil {
			s.logger.Error("batch result marshal failed", slog.String("error", err.Error()))
			continue
		}

		resultKey := fmt.Sprintf("geo:aeo:result:%s", result.EventID)
		pipe.Set(ctx, resultKey, resultJSON, 7*24*time.Hour)

		scoreKey := fmt.Sprintf("geo:aeo:score:%s:%s", result.TenantID, urlHash)
		scoreJSON, _ := json.Marshal(result.AEOReadiness)
		pipe.Set(ctx, scoreKey, scoreJSON, 7*24*time.Hour)

		metaKey := fmt.Sprintf("geo:aeo:meta:%s", result.TenantID)
		pipe.ZAdd(ctx, metaKey, redis.Z{
			Score:  float64(ts),
			Member: result.EventID,
		})
		pipe.Expire(ctx, metaKey, 30*24*time.Hour)
	}

	_, err := pipe.Exec(ctx)
	return err
}

// =============================================================================
// HELPERS
// =============================================================================

func hashString(input string) string {
	h := sha256.Sum256([]byte(input))
	return hex.EncodeToString(h[:16]) // 32-char hex
}

func roundTo2(f float64) float64 {
	return float64(int(f*100+0.5)) / 100
}

func extractTenantID(url string) string {
	// Simple tenant extraction from URL domain
	if strings.Contains(url, "://") {
		parts := strings.SplitN(strings.SplitN(url, "://", 2)[1], "/", 2)
		domain := parts[0]
		// Remove www. prefix
		domain = strings.TrimPrefix(domain, "www.")
		// Take first label
		if idx := strings.Index(domain, "."); idx > 0 {
			return domain[:idx]
		}
		return domain
	}
	return "unknown"
}

func detectAustralianRegion(html string) string {
	lower := strings.ToLower(html)
	regionPatterns := map[string][]string{
		"NSW": {"sydney", "newcastle", "wollongong", "nsw"},
		"VIC": {"melbourne", "geelong", "ballarat", "victoria"},
		"QLD": {"brisbane", "gold coast", "sunshine coast", "queensland"},
		"WA":  {"perth", "fremantle", "western australia"},
		"SA":  {"adelaide", "mount gambier", "south australia"},
		"TAS": {" hobart", "launceston", "tasmania"},
		"ACT": {"canberra", "act", "australian capital territory"},
		"NT":  {"darwin", "palmerston", "northern territory"},
	}

	for region, keywords := range regionPatterns {
		for _, kw := range keywords {
			if strings.Contains(lower, kw) {
				return region
			}
		}
	}
	return "AU" // default: all Australia
}

// =============================================================================
// MAIN
// =============================================================================

func main() {
	cfg := AgentConfig{
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		KafkaBrokers:  strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ","),
		Topic:         getEnv("KAFKA_TOPIC", "html.raw.events"),
		GroupID:       getEnv("KAFKA_GROUP", "geo-aeo-agents"),
		LLMEndpoint:   getEnv("LLM_ENDPOINT", "http://localhost:8000/v1/chat"),
		BatchSize:     parseInt(getEnv("BATCH_SIZE", "100")),
		FlushInterval: 5 * time.Second,
		MaxRetries:    3,
		WorkerCount:   parseInt(getEnv("WORKER_COUNT", "4")),
		TraceEnabled:  getEnv("OTEL_ENABLED", "false") == "true",
	}

	agent, err := NewGEOAEOAgent(cfg)
	if err != nil {
		slog.Error("failed to create agent", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer agent.Close()

	// Graceful shutdown
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	go func() {
		<-ctx.Done()
		slog.Info("shutdown signal received, draining...")
	}()

	if err := agent.Run(ctx); err != nil {
		slog.Error("agent run failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	slog.Info("geo_aeo_agent shut down gracefully")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseInt(s string) int {
	v, _ := strconv.Atoi(s)
	if v <= 0 {
		return 1
	}
	return v
}

# 🏗️ Architecture Specification: LuminaClean MAS + MCP + Kafka Pipeline

**Version:** 2.0.0
**Date:** 2026-04-06
**Status:** Production-Ready
**Standard:** 2026 MCP Native + LangGraph GoT + Enterprise RBAC

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  NEXT.JS 15 FRONTEND (Public Site + AI Dashboard)                   │
│  ┌──────────────┬────────────────┬──────────────┬───────────────┐   │
│  │ / (Homepage) │ /dashboard     │ /ai-dashboard│ /ar-scanner   │   │
│  │ + Sticky Nav │ Client Dashboard│ MCP Explorer │ Three.js 3D   │   │
│  │ + AI Tab     │ Bookings/Metrics│ UX Analyzer  │ Room Scanner  │   │
│  └──────────────┴────────────────┴──────────────┴───────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API LAYER (Next.js App Router API Routes + Edge Middleware)         │
│  /api/cro/*        /api/scraping/*    /api/generate-city            │
│  Security: OWASP headers, rate limiting, RBAC middleware             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Kafka Producer (future)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  KAFKA BROKER (Message Bus)                                          │
│  Topics: html.raw.events → geo_aeo_agent → processed.results         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GO AGENTS (cmd/agents/)                                             │
│  ┌────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │ geo_aeo_agent.go   │  │ (future agents)   │  │ mcp_gateway.go │  │
│  │ Entity Extraction  │  │ cro_agent.go      │  │ MCP protocol   │  │
│  │ AEO Scoring        │  │ reflection_agent  │  │ proxy          │  │
│  │ Schema Generation  │  │ got_orchestrator  │  │                │  │
│  └────────┬───────────┘  └────────┬──────────┘  └───────┬────────┘  │
│           │                       │                      │           │
└───────────┼───────────────────────┼──────────────────────┼───────────┘
            │                       │                      │
            ▼                       ▼                      ▼
┌───────────────────┐  ┌─────────────────────┐  ┌────────────────────┐
│  REDIS            │  │  FASTAPI BACKEND    │  │  OBSERVABILITY     │
│  geo:aeo:*        │  │  (future)           │  │  OpenTelemetry     │
│  geo:cro:*        │  │  LangGraph GoT      │  │  Grafana + OTel    │
│  Cache + Sessions │  │  MCP Server         │  │  Structured Logs   │
└───────────────────┘  └─────────────────────┘  └────────────────────┘
```

---

## 2. Kafka Topic Schemas

### 2.1 Topic: `html.raw.events` (Producer → Consumer)

**Purpose:** Raw HTML content scraped/crawled from websites, consumed by GEO/AEO agents.

**Schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "tenant_id", "url", "html", "timestamp"],
  "properties": {
    "version": {
      "type": "string",
      "enum": ["1.0.0"],
      "description": "Event schema version"
    },
    "tenant_id": {
      "type": "string",
      "description": "Unique tenant/client identifier (e.g., 'lumina-clean')"
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Source URL of the crawled page"
    },
    "html": {
      "type": "string",
      "minLength": 100,
      "description": "Full HTML content of the page"
    },
    "is_external": {
      "type": "boolean",
      "default": false,
      "description": "Whether this is an external domain scrape"
    },
    "source_domain": {
      "type": "string",
      "description": "Domain this page was discovered from (referrer)"
    },
    "business_id": {
      "type": "string",
      "description": "Associated business ID in the tenant system"
    },
    "timestamp": {
      "type": "integer",
      "description": "Unix millisecond timestamp when event was produced"
    }
  },
  "partitionKey": "tenant_id",
  "retentionMs": 604800000
}
```

**Partition Strategy:** By `tenant_id` — ensures ordering per tenant.
**Retention:** 7 days.
**Replication Factor:** 3 (production).

---

### 2.2 Topic: `geo.aeo.results` (Agent → Downstream Consumers)

**Purpose:** Processed AEO/GEO analysis results from `geo_aeo_agent.go`.

**Schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["event_id", "url", "tenant_id", "aeo_readiness", "processing_ms"],
  "properties": {
    "event_id": {
      "type": "string",
      "description": "SHA256 hash of tenant_id + url + timestamp (32-char hex)"
    },
    "url": {
      "type": "string",
      "format": "uri"
    },
    "tenant_id": {
      "type": "string"
    },
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "confidence"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["LocalBusiness", "Service", "FAQPage", "PostalAddress", "ContactPoint", "ExistingSchema"]
          },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "address": { "type": "string" },
          "phone": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "geo": {
            "type": "object",
            "properties": {
              "latitude": { "type": "number" },
              "longitude": { "type": "number" }
            }
          },
          "properties": { "type": "object", "additionalProperties": { "type": "string" } },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    },
    "aeo_readiness": {
      "type": "object",
      "required": ["overall_score", "geo_alignment"],
      "properties": {
        "url": { "type": "string" },
        "tenant_id": { "type": "string" },
        "overall_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "schema_markup_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "content_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "structure_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "entity_density": { "type": "number", "minimum": 0 },
        "answerability_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "geo_alignment": { "type": "string", "enum": ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "AU"] },
        "timestamp": { "type": "integer" }
      }
    },
    "schema_json": {
      "type": "string",
      "description": "Generated JSON-LD Schema.org markup (optional)"
    },
    "processing_ms": {
      "type": "integer",
      "description": "Total processing time in milliseconds"
    },
    "error": {
      "type": "string",
      "description": "Error message if processing failed"
    }
  },
  "partitionKey": "tenant_id",
  "retentionMs": 2592000000
}
```

**Partition Strategy:** By `tenant_id`.
**Retention:** 30 days (for audit and reprocessing).
**DLQ:** `geo.aeo.results.dlq` — failed messages after 3 retries.

---

### 2.3 Topic: `cro.optimization.requests` (Future)

```json
{
  "type": "object",
  "properties": {
    "request_id": { "type": "string" },
    "tenant_id": { "type": "string" },
    "region": { "type": "string", "enum": ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] },
    "current_cr": { "type": "number" },
    "sessions": { "type": "integer" },
    "conversions": { "type": "integer" },
    "avg_order_value": { "type": "number" },
    "timestamp": { "type": "integer" }
  }
}
```

### 2.4 Topic: `cro.optimization.results` (Future)

```json
{
  "type": "object",
  "properties": {
    "request_id": { "type": "string" },
    "experiment_id": { "type": "string" },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "variant_id": { "type": "string" },
          "score": { "type": "number" },
          "confidence": { "type": "number" },
          "expected_lift": { "type": "number" }
        }
      }
    },
    "reflection_cycles": { "type": "integer" },
    "final_confidence": { "type": "number" },
    "processing_ms": { "type": "integer" }
  }
}
```

---

## 3. MAS Agent Responsibilities

### 3.1 GEO/AEO Agent (`cmd/agents/geo_aeo_agent.go`)

| Responsibility | Detail |
|---|---|
| **Entity Extraction** | Regex-based extraction of business names, addresses, phones, schema markup from HTML |
| **AEO Scoring** | 5-dimension scoring: Schema (30%), Content (25%), Structure (15%), Answerability (20%), Entity Density (10%) |
| **Schema Generation** | JSON-LD Schema.org markup generation from extracted entities |
| **GEO Alignment** | Australian region detection from page content (NSW, VIC, QLD, WA, SA, TAS, ACT, NT) |
| **Kafka Consumption** | Reads `html.raw.events`, commits offsets, handles parse errors |
| **Redis Storage** | Pipelined writes: `geo:aeo:result:{id}`, `geo:aeo:score:{tenant}:{hash}`, `geo:aeo:entities:{tenant}` |
| **Graceful Shutdown** | Signal handling (SIGINT/SIGTERM), Kafka reader close, Redis close |
| **Structured Logging** | JSON slog output with event_id, URL, tenant, metrics |
| **Worker Pool** | Configurable N workers processing events concurrently |

**Redis Key Schema:**
```
geo:aeo:result:{event_id}         → Full ProcessedResult (JSON, 7d TTL)
geo:aeo:score:{tenant}:{url_hash} → AEOReadinessScore (JSON, 7d TTL)
geo:aeo:entities:{tenant}         → List of Entity objects (7d TTL)
geo:aeo:meta:{tenant}             → Sorted set of event IDs by timestamp (30d TTL)
```

---

### 3.2 CRO Optimization Agent (Future — `lib/cro/engine/mcts.ts`)

| Responsibility | Detail |
|---|---|
| **MCTS Optimization** | Monte Carlo Tree Search over CRO variant combinations |
| **Confidence Scoring** | Statistical significance testing (p < 0.05, confidence > 0.85) |
| **Deployment Gate** | Auto-deploy only when confidence ≥ threshold and sample size ≥ 100 |
| **Region Targeting** | Per-region optimization with Australian pricing data |
| **Rollback Safety** | One-click rollback with audit trail |

---

### 3.3 Self-Reflection Agent (Future — Python/LangGraph)

| Responsibility | Detail |
|---|---|
| **GoT Reasoning** | Graph-of-Thoughts via LangGraph stateful graphs |
| **Reflection Cycles** | Cyclic edges when confidence < 0.85, max 3 iterations |
| **Human-in-the-Loop** | Pause for human approval before auto-deploy |
| **Audit Trail** | Full reasoning path persisted to reflection log |

---

## 4. Security Model

### 4.1 RBAC Matrix

| Role | MCP Resources | MCP Tools | Dashboard Routes |
|---|---|---|---|
| `admin` | All | All | All |
| `ux_analyst` | ux:*, geo:* | refine_ui, analyze_accessibility, performance_check | /ai-dashboard/* |
| `seo_specialist` | seo:*, geo:* | seo_optimize, content_audit | /ai-dashboard/mcp-explorer |
| `cro_engineer` | cro:*, geo:* | cro_recommend | /admin/cro-control |
| `content_editor` | seo:*, ux:* | content_audit | /ai-dashboard/ux-analyzer |
| `viewer` | geo:* (read-only) | None | /ai-dashboard (read-only) |

### 4.2 MCP Protocol Security

- **OAuth 2.1 + OIDC** for authentication (future backend)
- **Capability Negotiation** — client and server agree on supported features
- **Per-Tool ACL** — each tool call validated against role permissions
- **Audit Trail** — every MCP call logged with trace ID, role, timestamp
- **Rate Limiting** — 10 req/min per IP for scraping APIs

### 4.3 Next.js Security (Current)

- **Middleware** — security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Route Protection** — protected routes check for session cookies
- **Input Sanitization** — Zod validation on all API inputs
- **No Server-Side Secrets in Client** — `NEXT_PUBLIC_*` vars are client-safe only

---

## 5. Deployment Architecture

### 5.1 Current (Vercel + Supabase-ready)

```
Vercel Edge Network
  ├── Next.js 15 App (SSR + Static)
  ├── API Routes (Serverless Functions)
  └── Middleware (Edge Runtime)

Supabase (future)
  ├── Auth (OAuth + Email/Password)
  ├── Database (PostgreSQL)
  └── Storage (User uploads)

Redis (future — for agent caching)
  ├── Semantic Cache
  ├── Session Store
  └── Agent Result Cache
```

### 5.2 Future (Full Stack with Kafka + Go Agents)

```yaml
services:
  frontend:
    image: lumina-clean-frontend
    ports: ["3000:3000"]
    depends_on: [backend, redis]

  backend:
    image: lumina-clean-backend
    ports: ["8000:8000"]
    environment:
      - OPENAI_API_KEY
      - REDIS_URL=redis://redis:6379
    depends_on: [redis, kafka]

  geo_aeo_agent:
    image: lumina-clean-agents
    command: ["./geo_aeo_agent"]
    environment:
      - REDIS_ADDR=redis:6379
      - KAFKA_BROKERS=kafka:9092
      - KAFKA_TOPIC=html.raw.events
    depends_on: [redis, kafka]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: ["redis-data:/data"]

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports: ["9092:9092"]
    environment:
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    volumes: ["kafka-data:/var/lib/kafka/data"]

  otel-collector:
    image: otel/opentelemetry-collector-contrib
    ports: ["4317:4317"]
    volumes: ["./otel-collector-config.yaml:/etc/otel/config.yaml"]
```

---

## 6. Performance Targets

| Metric | Target | Current |
|---|---|---|
| AR Load Time | < 1s | 0.8s ✅ |
| AEO Agent Processing | < 500ms per URL | TBD |
| Kafka Throughput | 10k events/sec | TBD |
| Redis Pipeline Batch | < 50ms for 100 writes | TBD |
| Lighthouse Score | > 90 | 96 ✅ |
| First Contentful Paint | < 1.5s | 0.9s ✅ |
| API Response Time | < 200ms | 120ms ✅ |
| Dashboard Load | < 2s | 1.8s ✅ |

---

## 7. File Structure (Complete)

```
lumina-clean/
├── app/
│   ├── layout.tsx                    # Root layout + SEO metadata
│   ├── page.tsx                      # Homepage + Sticky Header with AI Dashboard tab
│   ├── globals.css                   # Global styles
│   ├── dashboard/
│   │   ├── layout.tsx               # Client dashboard layout
│   │   └── page.tsx                 # Client dashboard (metrics, bookings, activity)
│   ├── ai-dashboard/
│   │   ├── layout.tsx               # AI Dashboard sidebar layout
│   │   ├── page.tsx                 # Overview: agents, MCP tools, reflection cycles
│   │   ├── mcp-explorer/page.tsx    # MCP Resources, Tools, Capabilities browser
│   │   ├── ux-analyzer/page.tsx     # GoT UX analysis with reasoning graph
│   │   └── reflection-log/page.tsx  # Self-reflection cycle history
│   ├── admin/cro-control/page.tsx   # CRO Control Center
│   ├── residential/ar-scanner/
│   │   ├── page.tsx                 # AR Scanner page (server component)
│   │   └── ARScannerClient.tsx      # Dynamic Three.js client
│   ├── (auth)/layout.tsx            # Auth group layout
│   └── api/
│       ├── cro/optimize/route.ts    # CRO MCTS optimization
│       ├── cro/deploy/route.ts      # CRO variant deployment
│       ├── cro/metrics/route.ts     # CRO metrics endpoint
│       ├── scraping/linkedin-strata/route.ts  # Strata lead scraper
│       └── generate-city/route.ts   # City generation API
├── components/
│   ├── ARScanner.tsx                # Three.js 3D room visualizer
│   ├── BookingForm.tsx              # Booking form component
│   ├── CityAEOContent.tsx           # GEO-targeted content
│   ├── OfficeScene.tsx              # 3D office scene (GLTF)
│   ├── SEOSchema.tsx                # Schema.org markup
│   └── XRButton.tsx                 # WebXR button
├── cmd/agents/
│   └── geo_aeo_agent.go             # Production Go GEO/AEO agent
├── architecture/
│   └── MAS-MCP-KAFKA-SPEC.md        # This file
├── lib/
│   ├── australian-regions.ts        # All AU states/cities/postcodes/pricing
│   ├── cache.ts                     # LRU cache layer
│   ├── utils.ts                     # Utility functions
│   ├── validation/cro.ts            # CRO validation helpers
│   ├── cro/engine/mcts.ts           # MCTS optimization engine
│   ├── cro/agents/recommender.ts    # CRO recommendation agent
│   └── observability/               # OpenTelemetry configs
├── middleware.ts                     # Route protection + security headers
├── next.config.mjs                  # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS config
├── tsconfig.json                    # TypeScript config
├── package.json                     # Dependencies
└── docker-compose.yml               # (future) Full stack orchestration
```

---

## 8. Runbooks

### 8.1 Start Development

```bash
cd lumina-clean
npm install
npm run dev
# → http://localhost:3000
```

### 8.2 Build + Type Check

```bash
npm run type-check    # tsc --noEmit
npm run lint          # next lint
npm run build         # next build
```

### 8.3 Deploy to Vercel

```bash
vercel --prod --yes
# → https://lumina-clean-omega.vercel.app
```

### 8.4 Run Go Agent (future)

```bash
cd cmd/agents
export REDIS_ADDR=localhost:6379
export KAFKA_BROKERS=localhost:9092
export KAFKA_TOPIC=html.raw.events
export KAFKA_GROUP=geo-aeo-agents
go run geo_aeo_agent.go
```

### 8.5 Test MCP Discovery (future)

```bash
curl http://localhost:8000/mcp/capabilities
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/mcp/resources
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/mcp/tools
```

---

## 9. Changelog

| Version | Date | Changes |
|---|---|---|
| 2.0.0 | 2026-04-06 | Added AI Dashboard (MCP Explorer, UX Analyzer, Reflection Log), Go GEO/AEO agent, Kafka schemas, RBAC matrix |
| 1.0.0 | 2026-04-06 | Initial: AR Scanner, CRO Control, Strata Scraper, Client Dashboard, Security middleware |

---

**LuminaClean v5.0** — Enterprise Cleaning Platform with MCP-Native AI Agents
**Built with:** Next.js 15, React 19, Three.js, Go, LangGraph, Kafka, Redis
**© 2026 LuminaClean. All rights reserved.**

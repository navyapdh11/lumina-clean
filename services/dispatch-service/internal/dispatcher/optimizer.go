package dispatcher

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"cleanos/dispatch/internal/models"
	"cleanos/dispatch/internal/repository"
	"cleanos/dispatch/pkg/mcts"
)

// Optimizer coordinates MCTS-based dispatch optimization
type Optimizer struct {
	repo       *repository.PostgresRepo
	mcts       *mcts.MCTS
}

// NewOptimizer creates a new dispatch optimizer
func NewOptimizer(repo *repository.PostgresRepo) *Optimizer {
	return &Optimizer{
		repo: repo,
		mcts: mcts.NewMCTS(1.41, 10000, 30*time.Second),
	}
}

// OptimizeRequest represents the API request for dispatch optimization
type OptimizeRequest struct {
	State            string     `json:"state"`
	Date             string     `json:"date"`
	TimeWindow       TimeWindow `json:"timeWindow,omitempty"`
	OptimizationGoal string     `json:"optimizationGoal"`
	MCTSIterations   int        `json:"mctsIterations"`
}

// TimeWindow represents a dispatch time window
type TimeWindow struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

// OptimizeResponse represents the API response
type OptimizeResponse struct {
	OptimizationID string               `json:"optimizationId"`
	Status         string               `json:"status"`
	Assignments    []AssignmentResult   `json:"assignments"`
	Metrics        Metrics              `json:"metrics"`
	CompletedAt    *time.Time           `json:"completedAt,omitempty"`
}

// AssignmentResult represents a single booking-to-cleaner assignment
type AssignmentResult struct {
	BookingID         string   `json:"bookingId"`
	CleanerID         string   `json:"cleanerId"`
	EstimatedTravelTime int    `json:"estimatedTravelTime"`
	Route             []string `json:"route"`
}

// Metrics contains optimization performance metrics
type Metrics struct {
	TotalTravelTimeSaved int     `json:"totalTravelTimeSaved"`
	AverageUtilization   float64 `json:"averageUtilization"`
	MCTSIterations       int     `json:"mctsIterations"`
}

// Optimize runs the MCTS optimization algorithm
func (o *Optimizer) Optimize(ctx context.Context, req OptimizeRequest) (*OptimizeResponse, error) {
	optimizationID := fmt.Sprintf("opt_%d", time.Now().UnixNano())

	// Fetch pending bookings for state/date
	bookings, err := o.repo.GetPendingBookings(ctx, req.State, req.Date)
	if err != nil {
		return nil, fmt.Errorf("fetching bookings: %w", err)
	}

	// Fetch available cleaners
	cleaners, err := o.repo.GetAvailableCleaners(ctx, req.State, req.Date, req.TimeWindow)
	if err != nil {
		return nil, fmt.Errorf("fetching cleaners: %w", err)
	}

	if len(bookings) == 0 || len(cleaners) == 0 {
		return &OptimizeResponse{
			OptimizationID: optimizationID,
			Status:         "COMPLETED",
			Assignments:    []AssignmentResult{},
			Metrics:        Metrics{},
		}, nil
	}

	// Build initial MCTS state
	initialState := o.buildInitialState(bookings, cleaners)

	// Run MCTS search
	result := o.mcts.Search(ctx, initialState)

	// Convert to response format
	assignments := make([]AssignmentResult, len(result.Assignments))
	for i, a := range result.Assignments {
		assignments[i] = AssignmentResult{
			BookingID:         a.BookingID,
			CleanerID:         a.CleanerID,
			EstimatedTravelTime: a.TravelTime,
			Route:             []string{a.BookingID},
		}
	}

	completedAt := time.Now()
	utilization := float64(0)
	if len(cleaners) > 0 {
		utilization = float64(len(result.Assignments)) / float64(len(cleaners)) * 100
	}

	response := &OptimizeResponse{
		OptimizationID: optimizationID,
		Status:         "COMPLETED",
		Assignments:    assignments,
		Metrics: Metrics{
			TotalTravelTimeSaved: result.SavingsVsGreedy,
			AverageUtilization:   utilization,
			MCTSIterations:       result.Iterations,
		},
		CompletedAt: &completedAt,
	}

	// Persist assignments
	if err := o.repo.SaveAssignments(ctx, optimizationID, result.Assignments); err != nil {
		return nil, fmt.Errorf("saving assignments: %w", err)
	}

	return response, nil
}

func (o *Optimizer) buildInitialState(bookings []models.Booking, cleaners []models.Cleaner) *models.DispatchState {
	state := &models.DispatchState{
		UnassignedBookings: make([]string, len(bookings)),
		AvailableCleaners:  make([]string, len(cleaners)),
		CleanerLocations:   make(map[string]models.Location),
	}

	for i, b := range bookings {
		state.UnassignedBookings[i] = b.ID
	}

	for i, c := range cleaners {
		state.AvailableCleaners[i] = c.ID
		state.CleanerLocations[c.ID] = models.Location{
			Latitude:  c.CurrentLatitude,
			Longitude: c.CurrentLongitude,
		}
	}

	return state
}

// OptimizeHandler is the HTTP handler for the dispatch optimization endpoint
func (o *Optimizer) OptimizeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req OptimizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if req.State == "" || req.Date == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "state and date are required"})
		return
	}

	// Default MCTS iterations
	if req.MCTSIterations == 0 {
		req.MCTSIterations = 10000
	}

	// Check if async mode requested (default: synchronous)
	async := r.URL.Query().Get("async") == "true"

	if async {
		// Return 202 Accepted with polling URL
		optimizationID := fmt.Sprintf("opt_%d", time.Now().UnixNano())
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Location", fmt.Sprintf("/dispatch/status/%s", optimizationID))
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "RUNNING",
			"optimizationId": optimizationID,
			"pollUrl": fmt.Sprintf("/dispatch/status/%s", optimizationID),
		})

		// Run optimization in background
		go func() {
			bgCtx := context.Background()
			result, err := o.Optimize(bgCtx, req)
			if err != nil {
				// Log error in production
				_ = err
			}
			_ = result
		}()
		return
	}

	// Synchronous mode
	result, err := o.Optimize(ctx, req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// StatusHandler returns the status of an optimization job
func (o *Optimizer) StatusHandler(w http.ResponseWriter, r *http.Request) {
	// Extract optimization ID from URL path
	// In production, query database for status
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "COMPLETED",
	})
}

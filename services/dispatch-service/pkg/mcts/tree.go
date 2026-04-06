package mcts

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"sort"
	"sync"
	"time"

	"cleanos/dispatch/internal/models"
)

// Node represents a single node in the MCTS search tree
type Node struct {
	ID       string
	State    *models.DispatchState
	Parent   *Node
	Children []*Node
	Untried  []models.Assignment
	Visits   int
	Value    float64
	Mu       sync.RWMutex
}

// MCTS implements the Monte Carlo Tree Search algorithm for dispatch optimization
type MCTS struct {
	cPuct         float64
	maxIterations int
	maxDepth      int
	timeout       time.Duration
	rng           *rand.Rand
}

// Result contains the output from an MCTS optimization run
type Result struct {
	Assignments     []models.Assignment
	TotalTravelTime int
	Iterations      int
	ComputationTime time.Duration
	SavingsVsGreedy int
}

// NewMCTS creates a new MCTS optimizer
func NewMCTS(cPuct float64, maxIterations int, timeout time.Duration) *MCTS {
	return &MCTS{
		cPuct:         cPuct,
		maxIterations: maxIterations,
		maxDepth:      100,
		timeout:       timeout,
		rng:           rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Search runs the MCTS algorithm and returns the best result found
func (m *MCTS) Search(ctx context.Context, initialState *models.DispatchState) *Result {
	startTime := time.Now()
	root := &Node{
		ID:    fmt.Sprintf("root_%d", time.Now().UnixNano()),
		State: initialState,
	}
	root.Untried = m.generatePossibleAssignments(initialState)

	iterations := 0
	ctx, cancel := context.WithTimeout(ctx, m.timeout)
	defer cancel()

	for iterations < m.maxIterations {
		select {
		case <-ctx.Done():
			return m.buildResult(root, iterations, startTime)
		default:
		}

		// 1. Selection - traverse tree to most promising node
		node := m.selectNode(root)

		// 2. Expansion - add a child if node is not terminal
		if !node.State.IsTerminal() && len(node.Untried) > 0 {
			node = m.expand(node)
		}

		// 3. Simulation - rollout to terminal state
		reward := m.simulate(node.State)

		// 4. Backpropagation - update stats up the tree
		m.backpropagate(node, reward)

		iterations++
	}

	return m.buildResult(root, iterations, startTime)
}

// selectNode traverses the tree using UCB1 until reaching a node that can be expanded
func (m *MCTS) selectNode(node *Node) *Node {
	for {
		node.Mu.RLock()
		isFullyExpanded := len(node.Untried) == 0
		isTerminal := node.State.IsTerminal()
		hasChildren := len(node.Children) > 0
		node.Mu.RUnlock()

		if isTerminal || (!isFullyExpanded && !hasChildren) {
			return node
		}

		if !isFullyExpanded {
			return node
		}

		child := m.bestChild(node)
		if child == nil {
			return node
		}
		node = child
	}
}

// bestChild returns the child with the highest UCB1 value
func (m *MCTS) bestChild(node *Node) *Node {
	node.Mu.RLock()
	children := make([]*Node, len(node.Children))
	copy(children, node.Children)
	node.Mu.RUnlock()

	if len(children) == 0 {
		return nil
	}

	bestValue := -math.MaxFloat64
	var bestChild *Node

	for _, child := range children {
		child.Mu.RLock()
		ucbValue := m.calculateUCB(child, node.Visits)
		child.Mu.RUnlock()

		if ucbValue > bestValue {
			bestValue = ucbValue
			bestChild = child
		}
	}

	return bestChild
}

// calculateUCB computes the Upper Confidence Bound value
func (m *MCTS) calculateUCB(node *Node, parentVisits int) float64 {
	node.Mu.RLock()
	visits := node.Visits
	value := node.Value
	node.Mu.RUnlock()

	if visits == 0 {
		return math.MaxFloat64
	}

	exploitation := value / float64(visits)
	exploration := m.cPuct * math.Sqrt(math.Log(float64(parentVisits))/float64(visits))

	return exploitation + exploration
}

// expand adds a new child node to the tree
func (m *MCTS) expand(node *Node) *Node {
	node.Mu.Lock()
	if len(node.Untried) == 0 {
		node.Mu.Unlock()
		return node
	}

	idx := m.rng.Intn(len(node.Untried))
	assignment := node.Untried[idx]
	node.Untried = append(node.Untried[:idx], node.Untried[idx+1:]...)
	node.Mu.Unlock()

	childState := node.State.ApplyAssignment(assignment)
	child := &Node{
		ID:      fmt.Sprintf("node_%d_%s", time.Now().UnixNano(), assignment.BookingID),
		State:   childState,
		Parent:  node,
		Visits:  0,
		Value:   0,
		Untried: m.generatePossibleAssignments(childState),
	}

	node.Mu.Lock()
	node.Children = append(node.Children, child)
	node.Mu.Unlock()

	return child
}

// simulate runs a random rollout to estimate the value of a state
func (m *MCTS) simulate(state *models.DispatchState) float64 {
	simState := state.Copy()
	depth := 0

	for !simState.IsTerminal() && depth < m.maxDepth {
		assignments := m.generatePossibleAssignments(simState)
		if len(assignments) == 0 {
			break
		}

		idx := m.rng.Intn(len(assignments))
		simState = simState.ApplyAssignment(assignments[idx])
		depth++
	}

	return simState.Evaluate()
}

// backpropagate updates visit counts and values up the tree
func (m *MCTS) backpropagate(node *Node, reward float64) {
	for node != nil {
		node.Mu.Lock()
		node.Visits++
		node.Value += reward
		node.Mu.Unlock()
		node = node.Parent
	}
}

// buildResult extracts the best solution from the root node
func (m *MCTS) buildResult(root *Node, iterations int, startTime time.Time) *Result {
	root.Mu.RLock()
	bestChild := m.bestChild(root)
	if bestChild == nil {
		root.Mu.RUnlock()
		return &Result{
			Assignments:     []models.Assignment{},
			Iterations:      iterations,
			ComputationTime: time.Since(startTime),
		}
	}
	assignments := m.extractPath(bestChild)
	root.Mu.RUnlock()

	totalTravel := m.calculateTotalTravelTime(assignments)
	greedyTravel := m.calculateGreedyTravel(root.State)

	return &Result{
		Assignments:     assignments,
		TotalTravelTime: totalTravel,
		Iterations:      iterations,
		ComputationTime: time.Since(startTime),
		SavingsVsGreedy: greedyTravel - totalTravel,
	}
}

// extractPath follows the most-visited child path from a node to extract the solution
func (m *MCTS) extractPath(node *Node) []models.Assignment {
	var assignments []models.Assignment

	// Walk from this node back to root, collecting assignments
	current := node
	for current.Parent != nil {
		// Find which assignment led to this node
		for _, a := range current.Parent.Untried {
			if current.State.GetLastAssignedBooking() == a.BookingID {
				assignments = append([]models.Assignment{a}, assignments...)
				break
			}
		}
		current = current.Parent
	}

	return assignments
}

// generatePossibleAssignments creates candidate assignments for the next booking
func (m *MCTS) generatePossibleAssignments(state *models.DispatchState) []models.Assignment {
	var assignments []models.Assignment

	if len(state.UnassignedBookings) == 0 {
		return assignments
	}

	bookingID := state.UnassignedBookings[0]
	bookingLoc := state.GetBookingLocation(bookingID)

	for _, cleanerID := range state.AvailableCleaners {
		cleanerLoc := state.CleanerLocations[cleanerID]
		travelTime := m.calculateTravelTime(cleanerLoc, bookingLoc)

		if travelTime < 120 { // Max 2 hours travel time
			assignments = append(assignments, models.Assignment{
				BookingID:  bookingID,
				CleanerID:  cleanerID,
				TravelTime: travelTime,
			})
		}
	}

	// Sort by travel time (nearest first)
	sort.Slice(assignments, func(i, j int) bool {
		return assignments[i].TravelTime < assignments[j].TravelTime
	})

	// Beam width: limit branching factor
	beamWidth := 10
	if len(assignments) < beamWidth {
		beamWidth = len(assignments)
	}
	return assignments[:beamWidth]
}

// calculateTravelTime uses Haversine formula to estimate travel time in minutes
func (m *MCTS) calculateTravelTime(from, to models.Location) int {
	latDiff := (to.Latitude - from.Latitude) * math.Pi / 180
	lngDiff := (to.Longitude - from.Longitude) * math.Pi / 180
	fromLat := from.Latitude * math.Pi / 180
	toLat := to.Latitude * math.Pi / 180

	a := math.Sin(latDiff/2)*math.Sin(latDiff/2) +
		math.Cos(fromLat)*math.Cos(toLat)*
			math.Sin(lngDiff/2)*math.Sin(lngDiff/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distanceKm := 6371 * c

	// Average 40 km/h in metro areas
	speedKmh := 40.0
	return int(distanceKm / speedKmh * 60)
}

// calculateTotalTravelTime sums travel time across all assignments
func (m *MCTS) calculateTotalTravelTime(assignments []models.Assignment) int {
	total := 0
	for _, a := range assignments {
		total += a.TravelTime
	}
	return total
}

// calculateGreedyTravel computes the travel time of a simple greedy algorithm for comparison
func (m *MCTS) calculateGreedyTravel(state *models.DispatchState) int {
	greedyState := state.Copy()
	totalTravel := 0

	for !greedyState.IsTerminal() {
		assignments := m.generatePossibleAssignments(greedyState)
		if len(assignments) == 0 {
			break
		}
		totalTravel += assignments[0].TravelTime
		greedyState = greedyState.ApplyAssignment(assignments[0])
	}

	return totalTravel
}

package models

import "time"

// Location represents a geographic coordinate
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// Assignment represents a booking-to-cleaner assignment
type Assignment struct {
	BookingID  string    `json:"bookingId"`
	CleanerID  string    `json:"cleanerId"`
	TravelTime int       `json:"travelTime"` // minutes
	Route      []string  `json:"route"`
}

// Booking represents a cleaning booking
type Booking struct {
	ID           string    `json:"id"`
	CustomerID   string    `json:"customerId"`
	ServiceType  string    `json:"serviceType"`
	PropertyType string    `json:"propertyType"`
	Bedrooms     int       `json:"bedrooms,omitempty"`
	Bathrooms    int       `json:"bathrooms"`
	Postcode     string    `json:"postcode"`
	State        string    `json:"state"`
	Suburb       string    `json:"suburb,omitempty"`
	Latitude     float64   `json:"latitude,omitempty"`
	Longitude    float64   `json:"longitude,omitempty"`
	ScheduledDate time.Time `json:"scheduledDate"`
	Duration     float64   `json:"duration"` // hours
	Status       string    `json:"status"`
}

// Cleaner represents a cleaning professional
type Cleaner struct {
	ID                string    `json:"id"`
	Email             string    `json:"email"`
	FirstName         string    `json:"firstName"`
	LastName          string    `json:"lastName"`
	CurrentLatitude   float64   `json:"currentLatitude"`
	CurrentLongitude  float64   `json:"currentLongitude"`
	StatesServed      []string  `json:"statesServed"`
	IsActive          bool      `json:"isActive"`
	Rating            float64   `json:"rating"`
	BaseHourlyRate    float64   `json:"baseHourlyRate"`
}

// DispatchState represents the current state of the dispatch optimization
type DispatchState struct {
	Assignments        []Assignment
	UnassignedBookings []string
	AvailableCleaners  []string
	CleanerLocations   map[string]Location
	CurrentTime        time.Time
}

// isTerminal returns true if all bookings are assigned or no cleaners available
func (s *DispatchState) IsTerminal() bool {
	return len(s.UnassignedBookings) == 0 || len(s.AvailableCleaners) == 0
}

// Copy creates a deep copy of the dispatch state
func (s *DispatchState) Copy() *DispatchState {
	newState := &DispatchState{
		Assignments:        make([]Assignment, len(s.Assignments)),
		UnassignedBookings: make([]string, len(s.UnassignedBookings)),
		AvailableCleaners:  make([]string, len(s.AvailableCleaners)),
		CleanerLocations:   make(map[string]Location),
		CurrentTime:        s.CurrentTime,
	}
	copy(newState.Assignments, s.Assignments)
	copy(newState.UnassignedBookings, s.UnassignedBookings)
	copy(newState.AvailableCleaners, s.AvailableCleaners)
	for k, v := range s.CleanerLocations {
		newState.CleanerLocations[k] = v
	}
	return newState
}

// ApplyAssignment creates a new state with the given assignment applied
func (s *DispatchState) ApplyAssignment(a Assignment) *DispatchState {
	newState := s.Copy()

	// Add assignment
	newState.Assignments = append(newState.Assignments, a)

	// Remove booking from unassigned
	for i, bid := range newState.UnassignedBookings {
		if bid == a.BookingID {
			newState.UnassignedBookings = append(newState.UnassignedBookings[:i], newState.UnassignedBookings[i+1:]...)
			break
		}
	}

	return newState
}

// GetBookingLocation returns the location for a booking (uses postcode centroid)
func (s *DispatchState) GetBookingLocation(_bookingID string) Location {
	// In production, look up from database
	// Return a default location for simulation
	return Location{Latitude: -33.8688, Longitude: 151.2093} // Sydney CBD
}

// GetLastAssignedBooking returns the last booking ID assigned in this state
func (s *DispatchState) GetLastAssignedBooking() string {
	if len(s.Assignments) == 0 {
		return ""
	}
	return s.Assignments[len(s.Assignments)-1].BookingID
}

// Evaluate returns a score for the current state (higher = better)
func (s *DispatchState) Evaluate() float64 {
	if len(s.Assignments) == 0 {
		return 0
	}

	// Score based on assignments completed and travel time efficiency
	totalTravel := 0
	for _, a := range s.Assignments {
		totalTravel += a.TravelTime
	}

	avgTravel := float64(totalTravel) / float64(len(s.Assignments))
	assignmentBonus := float64(len(s.Assignments)) * 10.0
	travelPenalty := avgTravel * 0.5

	return assignmentBonus - travelPenalty
}

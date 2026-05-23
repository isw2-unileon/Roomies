package httpadapter

import (
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
)

func TestTenantApartmentResponsesDerivesAvailableSpots(t *testing.T) {
	responses := tenantApartmentResponses([]apartment.Apartment{{
		ID:            "apartment-1",
		Title:         "Flat",
		TotalSpots:    3,
		OccupiedSpots: 1,
	}})

	if len(responses) != 1 {
		t.Fatalf("len(responses) = %d, want 1", len(responses))
	}
	if responses[0].AvailableSpots != 2 {
		t.Fatalf("AvailableSpots = %d, want 2", responses[0].AvailableSpots)
	}
}

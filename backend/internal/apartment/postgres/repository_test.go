package postgres

import (
	"context"
	"strings"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/pashagolub/pgxmock/v4"
)

func TestCloseApartmentRemovesTenantWhenAlreadyLockedInAnotherClosedApartment(t *testing.T) {
	mock, err := pgxmock.NewPool(pgxmock.QueryMatcherOption(pgxmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("create pgx mock: %v", err)
	}
	defer mock.Close()

	repo := &Repository{db: mock}

	mock.ExpectBegin()
	mock.ExpectQuery("UPDATE public\\.apartments").
		WithArgs("apartment-2", "owner-2").
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow("apartment-2"))
	mock.ExpectExec("UPDATE public\\.applications").
		WithArgs("apartment-2").
		WillReturnResult(pgxmock.NewResult("UPDATE", 0))
	mock.ExpectQuery("SELECT app\\.tenant_id::text").
		WithArgs("apartment-2").
		WillReturnRows(pgxmock.NewRows([]string{"tenant_id"}).AddRow("tenant-1"))
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs("tenant-1", "apartment-2").
		WillReturnRows(pgxmock.NewRows([]string{"exists"}).AddRow(true))
	mock.ExpectQuery("UPDATE public\\.applications").
		WithArgs("tenant-1", "apartment-2").
		WillReturnRows(pgxmock.NewRows([]string{"apartment_id"}).AddRow("apartment-2"))
	mock.ExpectExec("UPDATE public\\.apartments").
		WithArgs("apartment-2").
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	mock.ExpectCommit()

	closed, err := repo.CloseApartment(context.Background(), "owner-2", "apartment-2")
	if err != nil {
		t.Fatalf("CloseApartment returned error: %v", err)
	}
	if !closed {
		t.Fatal("closed = false, want true")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAvailableApartmentsQueryKeepsFullOpenApartmentsAndExcludesClosed(t *testing.T) {
	query := buildListAvailableApartmentsQuery(apartment.ListApartmentsFilters{Availability: "available"})

	if strings.Contains(query.query, "(a.total_spots - a.occupied_spots) > 0") {
		t.Fatalf("query filters out full open apartments: %s", query.query)
	}
	if !strings.Contains(query.query, "a.status <> 'CLOSED'") {
		t.Fatalf("query does not exclude closed apartments: %s", query.query)
	}
}

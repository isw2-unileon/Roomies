package postgres

import (
	"context"
	"testing"

	"github.com/pashagolub/pgxmock/v4"
)

func TestApproveOwnerApplicationKeepsTenantApplicationsOpen(t *testing.T) {
	mock, err := pgxmock.NewPool(pgxmock.QueryMatcherOption(pgxmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("create pgx mock: %v", err)
	}
	defer mock.Close()

	repo := &Repository{db: mock}

	mock.ExpectBegin()
	mock.ExpectQuery("SELECT app\\.apartment_id::text").
		WithArgs("application-1", "owner-1").
		WillReturnRows(pgxmock.NewRows([]string{"apartment_id", "apartment_status", "group_id", "type", "status", "total_spots", "occupied_spots"}).
			AddRow("apartment-1", "AVAILABLE", "", "individual", "PENDING_OWNER", 2, 1))
	mock.ExpectQuery("UPDATE public\\.applications app").
		WithArgs("application-1", "owner-1", "FULLY_CONFIRMED", true).
		WillReturnRows(pgxmock.NewRows([]string{"group_id"}).AddRow(""))
	mock.ExpectExec("UPDATE public\\.apartments").
		WithArgs("apartment-1").
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	mock.ExpectCommit()

	updated, err := repo.ApproveOwnerApplication(context.Background(), "application-1", "owner-1")
	if err != nil {
		t.Fatalf("ApproveOwnerApplication returned error: %v", err)
	}
	if !updated {
		t.Fatal("updated = false, want true")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

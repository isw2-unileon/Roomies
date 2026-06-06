package matching

import (
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

func TestCalculateTenantCompatibility_NilProfiles(t *testing.T) {
	if got := CalculateTenantCompatibility(nil, nil); got != 0 {
		t.Errorf("expected 0, got %d", got)
	}
}

func TestCalculateTenantCompatibility_IdenticalProfiles(t *testing.T) {
	p := &profile.TenantProfileInput{
		UserID:        "u1",
		BudgetMax:     500,
		PreferredArea: "centro",
		Pets:          false,
		Smoking:       false,
		Age:           22,
		Situation:     "student",
		Degree:        "informatica",
		Socialization: "medium",
		Nightlife:     "low",
	}
	got := CalculateTenantCompatibility(p, p)
	if got < 95 {
		t.Errorf("identical profiles should score ≥ 95, got %d", got)
	}
}

func TestCalculateTenantCompatibility_SmokingMismatch(t *testing.T) {
	base := &profile.TenantProfileInput{Smoking: false, BudgetMax: 400, Situation: "student", Socialization: "medium", Nightlife: "low", Age: 22}
	smoker := &profile.TenantProfileInput{Smoking: true, BudgetMax: 400, Situation: "student", Socialization: "medium", Nightlife: "low", Age: 22}

	scoreMatch := CalculateTenantCompatibility(base, base)
	scoreMismatch := CalculateTenantCompatibility(base, smoker)

	if scoreMismatch >= scoreMatch {
		t.Errorf("smoking mismatch (%d) should score lower than match (%d)", scoreMismatch, scoreMatch)
	}
}

func TestCalculateTenantCompatibility_SituationMismatch(t *testing.T) {
	a := &profile.TenantProfileInput{Situation: "student", BudgetMax: 400, Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}
	b := &profile.TenantProfileInput{Situation: "worker", BudgetMax: 400, Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}
	withMismatch := CalculateTenantCompatibility(a, b)

	c := &profile.TenantProfileInput{Situation: "student", BudgetMax: 400, Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}
	withMatch := CalculateTenantCompatibility(a, c)

	if withMismatch >= withMatch {
		t.Errorf("situation match (%d) should score higher than mismatch (%d)", withMatch, withMismatch)
	}
}

func TestCalculateTenantCompatibility_BudgetFarApart(t *testing.T) {
	a := &profile.TenantProfileInput{BudgetMax: 300, Situation: "student", Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}
	b := &profile.TenantProfileInput{BudgetMax: 700, Situation: "student", Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}
	got := CalculateTenantCompatibility(a, b)
	if got >= 85 {
		t.Errorf("large budget gap should lower score, got %d", got)
	}
}

func TestCalculateTenantCompatibility_SituationBothIsFlexible(t *testing.T) {
	a := &profile.TenantProfileInput{Situation: "both", BudgetMax: 400, Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}
	b := &profile.TenantProfileInput{Situation: "student", BudgetMax: 400, Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}
	c := &profile.TenantProfileInput{Situation: "worker", BudgetMax: 400, Smoking: false, Socialization: "medium", Nightlife: "low", Age: 22}

	scoreBothVsStudent := CalculateTenantCompatibility(a, b)
	scoreBothVsWorker := CalculateTenantCompatibility(a, c)
	scoreStudentVsWorker := CalculateTenantCompatibility(b, c)

	if scoreBothVsStudent <= scoreStudentVsWorker {
		t.Errorf("both vs student (%d) should score higher than student vs worker (%d)", scoreBothVsStudent, scoreStudentVsWorker)
	}
	if scoreBothVsWorker <= scoreStudentVsWorker {
		t.Errorf("both vs worker (%d) should score higher than student vs worker (%d)", scoreBothVsWorker, scoreStudentVsWorker)
	}
}

func TestCalculateTenantCompatibility_ScoreInRange(t *testing.T) {
	a := &profile.TenantProfileInput{BudgetMax: 300, Situation: "student", Smoking: true, Socialization: "low", Nightlife: "high", Age: 18}
	b := &profile.TenantProfileInput{BudgetMax: 700, Situation: "worker", Smoking: false, Socialization: "high", Nightlife: "low", Age: 45}
	got := CalculateTenantCompatibility(a, b)
	if got < 0 || got > 100 {
		t.Errorf("score must be 0-100, got %d", got)
	}
}

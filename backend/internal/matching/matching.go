package matching

import (
	"math"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

// CalculateCompatibility scores how well a tenant profile matches an apartment and its rules.
func CalculateCompatibility(apartmentRow apartment.Apartment, rules *apartment.Rules, tenantProfile *profile.TenantProfileInput) (int, []string) {
	if tenantProfile == nil {
		return 0, nil
	}

	totalWeight := 0.0
	weightedScore := 0.0
	reasons := make([]string, 0, 4)

	addScore := func(weight float64, score float64, reason string) {
		if score < 0 {
			return
		}
		totalWeight += weight
		weightedScore += weight * score
		if score >= 70 && reason != "" {
			reasons = append(reasons, reason)
		}
	}

	addScore(0.20, budgetCompatibility(apartmentRow.BaseRent, tenantProfile.BudgetMax), "Presupuesto alineado")
	addScore(0.15, textEqualityScore(tenantProfile.PreferredArea, apartmentRow.Area), "Zona preferida similar")
	addScore(0.15, boolRuleScore(rules, tenantProfile.Pets, true), "Preferencias de mascotas compatibles")
	addScore(0.15, boolRuleScore(rules, tenantProfile.Smoking, false), "Normas de convivencia compatibles")

	if totalWeight == 0 {
		return 0, nil
	}
	score := int(math.Round(weightedScore / totalWeight))
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	if len(reasons) == 0 {
		reasons = append(reasons, "Perfil parcialmente compatible")
	}
	return score, reasons
}

// CalculateTenantCompatibility scores how compatible two tenant profiles are as potential roommates.
func CalculateTenantCompatibility(a, b *profile.TenantProfileInput) int {
	if a == nil || b == nil {
		return 0
	}

	totalWeight := 0.0
	weightedScore := 0.0

	addScore := func(weight, score float64) {
		if score < 0 {
			return
		}
		totalWeight += weight
		weightedScore += weight * score
	}

	addScore(0.20, tenantBudgetScore(a.BudgetMax, b.BudgetMax))
	addScore(0.15, situationScore(a.Situation, b.Situation))
	addScore(0.15, orderedLevelScore(a.Socialization, b.Socialization, []string{"low", "medium", "high"}))
	addScore(0.12, orderedLevelScore(a.Nightlife, b.Nightlife, []string{"low", "medium", "high"}))
	addScore(0.12, tenantSmokingScore(a.Smoking, b.Smoking))
	addScore(0.10, studiesProfessionScore(a, b))
	addScore(0.08, textEqualityScore(a.PreferredArea, b.PreferredArea))
	addScore(0.05, ageScore(a.Age, b.Age))
	addScore(0.03, tenantPetsScore(a.Pets, b.Pets))

	if totalWeight == 0 {
		return 0
	}
	score := int(math.Round(weightedScore / totalWeight))
	if score < 0 {
		return 0
	}
	if score > 100 {
		return 100
	}
	return score
}

func budgetCompatibility(baseRent, budgetMax int) float64 {
	if baseRent <= 0 || budgetMax <= 0 {
		return -1
	}
	if baseRent <= budgetMax {
		return 100
	}
	delta := baseRent - budgetMax
	if delta <= 40 {
		return 85
	}
	if delta <= 100 {
		return 60
	}
	if delta <= 180 {
		return 35
	}
	return 10
}

func tenantBudgetScore(aMax, bMax int) float64 {
	if aMax <= 0 || bMax <= 0 {
		return -1
	}
	diff := aMax - bMax
	if diff < 0 {
		diff = -diff
	}
	if diff <= 100 {
		return 100
	}
	if diff <= 200 {
		return 75
	}
	if diff <= 350 {
		return 50
	}
	return 20
}

func situationScore(a, b string) float64 {
	a = normalizeText(a)
	b = normalizeText(b)
	if a == "" || b == "" {
		return -1
	}
	if a == b {
		return 100
	}
	if a == "both" || b == "both" {
		return 70
	}
	return 30
}

func tenantSmokingScore(a, b bool) float64 {
	if a == b {
		return 100
	}
	return 10
}

func tenantPetsScore(a, b bool) float64 {
	if a == b {
		return 100
	}
	return 60
}

func ageScore(a, b int) float64 {
	if a <= 0 || b <= 0 {
		return -1
	}
	diff := a - b
	if diff < 0 {
		diff = -diff
	}
	if diff <= 3 {
		return 100
	}
	if diff <= 6 {
		return 70
	}
	if diff <= 10 {
		return 40
	}
	return 15
}

func studiesProfessionScore(a, b *profile.TenantProfileInput) float64 {
	aSit := normalizeText(a.Situation)
	bSit := normalizeText(b.Situation)
	if aSit == "" || bSit == "" {
		return -1
	}
	if aSit == "student" && bSit == "student" {
		return textEqualityScore(a.Degree, b.Degree)
	}
	if aSit == "worker" && bSit == "worker" {
		return textEqualityScore(a.Profession, b.Profession)
	}
	if aSit == "both" && bSit == "both" {
		deg := textEqualityScore(a.Degree, b.Degree)
		prof := textEqualityScore(a.Profession, b.Profession)
		if deg < 0 && prof < 0 {
			return -1
		}
		if deg < 0 {
			return prof
		}
		if prof < 0 {
			return deg
		}
		return (deg + prof) / 2
	}
	return -1
}

func textEqualityScore(a, b string) float64 {
	a = normalizeText(a)
	b = normalizeText(b)
	if a == "" || b == "" {
		return -1
	}
	if a == b {
		return 100
	}
	if strings.Contains(a, b) || strings.Contains(b, a) {
		return 70
	}
	return 25
}

func boolRuleScore(rules *apartment.Rules, tenantValue bool, forPets bool) float64 {
	if rules == nil {
		return -1
	}
	if forPets {
		if rules.PetsAllowed == nil {
			return -1
		}
		if *rules.PetsAllowed == tenantValue {
			return 100
		}
		if !tenantValue {
			return 80
		}
		return 10
	}
	if rules.SmokingAllowed == nil {
		return -1
	}
	if *rules.SmokingAllowed == tenantValue {
		return 100
	}
	if !tenantValue {
		return 80
	}
	return 10
}

func orderedLevelScore(tenantLevel, ruleLevel string, order []string) float64 {
	tenantLevel = normalizeText(tenantLevel)
	ruleLevel = normalizeText(ruleLevel)
	if tenantLevel == "" || ruleLevel == "" {
		return -1
	}
	tenantIdx := indexOf(order, tenantLevel)
	ruleIdx := indexOf(order, ruleLevel)
	if tenantIdx < 0 || ruleIdx < 0 {
		return -1
	}
	diff := math.Abs(float64(tenantIdx - ruleIdx))
	if diff == 0 {
		return 100
	}
	if diff == 1 {
		return 65
	}
	return 20
}

func indexOf(items []string, value string) int {
	for idx := range items {
		if items[idx] == value {
			return idx
		}
	}
	return -1
}

func normalizeText(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

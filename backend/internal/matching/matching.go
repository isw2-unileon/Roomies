package matching

import (
	"math"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

// CalculateCompatibility scores how well a tenant profile matches an apartment and its rules.
func CalculateCompatibility(apartmentRow apartment.Apartment, rules *apartment.Rules, tenantProfile *profile.TenantProfile) (int, []string) {
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
	addScore(0.10, orderedLevelScore(tenantProfile.NoiseLevel, ruleNoiseLevel(rules), []string{"quiet", "moderate", "loud"}), "Rangos de ruido compatibles")
	addScore(0.10, orderedLevelScore(tenantProfile.Cleanliness, ruleCleanliness(rules), []string{"relaxed", "normal", "very_clean"}), "Preferencias de limpieza compatibles")
	addScore(0.05, orderedLevelScore(tenantProfile.WorkSchedule, ruleSchedule(rules), []string{"morning", "flexible", "night"}), "Horarios compatibles")

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

func ruleNoiseLevel(rules *apartment.Rules) string {
	if rules == nil {
		return ""
	}
	return rules.MaxNoiseLevel
}

func ruleCleanliness(rules *apartment.Rules) string {
	if rules == nil {
		return ""
	}
	return rules.CleanlinessExpectation
}

func ruleSchedule(rules *apartment.Rules) string {
	if rules == nil {
		return ""
	}
	return rules.PreferredSchedule
}

func normalizeText(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

# Compatibility Engine

The compatibility engine is the core differentiator of Roomies. It calculates a **score from 0 to 100** that measures how well two entities match.

## Scoring Types

### Tenant ↔ Apartment

Measures how well a tenant's preferences align with an apartment's rules and pricing.

**Factors and weights:**

| Factor           | Weight | Description                                      |
|------------------|--------|--------------------------------------------------|
| Budget           | 30%    | Tenant's `budget_max` vs apartment's `base_rent` |
| Area/Zone        | 20%    | Tenant's `preferred_area` vs apartment's `area`  |
| Pets             | 20%    | Tenant's `pets` vs apartment's `pets_allowed`    |
| Smoking          | 20%    | Tenant's `smoking` vs apartment's `smoking_allowed` |
| Students         | 10%    | Tenant's `tenant_situation` vs `students_allowed`|

**Scoring logic:**

- **Budget**: If `budget_max >= base_rent` → full score; otherwise proportional penalty
- **Area**: Exact match → full; otherwise partial or zero
- **Pets/Smoking**: If tenant has pet/smokes and apartment forbids it → zero for that factor
- **Students**: If tenant is student and apartment forbids students → zero

### Tenant ↔ Tenant (Roommate Compatibility)

Measures lifestyle compatibility between two tenants for sharing an apartment.

**Factors and weights:**

| Factor               | Weight | Description                                       |
|----------------------|--------|---------------------------------------------------|
| Budget               | 20%    | Difference in `budget_max`                        |
| Lifestyle (smoking)  | 15%    | Both smoke or both don't                          |
| Lifestyle (pets)     | 15%    | Both have pets or both don't                      |
| Schedule             | 15%    | Similarity in routines inferred from situation    |
| Socialization        | 10%    | `socialization_level` match                       |
| Nightlife            | 10%    | `nightlife_level` match                           |
| Age                  | 5%     | Age difference (closer is better)                 |
| Studies/Profession   | 5%     | Shared field of study or profession               |
| Sex                  | 5%     | Preference match                                  |

**Scoring logic:**

Each factor is scored 0-100 independently, then combined with the weighted average. The final score is rounded to the nearest integer.

### Score Interpretation

| Range    | Meaning               |
|----------|-----------------------|
| 80-100   | Excellent match       |
| 60-79    | Good match            |
| 40-59    | Fair match            |
| 20-39    | Poor match            |
| 0-19     | Incompatible          |

## Implementation

**Package:** `backend/internal/matching/`

### Structure

```text
internal/matching/
├── matching.go         # Types: CompatibilityScore, factor weights
├── service/
│   └── matching.go     # Scoring algorithms
├── postgres/
│   └── matching.go     # Data loading for scoring
└── httpadapter/
    └── matching.go     # API handlers
```

### Key Types

```go
type CompatibilityScore struct {
    Score        int               `json:"score"`
    Breakdown    map[string]int    `json:"breakdown,omitempty"`
    Reasons      []string          `json:"reasons,omitempty"`
}
```

### Flow

1. Service receives two profiles (tenant+apartment or tenant+tenant)
2. Each factor is scored independently
3. Weighted average is computed
4. Descriptive reasons are generated for the breakdown
5. Result is cached or returned directly

## Usage in the Application

### Property Cards (Explore Page)

Each apartment card displays:
- A compatibility percentage badge
- Color-coded: green (80+), yellow (60-79), orange (40-59), red (<40)

### Apartment Detail Page

Shows a full breakdown of each factor contributing to the score.

### Tenant Profiles

When browsing other tenants (group candidates, interested tenants), compatibility scores are shown to facilitate group formation.

### Group Formation

Tenants can sort potential group members by compatibility score and invite the best matches.

## Related Docs

- [Architecture overview](architecture.md)
- [Data model](data-model.md)
- [ADR-004: Compatibility Engine](adr/004-compatibility-engine.md)

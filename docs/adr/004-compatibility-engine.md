# ADR-004: Compatibility Scoring Engine

## Status

Accepted

## Date

2026-02-16

## Context

Roomies aims to differentiate itself from standard listing platforms by providing intelligent matching. The platform needs to quantify compatibility between:
1. Tenants and apartments (would this apartment suit this tenant?)
2. Tenants and other tenants (would these two get along as roommates?)

A simple boolean filter (e.g., "smoking: yes/no") is insufficient because compatibility is nuanced — a tenant might accept a slightly higher rent for a great location, or tolerate smoking if everything else matches.

## Decision

Build a **weighted scoring engine** that produces a compatibility score from 0 to 100.

- Each factor (budget, smoking, pets, etc.) is scored independently on a 0-100 scale
- Factors are combined using configurable weights (e.g., budget 30%, smoking 20%, etc.)
- Result includes a breakdown of per-factor scores and human-readable reasons
- Scores are not cached; they are computed on-the-fly (the data volume is small enough)

Two scoring modes:
- **Tenant ↔ Apartment**: budget, area, pets, smoking, students
- **Tenant ↔ Tenant**: budget, smoking, pets, schedule, socialization, nightlife, age, studies, sex

## Consequences

**Positive:**
- Nuanced results — shows degrees of compatibility, not just binary matches
- Explainable — tenants can see why a score is high or low
- Configurable — weights can be adjusted without code changes to the scoring algorithm
- Group formation — tenants can find and invite compatible roommates

**Negative:**
- Computational cost grows with number of tenants and apartments (mitigated by database filtering before scoring)
- Scoring criteria are somewhat opinionated — may not reflect all users' priorities
- Weight tuning requires user research to validate

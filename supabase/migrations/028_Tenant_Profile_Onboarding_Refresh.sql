ALTER TABLE tenant_profiles
ADD COLUMN IF NOT EXISTS sex TEXT,
ADD COLUMN IF NOT EXISTS tenant_situation TEXT,
ADD COLUMN IF NOT EXISTS degree TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS socialization_level TEXT,
ADD COLUMN IF NOT EXISTS nightlife_level TEXT;

ALTER TABLE tenant_profiles
DROP CONSTRAINT IF EXISTS tenant_profiles_sex_check,
DROP CONSTRAINT IF EXISTS tenant_profiles_tenant_situation_check,
DROP CONSTRAINT IF EXISTS tenant_profiles_socialization_level_check,
DROP CONSTRAINT IF EXISTS tenant_profiles_nightlife_level_check;

ALTER TABLE tenant_profiles
ADD CONSTRAINT tenant_profiles_sex_check CHECK (
    sex IS NULL
    OR sex IN ('male', 'female', 'other', 'prefer_not_to_say')
),
ADD CONSTRAINT tenant_profiles_tenant_situation_check CHECK (
    tenant_situation IS NULL
    OR tenant_situation IN ('student', 'worker', 'unemployed')
),
ADD CONSTRAINT tenant_profiles_socialization_level_check CHECK (
    socialization_level IS NULL
    OR socialization_level IN ('low', 'medium', 'high')
),
ADD CONSTRAINT tenant_profiles_nightlife_level_check CHECK (
    nightlife_level IS NULL
    OR nightlife_level IN ('low', 'medium', 'high')
);

import styles from '@/styles/SegmentedLevelField.module.css'

export interface SegmentedLevelOption {
  value: string
  label: string
  note?: string
}

interface SegmentedLevelFieldProps {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SegmentedLevelOption[]
}

export default function SegmentedLevelField({ name, label, value, onChange, options }: SegmentedLevelFieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.segmentedControl} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label key={option.value} className={`${styles.segmentOption} ${checked ? styles.segmentOptionActive : ''}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={(event) => onChange(event.target.value)}
                className={styles.segmentInput}
              />
              <span className={styles.segmentLabel}>{option.label}</span>
              {option.note ? (
                <span className={styles.segmentNote}>{option.note}</span>
              ) : (
                <span className={styles.segmentNotePlaceholder} aria-hidden="true" />
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}

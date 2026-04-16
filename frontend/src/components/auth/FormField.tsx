import { InputHTMLAttributes } from 'react'
import styles from '@/styles/FormField.module.css'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
}

/**
 * Form field with accessible label.
 * Accepts all native <input> attributes.
 */
export default function FormField({ id, label, ...inputProps }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input id={id} name={id} className={styles.input} {...inputProps} />
    </div>
  )
}

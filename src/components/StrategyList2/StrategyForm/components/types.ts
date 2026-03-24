import { FieldConfig } from "../../../../types/form";

/**
 * Base props shared by all form field components.
 * - `value`: current field value (read from form state by the parent)
 * - `onValueChange`: callback the parent uses to persist the new value
 * - `field`: the original FieldConfig so labels / options / defaults are available
 */
export interface FormFieldComponentProps<T = unknown> {
  value: T;
  onValueChange: (newValue: T) => void;
  field: FieldConfig;
}

import React, { useEffect, useRef } from "react";
import { Card, InputNumber } from "antd";
import { FormFieldComponentProps } from "./types";

/** Coerce any value to a valid number. Returns the fallback for non-numeric input. */
const toSafeNumber = (val: unknown, fallback: number = 0): number => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
};

const PREFIX_LABELS: Record<string, string> = {
  currency: "$",
  percentage: "%",
  multiplier: "×",
};

export const FormFieldNumberPrefix: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  const initializedRef = useRef(false);
  const safeDefault = toSafeNumber(field.default, 0);
  const numericValue = toSafeNumber(value, safeDefault);

  // On mount, persist the resolved numeric value into the form store
  // so it matches what the user sees.
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (value === null || value === undefined || typeof value === "object") {
        onValueChange(numericValue);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prefixLabel = field.prefixType
    ? PREFIX_LABELS[field.prefixType] ?? null
    : null;

  return (
    <Card className="field-heading" size="small">
      <div className="field-label-row">
        <span className="field-label">{field.label}</span>
      </div>
      <div className="input-field-wrapper">
        <label className="input-field-label">{field.label}</label>
        <InputNumber
          className="input-field-control"
          size="large"
          placeholder={`Enter ${field.label.toLowerCase()}`}
          value={numericValue}
          prefix={prefixLabel}
          style={{ width: "100%" }}
          onChange={(val) => {
            onValueChange(toSafeNumber(val, safeDefault));
          }}
        />
      </div>
    </Card>
  );
};

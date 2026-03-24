import React from "react";
import { DurationSelector } from "../../../DurationSelector";
import { FormFieldComponentProps } from "./types";

export const FormFieldDurationSelector: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  return (
    <DurationSelector
      label={field.label}
      placeholder={`Enter ${field.label.toLowerCase()}`}
      value={value}
      onChange={(newValue) => {
        onValueChange(newValue);
      }}
    />
  );
};

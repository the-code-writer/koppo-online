import React from "react";
import { ThresholdSelector } from "../../../ProfitThreshold";
import { FormFieldComponentProps } from "./types";

export const FormFieldThresholdSelector: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  return (
    <ThresholdSelector
      label={field.label}
      value={value}
      onChange={(newValue) => {
        onValueChange(newValue);
      }}
      fixedPlaceholder={field.placeholder || "Enter fixed amount"}
      percentagePlaceholder={`Enter percentage of balance for ${field.label.toLowerCase()}`}
      fixedHelperText={`Enter a fixed ${field.label.toLowerCase()} amount`}
      percentageHelperText={`${field.label} will be calculated as a percentage of your account balance`}
    />
  );
};

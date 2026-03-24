import React from "react";
import { StepsComponent } from "../../../StepsComponent";
import { FormFieldComponentProps } from "./types";

export const FormFieldRiskManagement: React.FC<FormFieldComponentProps<unknown[]>> = ({
  value,
  onValueChange,
}) => {
  return (
    <StepsComponent
      settings={value || []}
      onSettingsChange={(newValue) => {
        onValueChange(newValue);
      }}
      title="Recovery Steps"
      addButtonText="Add Recovery Step"
      showButton
    />
  );
};

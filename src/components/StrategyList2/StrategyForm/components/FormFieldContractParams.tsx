import React from "react";
import { StepsComponent } from "../../../StepsComponent";
import { FormFieldComponentProps } from "./types";

interface ContractParamsValue {
  /** The array of contract parameter objects (adhocContractParams) */
  adhocParams: unknown[];
}

export interface FormFieldContractParamsProps extends FormFieldComponentProps<ContractParamsValue> {
  /** Called when the adhoc params array changes (in addition to onValueChange which sets the first param) */
  onAdhocParamsChange: (params: unknown[]) => void;
}

export const FormFieldContractParams: React.FC<FormFieldContractParamsProps> = ({
  value,
  onValueChange,
  onAdhocParamsChange,
  field,
}) => {
  return (
    <>
      <StepsComponent
        settings={value.adhocParams}
        onSettingsChange={(params) => {
          if (Array.isArray(params)) {
            if (params.length > 0) {
              onValueChange({ ...value, adhocParams: params });
              onAdhocParamsChange(params);
            }
          }
        }}
        title={field.label}
      />
    </>
  );
};

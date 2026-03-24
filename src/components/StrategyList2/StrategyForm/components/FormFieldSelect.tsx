import React from "react";
import { Select } from "antd";
import { FormFieldComponentProps } from "./types";

export const FormFieldSelect: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  return (
    <div className="select-field">
      <label className="input-field-label">{field.label}</label>
      <Select
        defaultValue={field.default}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        options={field.options}
        value={value as string | undefined}
        onChange={(newValue) => {
          onValueChange(newValue);
        }}
        style={{ width: "100%" }}
        size="large"
      />
    </div>
  );
};

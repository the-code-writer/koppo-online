import React from "react";
import { Card } from "antd";
import { KeyValueEditor } from "../../../KeyValueEditor";
import { FormFieldComponentProps } from "./types";

export const FormFieldKeyValueEditor: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  return (
    <Card className="field-heading" size="small">
      <KeyValueEditor
        label={field.label}
        initialValue={value}
        onChange={(val) => {
          onValueChange(val);
        }}
      />
    </Card>
  );
};

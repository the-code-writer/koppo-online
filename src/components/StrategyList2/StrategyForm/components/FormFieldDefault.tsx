import React, { useEffect, useRef } from "react";
import { Card } from "antd";
import { InputField } from "../../../InputField";
import { FormFieldComponentProps } from "./types";

export const FormFieldDefault: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  const initializedRef = useRef(false);

  // When the form loads with null/undefined, store the field default so
  // the form store matches what the user sees in the input.
  useEffect(() => {
    if (!initializedRef.current && (value === null || value === undefined) && field.default != null) {
      initializedRef.current = true;
      onValueChange(field.default);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="field-heading" size="small">
      <InputField
        label={field.label}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        type="text"
        value={(value as string) ?? String(field.default ?? "")}
        onChange={(e: unknown) => {
          // Ant Design <Input> passes a SyntheticEvent, not the raw value.
          // Extract the actual string from e.target.value.
          const raw =
            e && typeof e === "object" && "target" in e
              ? (e as React.ChangeEvent<HTMLInputElement>).target.value
              : e;
          onValueChange(raw);
        }}
      />
    </Card>
  );
};

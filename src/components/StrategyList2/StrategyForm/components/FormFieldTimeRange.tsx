import React, { useEffect, useRef } from "react";
import { Card } from "antd";
import { InputField } from "../../../InputField";
import { FormFieldComponentProps } from "./types";

const DEFAULT_VALUE = "24 Hours";

export const FormFieldTimeRange: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && (value === null || value === undefined || value === "")) {
      initializedRef.current = true;
      onValueChange(DEFAULT_VALUE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="field-heading" size="small">
      <InputField
        label={field.label}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        type="text"
        value={(value as string) || DEFAULT_VALUE}
        readOnly
      />
    </Card>
  );
};

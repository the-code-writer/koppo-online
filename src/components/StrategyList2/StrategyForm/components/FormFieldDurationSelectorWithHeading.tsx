import React from "react";
import { Card, Typography } from "antd";
import { DurationSelector } from "../../../DurationSelector";
import { FormFieldComponentProps } from "./types";

const { Title } = Typography;

export const FormFieldDurationSelectorWithHeading: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  const parsedDuration = typeof value === "string" ? parseInt(value, 10) : value;
  return (
    <Card className="field-heading" size="small">
      <Title level={4} className="heading-title">
        {field.label}
      </Title>
      <div className="duration-selector-in-card">
        <DurationSelector
          value={(parsedDuration as number) || undefined}
          onChange={(newValue) => {
            onValueChange(newValue);
          }}
        />
      </div>
    </Card>
  );
};

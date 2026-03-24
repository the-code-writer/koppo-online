import React from "react";
import { Card, Segmented, Typography } from "antd";
import { FormFieldComponentProps } from "./types";

const { Title } = Typography;

export const FormFieldRecoveryType: React.FC<FormFieldComponentProps<string>> = ({
  value,
  onValueChange,
  field,
}) => {
  // Normalize legacy values — "on" maps to "aggressive"
  const normalizedRecovery =
    value === "on" ? "aggressive" :
    value === "off" ? "conservative" :
    ["conservative", "neutral", "aggressive"].includes(value) ? value :
    "conservative";

  return (
    <Card className="field-heading" size="small">
      <div className="field-label-row">
        <Title level={4} className="heading-title">
          {field.label}
        </Title>
      </div>
      <Segmented
        defaultValue={field.default}
        block
        value={normalizedRecovery}
        options={[
          { label: "Conservative", value: "conservative" },
          { label: "Neutral", value: "neutral" },
          { label: "Aggressive", value: "aggressive" },
        ]}
        onChange={(newValue) => {
          onValueChange(newValue as string);
        }}
      />
      <div className="recovery-type-description">
        <span className="description-text">
          Controls how quickly the bot recovers from losses
        </span>
      </div>
    </Card>
  );
};

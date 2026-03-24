import React from "react";
import { Card, Flex, Segmented, Typography } from "antd";
import { InputField } from "../../../InputField";
import { FormFieldComponentProps } from "./types";

const { Title } = Typography;

interface CooldownValue {
  value: number;
  units: string;
}

export const FormFieldCooldownPeriod: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  // Normalize: if stored as legacy {duration, unit} or plain string/number, convert to {value, units}
  const raw = value as any;
  let cooldownObj: CooldownValue;
  if (raw && typeof raw === "object" && "value" in raw) {
    cooldownObj = raw;
  } else if (raw && typeof raw === "object" && "duration" in raw) {
    cooldownObj = {
      value: raw.duration || 0,
      units: raw.unit === "seconds" ? "Sec" : raw.unit === "minutes" ? "Min" : "Hr",
    };
  } else {
    cooldownObj = { value: raw ?? 0, units: "Sec" };
  }

  return (
    <Card className="field-heading" size="small">
      <div className="field-label-row">
        <Title level={4} className="heading-title">
          {field.label}
        </Title>
      </div>
      <Flex justify="space-between" align="center" gap={12}>
        <InputField
          type="number"
          placeholder="Duration"
          value={cooldownObj.value}
          min={0}
          onChange={(val) => {
            const currentUnits = cooldownObj.units ?? "Sec";
            const newValue = { value: val, units: currentUnits };
            onValueChange(newValue);
          }}
        />
        <Segmented
          style={{ width: 360 }}
          block
          options={[
            { label: "Sec", value: "Sec" },
            { label: "Min", value: "Min" },
            { label: "Hr", value: "Hr" },
          ]}
          value={cooldownObj.units || "Sec"}
          onChange={(val) => {
            const currentValue = cooldownObj.value ?? 0;
            const newValue = { value: currentValue, units: val };
            onValueChange(newValue);
          }}
          className="cooldown-segment"
        />
      </Flex>
      <div className="cooldown-description">
        <span className="description-text">
          Wait time between consecutive trades after a loss
        </span>
      </div>
    </Card>
  );
};

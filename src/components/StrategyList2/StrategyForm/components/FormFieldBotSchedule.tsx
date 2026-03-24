import React from "react";
import { Card, Typography } from "antd";
import { BotSchedule } from "../../../BotSchedule";
import { FormFieldComponentProps } from "./types";

const { Title } = Typography;

export const FormFieldBotSchedule: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  return (
    <Card className="field-heading" size="small">
      <div className="field-label-row">
        <Title level={4} className="heading-title">
          {field.label}
        </Title>
      </div>
      <BotSchedule
        initialValue={value}
        onChange={(newValue) => {
          onValueChange(newValue);
        }}
      />
    </Card>
  );
};

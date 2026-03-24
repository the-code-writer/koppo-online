import React from "react";
import { Card, Typography } from "antd";
import { FormFieldComponentProps } from "./types";

const { Title } = Typography;

export const FormFieldHeading: React.FC<FormFieldComponentProps> = ({
  field,
}) => {
  return (
    <Card className="field-heading" size="small">
      <Title level={4} className="heading-title">
        {field.label}
      </Title>
    </Card>
  );
};

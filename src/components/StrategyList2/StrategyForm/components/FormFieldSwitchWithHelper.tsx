import React from "react";
import { Card, Flex, Switch } from "antd";
import { FormFieldComponentProps } from "./types";

export const FormFieldSwitchWithHelper: React.FC<FormFieldComponentProps<boolean>> = ({
  value,
  onValueChange,
  field,
}) => {
  return (
    <Card className="field-heading" size="small">
      <Flex
        justify="space-between"
        align="center"
        style={{ width: "100%" }}
      >
        <span>{field.label}</span>
        <Switch
          checked={value !== undefined && value !== null ? !!value : !!(field.default)}
          onChange={(newValue) => {
            onValueChange(newValue);
          }}
        />
      </Flex>
    </Card>
  );
};

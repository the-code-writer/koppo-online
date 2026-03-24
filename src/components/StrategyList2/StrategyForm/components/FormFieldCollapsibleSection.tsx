import React from "react";
import { Collapse, Form, Typography } from "antd";
import { FieldConfig } from "../../../../types/form";
import { FormFieldComponentProps } from "./types";

const { Title } = Typography;

export interface FormFieldCollapsibleSectionProps extends FormFieldComponentProps {
  /** renderField callback so the collapsible section can recursively render children */
  renderField: (childField: FieldConfig) => React.ReactNode;
  /** Resolves metadata-disambiguated field names */
  getMetadataFieldName: (sectionName?: string) => string | undefined;
}

export const FormFieldCollapsibleSection: React.FC<FormFieldCollapsibleSectionProps> = ({
  field,
  renderField,
  getMetadataFieldName,
}) => {
  return (
    <Collapse
      ghost
      accordion
      items={[
        {
          key: field.name,
          label: (
            <div className="collapsible-header">
              <Title level={4} className="collapsible-title">
                {field.label}
              </Title>
            </div>
          ),
          children: (
            <div className="collapsible-content">
              {field.fields?.map((childField) => {
                const isMetaChild =
                  childField.name === "metadata" && "sectionName" in childField;
                const childFieldName = isMetaChild
                  ? getMetadataFieldName(childField.sectionName) || childField.name
                  : childField.name;
                return (
                  <Form.Item
                    key={childFieldName}
                    className={`${childField.type}-item`}
                  >
                    {renderField(childField)}
                  </Form.Item>
                );
              })}
            </div>
          ),
          forceRender: true,
        },
      ]}
      defaultActiveKey={[]}
    />
  );
};

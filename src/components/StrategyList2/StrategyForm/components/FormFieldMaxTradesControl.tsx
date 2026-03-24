import React from "react";
import { Button } from "antd";
import { LabelPairedCircleQuestionMdBoldIcon } from "@deriv/quill-icons";
import { FormFieldComponentProps } from "./types";

export const FormFieldMaxTradesControl: React.FC<FormFieldComponentProps<number>> = ({
  value,
  onValueChange,
  field,
}) => {
  const current = value || 1;

  return (
    <div className="max-trades-field">
      <div className="field-label-row">
        <span className="field-label">{field.label}</span>
        <LabelPairedCircleQuestionMdBoldIcon
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        />
      </div>
      <div className="max-trades-controls">
        <Button
          className="stepper-btn"
          onClick={() => {
            if (current > 1) onValueChange(current - 1);
          }}
        >
          −
        </Button>
        <span className="trades-value">{current}</span>
        <Button
          className="stepper-btn"
          onClick={() => {
            onValueChange(current + 1);
          }}
        >
          +
        </Button>
      </div>
      <div className="max-trades-description">
        <span className="description-text">
          Maximum number of trades running at the same time
        </span>
      </div>
    </div>
  );
};

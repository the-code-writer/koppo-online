import React from "react";
import { Segmented } from "antd";
import { LabelPairedCircleQuestionMdBoldIcon } from "@deriv/quill-icons";
import { InputField } from "../../../InputField";
import { FormFieldComponentProps } from "./types";

interface IntervalValue {
  interval: number | string;
  unit: string;
}

export const FormFieldTradeInterval: React.FC<FormFieldComponentProps> = ({
  value,
  onValueChange,
  field,
}) => {
  const raw = value as any;
  const intervalObj: IntervalValue =
    raw && typeof raw === "object" && "interval" in raw
      ? raw
      : { interval: raw ?? "", unit: "seconds" };

  return (
    <div className="trade-interval-field">
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
      <div className="interval-controls">
        <InputField
          defaultValue={field.default}
          type="number"
          placeholder="Enter interval"
          value={intervalObj.interval}
          onChange={(val) => {
            const newValue = {
              interval: val,
              unit: intervalObj.unit || "seconds",
            };
            onValueChange(newValue);
          }}
        />
        <Segmented
          options={[
            { label: "Sec", value: "seconds" },
            { label: "Min", value: "minutes" },
          ]}
          value={intervalObj.unit || "seconds"}
          onChange={(val) => {
            const newValue = {
              interval: intervalObj.interval || 0,
              unit: val,
            };
            onValueChange(newValue);
          }}
        />
      </div>
      <div className="interval-description">
        <span className="description-text">
          Minimum time between starting new trades
        </span>
      </div>
    </div>
  );
};

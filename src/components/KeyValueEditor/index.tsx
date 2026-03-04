import React, { useState, useRef } from "react";
import { Button, Input, Typography, Flex } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import "./styles.scss";

const { Text } = Typography;

export interface KeyValuePair {
  key: string;
  value: string;
}

interface InternalRow {
  _id: number;
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  label?: string;
  initialValue?: unknown;
  onChange?: (value: KeyValuePair[]) => void;
  addButtonText?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

function normalizeInput(raw: unknown): KeyValuePair[] {
  if (Array.isArray(raw)) {
    return raw.map((item) =>
      typeof item === "object" && item !== null && "key" in item && "value" in item
        ? { key: String(item.key), value: String(item.value) }
        : { key: "", value: "" },
    );
  }
  if (typeof raw === "string" && raw.length > 0) {
    return raw.split(",").map((pair) => {
      const [k = "", ...rest] = pair.split(":");
      return { key: k.trim(), value: rest.join(":").trim() };
    });
  }
  return [];
}

function toExternal(rows: InternalRow[]): KeyValuePair[] {
  return rows.map(({ key, value }) => ({ key, value }));
}

export function KeyValueEditor({
  label,
  initialValue,
  onChange,
  addButtonText = "Add Entry",
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const idCounter = useRef(0);
  const nextId = () => ++idCounter.current;

  const [rows, setRows] = useState<InternalRow[]>(() =>
    normalizeInput(initialValue).map((p) => ({
      _id: nextId(),
      key: p.key,
      value: p.value,
    })),
  );

  const emit = (updated: InternalRow[]) => {
    setRows(updated);
    onChange?.(toExternal(updated));
  };

  const handleAdd = () => {
    emit([...rows, { _id: nextId(), key: "", value: "" }]);
  };

  const handleRemove = (id: number) => {
    emit(rows.filter((r) => r._id !== id));
  };

  const handleFieldChange = (
    id: number,
    field: "key" | "value",
    fieldValue: string,
  ) => {
    emit(
      rows.map((r) => (r._id === id ? { ...r, [field]: fieldValue } : r)),
    );
  };

  return (
    <div className="key-value-editor">
      {label && (
        <Text strong className="key-value-editor-label">
          {label}
        </Text>
      )}

      {rows.length > 0 && (
        <div className="key-value-editor-header">
          <Text type="secondary" className="key-value-col-label">
            Key
          </Text>
          <Text type="secondary" className="key-value-col-label">
            Value
          </Text>
          <div className="key-value-action-spacer" />
        </div>
      )}

      <div className="key-value-editor-rows">
        {rows.map((row) => (
          <Flex
            key={row._id}
            gap={8}
            align="center"
            className="key-value-editor-row"
          >
            <Input
              placeholder={keyPlaceholder}
              value={row.key}
              onChange={(e) =>
                handleFieldChange(row._id, "key", e.target.value)
              }
              className="key-value-input"
              size="middle"
            />
            <Input
              placeholder={valuePlaceholder}
              value={row.value}
              onChange={(e) =>
                handleFieldChange(row._id, "value", e.target.value)
              }
              className="key-value-input"
              size="middle"
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(row._id)}
              className="key-value-remove-btn"
              size="middle"
            />
          </Flex>
        ))}
      </div>

      <Button
        type="dashed"
        onClick={handleAdd}
        icon={<PlusOutlined />}
        block
        className="key-value-add-btn"
        size="middle"
      >
        {addButtonText}
      </Button>
    </div>
  );
}

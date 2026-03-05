import { useState, useRef, useEffect, useMemo } from "react";
import { Card, Select, TimePicker, DatePicker, Input, Row, Col, Button } from "antd";
import {
  DeleteOutlined,
  CalendarOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "./styles.scss";

export interface BotScheduleData {
  name: string;
  type: "hourly" | "daily" | "weekly" | "monthly";
  startTime: string | null;
  endTime: string | null;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  exclusions: ScheduleExclusion[];
}

export interface ScheduleExclusion {
  id: string;
  date: string;
  reason: string;
}

interface BotScheduleProps {
  onChange?: (schedule: BotScheduleData) => void;
  initialValue?: unknown;
}

const DEFAULT_SCHEDULE: BotScheduleData = {
  name: "Bot Schedule",
  type: "daily",
  startTime: null,
  endTime: null,
  daysOfWeek: [],
  dayOfMonth: null,
  exclusions: [],
};

const serializeSchedule = (schedule: BotScheduleData) =>
  JSON.stringify(schedule);
const DEFAULT_SERIALIZED = serializeSchedule(DEFAULT_SCHEDULE);

function normalizeSchedule(raw: unknown): BotScheduleData {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SCHEDULE };
  const r = raw as Record<string, unknown>;

  const type = ["hourly", "daily", "weekly", "monthly"].includes(
    r.type as string,
  )
    ? (r.type as BotScheduleData["type"])
    : "daily";

  // Convert dayjs/string startTime/endTime to HH:mm string
  const toTimeStr = (val: unknown): string | null => {
    if (!val) return null;
    if (typeof val === "string") {
      // Already a time string or ISO string — extract HH:mm
      const d = dayjs(val);
      return d.isValid() ? d.format("HH:mm") : val;
    }
    if (typeof val === "object" && val !== null && "$d" in val) {
      // dayjs object from a previous session
      const d = dayjs((val as any).$d || val);
      return d.isValid() ? d.format("HH:mm") : null;
    }
    return null;
  };

  const daysOfWeek = Array.isArray(r.daysOfWeek)
    ? r.daysOfWeek.filter((d): d is number => typeof d === "number")
    : [];
  const dayOfMonth = typeof r.dayOfMonth === "number" ? r.dayOfMonth : null;

  const exclusions: ScheduleExclusion[] = Array.isArray(r.exclusions)
    ? r.exclusions.map((ex: any) => ({
        id: String(ex?.id || Date.now() + Math.random()),
        date:
          typeof ex?.date === "string"
            ? ex.date
            : ex?.date
              ? dayjs(ex.date).format("YYYY-MM-DD")
              : dayjs().format("YYYY-MM-DD"),
        reason: String(ex?.reason || ""),
      }))
    : [];

  return {
    name: "Bot Schedule",
    type,
    startTime: toTimeStr(r.startTime),
    endTime: toTimeStr(r.endTime),
    daysOfWeek,
    dayOfMonth,
    exclusions,
  };
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function BotSchedule({ onChange, initialValue }: BotScheduleProps) {
  const normalizedInitial = useMemo(
    () => normalizeSchedule(initialValue),
    [initialValue],
  );

  const [schedule, setSchedule] = useState<BotScheduleData>(normalizedInitial);
  const exIdCounter = useRef(0);
  const lastSyncedExternal = useRef<string>(serializeSchedule(normalizedInitial));
  const isLocalChange = useRef(false);

  useEffect(() => {
    if (isLocalChange.current) {
      isLocalChange.current = false;
      return;
    }
    const normalizedKey = serializeSchedule(normalizedInitial);
    if (normalizedKey === lastSyncedExternal.current) return;
    if (normalizedKey === DEFAULT_SERIALIZED) return;

    setSchedule(normalizedInitial);
    lastSyncedExternal.current = normalizedKey;
  }, [normalizedInitial]);

  const update = (patch: Partial<BotScheduleData>) => {
    const next = { ...schedule, ...patch };
    isLocalChange.current = true;
    setSchedule(next);
    lastSyncedExternal.current = serializeSchedule(next);
    onChange?.(next);
  };

  const toTimeDayjs = (val: string | null): Dayjs | undefined => {
    if (!val) return undefined;
    const d = dayjs(val, "HH:mm");
    return d.isValid() ? d : undefined;
  };

  const addExclusion = () => {
    const id = `excl-${Date.now()}-${++exIdCounter.current}`;
    update({
      exclusions: [
        ...schedule.exclusions,
        { id, date: dayjs().format("YYYY-MM-DD"), reason: "" },
      ],
    });
  };

  const removeExclusion = (id: string) => {
    update({ exclusions: schedule.exclusions.filter((e) => e.id !== id) });
  };

  const updateExclusion = (id: string, patch: Partial<ScheduleExclusion>) => {
    update({
      exclusions: schedule.exclusions.map((e) =>
        e.id === id ? { ...e, ...patch } : e,
      ),
    });
  };

  return (
    <div className="bot-schedule">
      <div className="schedule-content">
        {/* Repeat Pattern */}
        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Repeat Pattern</label>
            <Select
              value={schedule.type}
              onChange={(val) => update({ type: val })}
              className="schedule-select"
              style={{ width: "100%" }}
              size="large"
            >
              <Select.Option value="hourly">Hourly</Select.Option>
              <Select.Option value="daily">Daily</Select.Option>
              <Select.Option value="weekly">Weekly</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
            </Select>
          </div>
        </div>

        {schedule.type !== "hourly" && (
          <>
            {/* Time Range */}
            <div className="schedule-row">
              <div className="schedule-field">
                <label className="field-label">Time Range</label>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12}>
                    <TimePicker
                      value={toTimeDayjs(schedule.startTime)}
                      onChange={(time) =>
                        update({
                          startTime: time ? time.format("HH:mm") : null,
                        })
                      }
                      format="HH:mm"
                      placeholder="Start time"
                      style={{ width: "100%" }}
                      size="large"
                      use12Hours
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <TimePicker
                      value={toTimeDayjs(schedule.endTime)}
                      onChange={(time) =>
                        update({ endTime: time ? time.format("HH:mm") : null })
                      }
                      format="HH:mm"
                      placeholder="End time"
                      style={{ width: "100%" }}
                      size="large"
                      use12Hours
                    />
                  </Col>
                </Row>
              </div>
            </div>
          </>
        )}

        {schedule.type === "weekly" && (
          <>
            {/* Days of Week */}
            <div className="schedule-row">
              <div className="schedule-field">
                <label className="field-label">Days of Week</label>
                <Row gutter={[8, 8]}>
                  {DAY_NAMES.map((day, index) => {
                    const isSelected = schedule.daysOfWeek.includes(index);
                    return (
                      <Col key={day} xs={12} sm={8} md={6}>
                        <button
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? schedule.daysOfWeek.filter((d) => d !== index)
                              : [...schedule.daysOfWeek, index].sort();
                            update({ daysOfWeek: next });
                          }}
                          className={`day-button ${isSelected ? "selected" : ""}`}
                        >
                          {day}
                        </button>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </div>
          </>
        )}

        {schedule.type === "monthly" && (
          <>
            {/* Day of Month */}
            <div className="schedule-row">
              <div className="schedule-field">
                <label className="field-label">Day of Month</label>
                <Row gutter={[4, 4]}>
                  {Array.from({ length: 31 }, (_, i) => {
                    const dayNum = i + 1;
                    const isSelected = schedule.dayOfMonth === dayNum;
                    return (
                      <Col key={dayNum} xs={4} sm={4} md={4}>
                        <button
                          type="button"
                          onClick={() =>
                            update({ dayOfMonth: isSelected ? null : dayNum })
                          }
                          className={`month-day-button ${isSelected ? "selected" : ""}`}
                        >
                          {dayNum}
                        </button>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </div>
          </>
        )}

        {/* Exclusions */}
        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Exclusions</label>

            {schedule.exclusions.map((ex) => (
              <div key={ex.id} className="exclusion-row">
                <DatePicker
                  className="exclusion-control"
                  value={
                    ex.date && dayjs(ex.date).isValid()
                      ? dayjs(ex.date)
                      : undefined
                  }
                  onChange={(date) =>
                    updateExclusion(ex.id, {
                      date: date ? date.format("YYYY-MM-DD") : "",
                    })
                  }
                  format="YYYY-MM-DD"
                  size="large"
                />
                <Input
                  placeholder="Reason (e.g., Holiday)"
                  value={ex.reason}
                  onChange={(e) =>
                    updateExclusion(ex.id, { reason: e.target.value })
                  }
                  className="exclusion-control"
                  size="large"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeExclusion(ex.id)}
                  size="large"
                />
              </div>
            ))}

            <Button
              type="dashed"
              onClick={addExclusion}
              icon={<PlusOutlined />}
              block
              className="add-exclusion-btn"
              size="middle"
            >
              Add Exclusion Date
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

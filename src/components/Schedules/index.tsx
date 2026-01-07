import { useState } from 'react';
import { Card, Button, Select, DatePicker, TimePicker, Checkbox, Row, Col, Collapse } from 'antd';
import { PlusOutlined, DeleteOutlined, CalendarOutlined, DownOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import './styles.scss';

const { Option } = Select;
const { Panel } = Collapse;

export interface ScheduleRule {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Dayjs;
  endDate?: Dayjs;
  startTime: Dayjs;
  endTime?: Dayjs;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  isEnabled: boolean;
  exclusions?: DateExclusion[];
}

export interface DateExclusion {
  id: string;
  date: Dayjs;
  reason: string;
}

interface SchedulesProps {
  onChange?: (schedules: ScheduleRule[]) => void;
  value?: ScheduleRule[];
}

export function Schedules({ onChange, value = [] }: SchedulesProps) {
  const [schedules, setSchedules] = useState<ScheduleRule[]>(value);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const addSchedule = () => {
    const newSchedule: ScheduleRule = {
      id: Date.now().toString(),
      name: `Schedule ${schedules.length + 1}`,
      type: 'daily',
      startDate: dayjs(),
      startTime: dayjs().set('hour', 9).set('minute', 0),
      isEnabled: true,
      exclusions: []
    };
    
    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules);
    onChange?.(updatedSchedules);
    setActiveKeys([...activeKeys, newSchedule.id]);
  };

  const updateSchedule = (id: string, updates: Partial<ScheduleRule>) => {
    const updatedSchedules = schedules.map(schedule => 
      schedule.id === id ? { ...schedule, ...updates } : schedule
    );
    setSchedules(updatedSchedules);
    onChange?.(updatedSchedules);
  };

  const deleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    setSchedules(updatedSchedules);
    onChange?.(updatedSchedules);
    setActiveKeys(activeKeys.filter(key => key !== id));
  };

  const addExclusion = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const newExclusion: DateExclusion = {
      id: Date.now().toString(),
      date: dayjs(),
      reason: 'Holiday'
    };

    const updatedSchedule = {
      ...schedule,
      exclusions: [...(schedule.exclusions || []), newExclusion]
    };

    updateSchedule(scheduleId, updatedSchedule);
  };

  const removeExclusion = (scheduleId: string, exclusionId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const updatedSchedule = {
      ...schedule,
      exclusions: schedule.exclusions?.filter(e => e.id !== exclusionId) || []
    };

    updateSchedule(scheduleId, updatedSchedule);
  };

  const renderScheduleCard = (schedule: ScheduleRule, index: number) => (
    <Panel
      key={schedule.id}
      header={
        <div className="schedule-header">
          <div className="schedule-title-combined">
            <span className="schedule-title">Schedule {index + 1}</span>
            <span className="bullet-separator">•</span>
            <span className="schedule-summary-text">{generateScheduleSummary(schedule)}</span>
          </div>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              deleteSchedule(schedule.id);
            }}
            className="delete-schedule-btn"
          />
        </div>
      }
      className="schedule-panel"
    >
      <div className="schedule-content">
        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Schedule Name</label>
            <Input
              placeholder="Enter schedule name"
              value={schedule.name}
              onChange={(e) => updateSchedule(schedule.id, { name: e.target.value })}
              className="schedule-name-input"
              size="large"
            />
          </div>
        </div>

        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Repeat Pattern</label>
            <Select
              value={schedule.type}
              onChange={(value) => updateSchedule(schedule.id, { type: value })}
              className="schedule-select"
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </div>
        </div>

        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Date Range</label>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <DatePicker
                  value={schedule.startDate}
                  onChange={(date) => updateSchedule(schedule.id, { startDate: date! })}
                  placeholder="Start date"
                  style={{ width: '100%' }}
              size="large"
                />
              </Col>
              <Col xs={24} sm={12}>
                <DatePicker
                  value={schedule.endDate}
                  onChange={(date) => updateSchedule(schedule.id, { endDate: date || undefined })}
                  placeholder="End date (optional)"
                  style={{ width: '100%' }}
              size="large"
                />
              </Col>
            </Row>
          </div>
        </div>

        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Time Range</label>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <TimePicker
                  value={schedule.startTime}
                  onChange={(time) => updateSchedule(schedule.id, { startTime: time! })}
                  format="HH:mm"
                  placeholder="Start time"
                  style={{ width: '100%' }}
              size="large"
                  use12Hours
                />
              </Col>
              <Col xs={24} sm={12}>
                <TimePicker
                  value={schedule.endTime}
                  onChange={(time) => updateSchedule(schedule.id, { endTime: time || undefined })}
                  format="HH:mm"
                  placeholder="End time (optional)"
                  style={{ width: '100%' }}
              size="large"
                  use12Hours
                />
              </Col>
            </Row>
          </div>
        </div>

        {schedule.type === 'weekly' && (
          <div className="schedule-row">
            <div className="schedule-field">
              <label className="field-label">Days of Week</label>
              <Checkbox.Group
                value={schedule.daysOfWeek || []}
                onChange={(values) => updateSchedule(schedule.id, { daysOfWeek: values as number[] })}
                className="days-checkbox-group"
              >
                <Row gutter={[8, 8]}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <Col key={day} xs={12} sm={8} md={6}>
                      <Checkbox value={index}>{day}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </div>
          </div>
        )}

        {schedule.type === 'monthly' && (
          <div className="schedule-row">
            <div className="schedule-field">
              <label className="field-label">Day of Month</label>
              <Select
                value={schedule.dayOfMonth}
                onChange={(value) => updateSchedule(schedule.id, { dayOfMonth: value })}
                placeholder="Select day"
                style={{ width: '100%' }}
              size="large"
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <Option key={i + 1} value={i + 1}>
                    {i + 1}{getOrdinalSuffix(i + 1)}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Exclusions</label>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => addExclusion(schedule.id)}
              className="add-exclusion-btn"
              block
              size="large"
            >
              Add Exclusion Date
            </Button>
            
            <div className="exclusions-list">
              {schedule.exclusions?.map((exclusion) => (
                <Card
                  key={exclusion.id}
                  className="exclusion-card"
                  size="small"
                  bodyStyle={{ padding: '12px' }}
                >
                  <Row gutter={[12, 8]} align="middle">
                    <Col xs={24} sm={8} md={6}>
                      <CalendarOutlined className="exclusion-icon" />
                      <DatePicker
                        value={exclusion.date}
                        onChange={(date) => {
                          const updatedExclusions = schedule.exclusions?.map((e: any) =>
                            e.id === exclusion.id ? { ...e, date: date! } : e
                          ) || [];
                          updateSchedule(schedule.id, { exclusions: updatedExclusions });
                        }}
                        size="large"
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={14}>
                      <Input
                        placeholder="Reason (e.g., Holiday)"
                        value={exclusion.reason}
                        onChange={() => {
                          const updatedExclusions = schedule.exclusions?.map((e: any) =>
                            e.id === exclusion.id ? { ...e, reason: e.target.value } : e
                          ) || [];
                          updateSchedule(schedule.id, { exclusions: updatedExclusions });
                        }}
                        size="large"
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={24} sm={4} md={4} className="text-right">
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => removeExclusion(schedule.id, exclusion.id)}
                        danger
                        size="small"
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );

  return (
    <div className="schedules">
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        expandIcon={({ isActive }) => (
          <DownOutlined
            rotate={isActive ? 180 : 0}
            style={{ fontSize: '16px', color: 'var(--text-primary)' }}
          />
        )}
        className="schedules-accordion"
        size="small"
      >
        {schedules.map((schedule, index) => renderScheduleCard(schedule, index))}
      </Collapse>
      
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={addSchedule}
        className="add-schedule-btn"
      >
        Add Schedule
      </Button>
    </div>
  );
}

// Helper functions
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function generateScheduleSummary(schedule: ScheduleRule): string {
  const { type, endDate, startTime, endTime, daysOfWeek, dayOfMonth } = schedule;
  
  let summary = '';
  
  switch (type) {
    case 'daily':
      summary = 'Daily';
      break;
    case 'weekly': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const selectedDays = daysOfWeek?.map(d => dayNames[d]).join(', ') || '';
      summary = selectedDays ? `Weekly on ${selectedDays}` : 'Weekly';
      break;
    }
    case 'monthly':
      summary = `Monthly on ${dayOfMonth}${getOrdinalSuffix(dayOfMonth || 1)}`;
      break;
    default:
      summary = 'Custom';
  }
  
  summary += ` from ${startTime.format('HH:mm')}`;
  if (endTime) {
    summary += ` to ${endTime.format('HH:mm')}`;
  }
  
  if (endDate) {
    summary += ` until ${endDate.format('MMM DD, YYYY')}`;
  }
  
  const exclusionCount = schedule.exclusions?.length || 0;
  if (exclusionCount > 0) {
    summary += ` (${exclusionCount} exclusion${exclusionCount > 1 ? 's' : ''})`;
  }
  
  return summary;
}

// Import Input component that was missing
import { Input } from 'antd';

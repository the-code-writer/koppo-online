import { useState } from 'react';
import { Card, Select, DatePicker, TimePicker, Row, Col } from 'antd';
import { DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import './styles.scss';

export interface BotSchedule {
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

interface BotScheduleProps {
  onChange?: (schedule: BotSchedule) => void;
  value?: BotSchedule;
}

export function BotSchedule({ onChange, value }: BotScheduleProps) {
  const [schedule, setSchedule] = useState<BotSchedule>(value || {
    id: 'bot-schedule-1',
    name: 'Bot Schedule',
    type: 'daily',
    startDate: dayjs(),
    startTime: dayjs().set('hour', 9).set('minute', 0),
    isEnabled: true,
    exclusions: []
  });

  const updateSchedule = (updates: Partial<BotSchedule>) => {
    const updatedSchedule = { ...schedule, ...updates };
    setSchedule(updatedSchedule);
    onChange?.(updatedSchedule);
  };

  const addExclusion = () => {
    const newExclusion: DateExclusion = {
      id: Date.now().toString(),
      date: dayjs(),
      reason: 'Holiday'
    };

    const updatedSchedule = {
      ...schedule,
      exclusions: [...(schedule.exclusions || []), newExclusion]
    };

    updateSchedule(updatedSchedule);
  };

  const removeExclusion = (exclusionId: string) => {
    const updatedSchedule = {
      ...schedule,
      exclusions: schedule.exclusions?.filter(e => e.id !== exclusionId) || []
    };

    updateSchedule(updatedSchedule);
  };

  return (
    <div className="bot-schedule">
      <div className="schedule-content">
        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Schedule Name</label>
            <Select
              value={schedule.name}
              onChange={(value) => updateSchedule({ name: value })}
              className="schedule-select"
              style={{ width: '100%' }}
              size="large"
            >
              <Select.Option value="Bot Schedule">Bot Schedule</Select.Option>
              <Select.Option value="Trading Hours">Trading Hours</Select.Option>
              <Select.Option value="Active Hours">Active Hours</Select.Option>
            </Select>
          </div>
        </div>

        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Repeat Pattern</label>
            <Select
              value={schedule.type}
              onChange={(value) => updateSchedule({ type: value })}
              className="schedule-select"
              style={{ width: '100%' }}
              size="large"
            >
              <Select.Option value="daily">Daily</Select.Option>
              <Select.Option value="weekly">Weekly</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </div>
        </div>

        {schedule.type === 'custom' && (
          <>
            <div className="schedule-row">
              <div className="schedule-field">
                <label className="field-label">Start Date & Time</label>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12}>
                    <DatePicker
                      value={schedule.startDate}
                      onChange={(date) => updateSchedule({ startDate: date! })}
                      placeholder="Start date"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <TimePicker
                      value={schedule.startTime}
                      onChange={(time) => updateSchedule({ startTime: time! })}
                      format="HH:mm"
                      placeholder="Start time"
                      style={{ width: '100%' }}
                      size="large"
                      use12Hours
                    />
                  </Col>
                </Row>
              </div>
            </div>

            <div className="schedule-row">
              <div className="schedule-field">
                <label className="field-label">End Date & Time (Optional)</label>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12}>
                    <DatePicker
                      value={schedule.endDate}
                      onChange={(date) => updateSchedule({ endDate: date || undefined })}
                      placeholder="End date (optional)"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <TimePicker
                      value={schedule.endTime}
                      onChange={(time) => updateSchedule({ endTime: time || undefined })}
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
          </>
        )}

        {(schedule.type === 'daily' || schedule.type === 'weekly' || schedule.type === 'monthly') && (
          <div className="schedule-row">
            <div className="schedule-field">
              <label className="field-label">Time Range</label>
              <Row gutter={[8, 8]}>
                <Col xs={24} sm={12}>
                  <TimePicker
                    value={schedule.startTime}
                    onChange={(time) => updateSchedule({ startTime: time! })}
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
                    onChange={(time) => updateSchedule({ endTime: time || undefined })}
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
        )}

        {schedule.type === 'weekly' && (
          <div className="schedule-row">
            <div className="schedule-field">
              <label className="field-label">Days of Week</label>
              <Row gutter={[8, 8]}>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                  const isSelected = (schedule.daysOfWeek || []).includes(index);
                  return (
                    <Col key={day} xs={12} sm={8} md={6}>
                      <button
                        type="button"
                        onClick={() => {
                          const currentDays = schedule.daysOfWeek || [];
                          if (isSelected) {
                            updateSchedule({ 
                              daysOfWeek: currentDays.filter(d => d !== index) 
                            });
                          } else {
                            updateSchedule({ 
                              daysOfWeek: [...currentDays, index].sort() 
                            });
                          }
                        }}
                        className={`day-button ${isSelected ? 'selected' : ''}`}
                        style={{
                          width: '100%',
                          padding: '12px 8px',
                          border: '2px solid',
                          borderColor: isSelected ? '#1890ff' : '#d9d9d9',
                          backgroundColor: isSelected ? '#f0f8ff' : '#fff',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#1890ff' : '#666',
                          transition: 'all 0.2s ease',
                          textAlign: 'center'
                        }}
                      >
                        {day}
                      </button>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        )}

        {schedule.type === 'monthly' && (
          <div className="schedule-row">
            <div className="schedule-field">
              <label className="field-label">Day of Month</label>
              <Row gutter={[4, 4]}>
                {Array.from({ length: 31 }, (_, i) => {
                  const dayNumber = i + 1;
                  const isSelected = schedule.dayOfMonth === dayNumber;
                  return (
                    <Col key={dayNumber} xs={4} sm={4} md={4}>
                      <button
                        type="button"
                        onClick={() => updateSchedule({ dayOfMonth: dayNumber })}
                        className={`day-button ${isSelected ? 'selected' : ''}`}
                        style={{
                          width: '100%',
                          padding: '8px 4px',
                          border: '2px solid',
                          borderColor: isSelected ? '#1890ff' : '#d9d9d9',
                          backgroundColor: isSelected ? '#f0f8ff' : '#fff',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#1890ff' : '#666',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                          minHeight: '40px'
                        }}
                      >
                        {dayNumber}
                      </button>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        )}

        <div className="schedule-row">
          <div className="schedule-field">
            <label className="field-label">Exclusions</label>
            <button
              type="button"
              onClick={addExclusion}
              className="add-exclusion-btn"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px dashed #1890ff',
                background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1890ff',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)';
                e.currentTarget.style.borderColor = '#096dd9';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)';
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <CalendarOutlined style={{ fontSize: '16px' }} />
              + Add Exclusion Date
            </button>
            
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
                      <DatePicker
                        value={exclusion.date}
                        onChange={(date) => {
                          const updatedExclusions = schedule.exclusions?.map((e) =>
                            e.id === exclusion.id ? { ...e, date: date! } : e
                          ) || [];
                          updateSchedule({ exclusions: updatedExclusions });
                        }}
                        size="large"
                        style={{ 
                          width: '100%',
                          border: '2px solid #d9d9d9',
                          borderRadius: '8px',
                          '&:hover': {
                            borderColor: '#40a9ff'
                          },
                          '&:focus': {
                            borderColor: '#1890ff',
                            boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                          }
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={14}>
                      <input
                        type="text"
                        placeholder="Reason (e.g., Holiday)"
                        value={exclusion.reason}
                        onChange={(e) => {
                          const updatedExclusions = schedule.exclusions?.map((e) =>
                            e.id === exclusion.id ? { ...e, reason: e.target.value } : e
                          ) || [];
                          updateSchedule({ exclusions: updatedExclusions });
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #d9d9d9',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '400',
                          color: '#666',
                          backgroundColor: '#fff',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d9d9d9';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={4} md={4} className="text-right">
                      <button
                        type="button"
                        onClick={() => removeExclusion(exclusion.id)}
                        style={{
                          background: '#fff',
                          border: '2px solid #ff4d4f',
                          borderRadius: '6px',
                          color: '#ff4d4f',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          padding: '8px 12px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ff4d4f';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.color = '#ff4d4f';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


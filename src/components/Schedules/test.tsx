import React from 'react';
import { Schedules, ScheduleRule } from '../Schedules';

// Simple test to verify the Schedules component can be rendered
export const SchedulesTest = () => {
  const testSchedules: ScheduleRule[] = [
    {
      id: '1',
      name: 'Test Schedule 1',
      type: 'daily',
      startDate: new Date(),
      startTime: new Date(),
      isEnabled: true,
      exclusions: []
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Schedules Component Test</h2>
      <Schedules 
        value={testSchedules}
        onChange={(schedules) => console.log('Schedules changed:', schedules)}
      />
    </div>
  );
};

import { Schedules, ScheduleRule } from '../Schedules';
import dayjs from 'dayjs';

// Simple test to verify the Schedules component can be rendered
export const SchedulesTest = () => {
  const testSchedules: ScheduleRule[] = [
    {
      id: '1',
      name: 'Test Schedule 1',
      type: 'daily',
      startDate: dayjs(),
      startTime: dayjs(),
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

import { useEffect, useState } from "react";

// Countdown Timer Component
export const CountDownTimer = ({
  run,
  timeStarted,
  timeStopped,
}: {
  run: boolean;
  timeStarted: string;
  timeStopped: string;
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!run || !timeStarted) {
      // If not running or no start time, don't calculate elapsed time
      return;
    }

    const startTime = new Date(timeStarted).getTime();

    const calculateElapsed = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed > 0 ? elapsed : 0);
    };

    // Calculate initial elapsed time
    calculateElapsed();

    // Update every second only when running
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [run, timeStarted]);

  // Handle paused state - show time elapsed until stopped
  useEffect(() => {
    if (!run && timeStarted && timeStopped) {
      const startTime = new Date(timeStarted).getTime();
      const stoppedTime = new Date(timeStopped).getTime();
      const elapsed = Math.floor((stoppedTime - startTime) / 1000);
      setElapsedSeconds(elapsed > 0 ? elapsed : 0);
    }
  }, [run, timeStarted, timeStopped]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return formatTime(elapsedSeconds);
};

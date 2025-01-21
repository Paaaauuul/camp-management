import React, { useEffect, useState } from 'react';
import { startOfDay, differenceInSeconds, differenceInDays, isWithinInterval } from 'date-fns';

// Interface defining the required props for the TimeIndicator
interface TimeIndicatorProps {
  dayWidth: number;
  days: Date[]; // Array of dates in the current range
}

export function TimeIndicator({ dayWidth, days }: TimeIndicatorProps) {
  // State to track the horizontal position of the indicator in pixels
  const [position, setPosition] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Calculates the indicator's position based on current time
    function updatePosition() {
      const now = new Date();
      
      // Check if today is within the current date range
      const isVisible = isWithinInterval(now, {
        start: days[0],
        end: days[days.length - 1]
      });
      
      setVisible(isVisible);
      
      if (!isVisible) return;
      
      // Calculate days from start of range to today
      const daysFromStart = differenceInDays(now, days[0]);
      
      // Calculate progress through current day
      const start = startOfDay(now);
      const totalSeconds = 24 * 60 * 60;
      const elapsedSeconds = differenceInSeconds(now, start);
      const percentage = elapsedSeconds / totalSeconds;
      
      // Calculate final position
      setPosition((daysFromStart * dayWidth) + (dayWidth * percentage));
    }

    // Set initial position when component mounts
    updatePosition();
    
    const interval = setInterval(updatePosition, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [dayWidth, days]);

  if (!visible) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none"
      style={{
        left: `${position}px`,
        height: '100%',
        transform: 'translateX(-50%)'
      }}
    >
      {/* Red dot at the top of the indicator line */}
      <div className="absolute top-0 h-3 w-3 -left-[5px] rounded-full bg-red-500 z-40" />
    </div>
  );
}
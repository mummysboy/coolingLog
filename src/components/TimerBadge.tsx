'use client';

import { useState, useEffect } from 'react';

interface TimerBadgeProps {
  startTime: Date | null;
  deadlineHours: number;
  isActive?: boolean;
  isError?: boolean;
}

export function TimerBadge({ startTime, deadlineHours, isActive = false, isError = false }: TimerBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<'safe' | 'warning' | 'danger'>('safe');

  useEffect(() => {
    if (!startTime || !isActive) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const elapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
      const remaining = deadlineHours - elapsed;

      if (remaining <= 0) {
        setTimeLeft('OVERDUE');
        setStatus('danger');
        return;
      }

      // Convert remaining hours to hours and minutes
      const hours = Math.floor(remaining);
      const minutes = Math.floor((remaining - hours) * 60);

      if (remaining <= 0.25) { // 15 minutes
        setStatus('danger');
      } else if (remaining <= 0.5) { // 30 minutes
        setStatus('warning');
      } else {
        setStatus('safe');
      }

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [startTime, deadlineHours, isActive]);

  if (!timeLeft || !isActive) {
    return null;
  }

  const getBadgeStyles = (currentStatus: 'safe' | 'warning' | 'danger') => {
    switch (currentStatus) {
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // If an explicit error is passed, treat as danger regardless of timer
  const actualStatus = isError ? 'danger' : status;
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-2 ${getBadgeStyles(actualStatus)}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        actualStatus === 'safe' ? 'bg-green-500' :
        actualStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      {timeLeft}
    </div>
  );
}

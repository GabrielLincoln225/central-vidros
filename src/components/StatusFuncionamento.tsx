import React, { useEffect, useState } from 'react';
import { getBusinessStatus, BusinessStatus } from '../utils/businessHours';

interface StatusFuncionamentoProps {
  compact?: boolean;
  className?: string;
}

export const StatusFuncionamento: React.FC<StatusFuncionamentoProps> = ({
  compact = false,
  className = '',
}) => {
  const [status, setStatus] = useState<BusinessStatus | null>(null);

  useEffect(() => {
    // Calculated strictly on client to avoid hydration mismatch
    setStatus(getBusinessStatus());
    const interval = setInterval(() => {
      setStatus(getBusinessStatus());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // While waiting for client hydration, render an empty box with reserved height
  if (!status) {
    return (
      <div
        className={`h-7 min-w-[140px] opacity-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const { isOpen, statusText, compactText } = status;

  return (
    <div
      className={`inline-flex items-center gap-2 text-sm font-medium ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        {isOpen && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isOpen ? 'bg-emerald-500' : 'bg-central-gray'
          }`}
        />
      </span>
      <span className={isOpen ? 'text-zinc-200' : 'text-central-gray'}>
        {compact ? compactText : statusText}
      </span>
    </div>
  );
};

import React, { useEffect, useState } from 'react';

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export default function CountdownTimer({ endTime, startTime }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!endTime) return null;

  const startMs = startTime ? new Date(startTime).getTime() : 0;
  const endMs = new Date(endTime).getTime();

  if (startMs && now < startMs) {
    return (
      <span className="countdown">
        Starts in {formatRemaining(startMs - now)}
      </span>
    );
  }

  const remaining = endMs - now;
  if (remaining <= 0) {
    return <span className="countdown ended">Auction Ended</span>;
  }

  return <span className="countdown">Ends in {formatRemaining(remaining)}</span>;
}

/**
 * Animated number counter for celebratory yield display
 */
import { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, duration = 800, decimals = 1, suffix = '', className = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const num = parseFloat(value) || 0;

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * num);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [num, duration]);

  return (
    <span className={className}>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

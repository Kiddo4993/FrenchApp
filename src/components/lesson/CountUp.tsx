"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Animates a number counting up from 0 (or its previous value) to `value`. Small, purposeful —
 * this is the one place in the results screens where a number ticking up actually communicates
 * something (XP just earned), not decoration for its own sake. */
export function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();
  const prevValue = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1], // fast start, gentle settle — "expo out"
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prevValue.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {display}
    </span>
  );
}

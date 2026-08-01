"use client";

import { useCallback, useRef, useState } from "react";

export function useAccentInput(initial = "") {
  const ref = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initial);

  const insert = useCallback((char: string) => {
    const el = ref.current;
    if (!el) {
      setValue((v) => v + char);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    setValue((v) => v.slice(0, start) + char + v.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    });
  }, []);

  return { ref, value, setValue, insert };
}

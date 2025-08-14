import { useEffect, useRef, useState, useCallback, startTransition } from 'react';

export function useDebouncedStoreSync<T>({
  initial,
  delay = 250,
  commit,
}: {
  initial: T;
  delay?: number;
  commit: (v: T) => void;
}) {
  const [local, setLocal] = useState<T>(initial);
  const tRef = useRef<number | null>(null);

  const flush = useCallback((next?: T) => {
    if (tRef.current) window.clearTimeout(tRef.current);
    const value = (next ?? local);
    startTransition(() => commit(value)); // schedule store write off the urgent path
  }, [local, commit]);

  useEffect(() => () => { if (tRef.current) window.clearTimeout(tRef.current); }, []);

  const schedule = useCallback((value: T) => {
    if (tRef.current) window.clearTimeout(tRef.current);
    // lightweight debounce; keeps typing snappy
    tRef.current = window.setTimeout(() => {
      startTransition(() => commit(value));
    }, delay) as unknown as number;
  }, [delay, commit]);

  return { local, setLocal, schedule, flush };
}

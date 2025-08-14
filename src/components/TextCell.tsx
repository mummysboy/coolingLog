import React, { useCallback, useEffect } from 'react';
import { useDebouncedStoreSync } from '@/hooks/useDebouncedStoreSync';

type TextCellProps = {
  formId: string;
  field: string;
  valueFromStore: string;
  readOnly?: boolean;
  // pass in a stable commit function from the parent that writes only this field
  commitField: (next: string) => void;
  onBlurValidate?: (next: string) => void; // optional validation hook
  className?: string;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
};

export function TextCell({
  formId,
  field,
  valueFromStore,
  readOnly,
  commitField,
  onBlurValidate,
  className = "w-full border rounded px-2 py-1",
  placeholder,
  type = "text",
  step,
  min,
  max,
  maxLength,
  inputMode,
}: TextCellProps) {
  const { local, setLocal, schedule, flush } = useDebouncedStoreSync<string>({
    initial: valueFromStore ?? '',
    delay: 250,
    commit: commitField,
  });

  // If the store changes externally (e.g., loading a form), sync local once
  useEffect(() => { setLocal(valueFromStore ?? ''); }, [valueFromStore, setLocal]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocal(next);
    schedule(next);
  }, [schedule, setLocal]);

  const onBlur = useCallback(() => {
    flush(); // ensure last char is committed
    if (onBlurValidate) onBlurValidate(local);
  }, [flush, onBlurValidate, local]);

  return (
    <input
      key={`${formId}-${field}`} // stable key
      type={type}
      value={local}
      onChange={onChange}
      onBlur={onBlur}
      readOnly={!!readOnly}
      className={className}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      maxLength={maxLength}
      inputMode={inputMode}
      // IMPORTANT: do not recreate this component tree on each store change
    />
  );
}

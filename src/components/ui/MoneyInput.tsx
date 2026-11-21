"use client";

import React, { useState, useEffect } from "react";

export interface MoneyInputProps {
  valueInPaise?: number | bigint | null | undefined;
  valuePaise?: number | bigint | null | undefined;
  onChangePaise: (paise: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function MoneyInput({
  valueInPaise: initialValueInPaise,
  valuePaise,
  onChangePaise,
  label,
  placeholder = "0",
  disabled = false,
  error,
  className = "",
}: MoneyInputProps) {
  const valueInPaise = valuePaise !== undefined ? valuePaise : initialValueInPaise;
  // Convert paise to rupees string for editing
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (valueInPaise == null || valueInPaise === 0 || valueInPaise === 0n) return "";
    return String(Math.round(Number(valueInPaise) / 100));
  });

  useEffect(() => {
    if (valueInPaise == null || valueInPaise === 0 || valueInPaise === 0n) {
      setDisplayValue("");
    } else {
      const rupees = Math.round(Number(valueInPaise) / 100);
      setDisplayValue(String(rupees));
    }
  }, [valueInPaise]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setDisplayValue(raw);
    const rupees = raw ? parseInt(raw, 10) : 0;
    onChangePaise(rupees * 100);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-label block">{label}</label>}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body font-medium text-[var(--text-secondary)] pointer-events-none select-none">
          ₹
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-standard pl-8 text-body font-medium tabular-nums ${
            error ? "border-[var(--danger-base)] focus:border-[var(--danger-base)]" : ""
          }`}
        />
      </div>
      {error && <p className="text-caption text-[var(--danger-base)] mt-1">{error}</p>}
    </div>
  );
}

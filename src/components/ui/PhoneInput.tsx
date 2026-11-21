"use client";

import React from "react";

interface PhoneInputProps {
  value: string;
  onChange: (normalizedE164: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  label = "Phone Number",
  placeholder = "98765 43210",
  error,
  disabled = false,
  className = "",
}: PhoneInputProps) {
  // Strip +91 for clean display inside input
  const localDigits = value.replace(/^\+91/, "").replace(/\D/g, "").slice(0, 10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    const normalized = rawDigits.length === 10 ? `+91${rawDigits}` : rawDigits;
    onChange(normalized);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-label block">{label}</label>}
      <div className="relative flex items-center">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body font-medium text-[var(--text-muted)] select-none pointer-events-none">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={localDigits}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={`input-standard pl-12 text-body font-mono tabular-nums ${
            error ? "border-[var(--danger-base)]" : ""
          }`}
        />
      </div>
      {error && <p className="text-caption text-[var(--danger-base)] mt-1">{error}</p>}
    </div>
  );
}

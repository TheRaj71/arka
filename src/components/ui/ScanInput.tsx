"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScanBarcode, CheckCircle2, AlertOctagon, Volume2, VolumeX } from "lucide-react";

export interface ScanInputProps {
  onScan: (serialNumber: string) => Promise<{ ok: boolean; message: string } | void> | void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ScanInput({
  onScan,
  placeholder = "Scan hardware barcode or type serial...",
  disabled = false,
  className = "",
}: ScanInputProps) {
  const [inputVal, setInputVal] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    serial: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Web Audio Synthesizer for tactile warehouse feedback
  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isSuccess ? "sine" : "sawtooth";
      osc.frequency.setValueAtTime(isSuccess ? 880 : 220, ctx.currentTime); // High pitch success, low pitch buzz error

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isSuccess ? 0.15 : 0.35));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.15 : 0.35));
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  const handleScanSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const serial = inputVal.trim().toUpperCase();
    if (!serial || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await onScan(serial);
      const isSuccess = result ? result.ok : true;
      const msg = result ? result.message : "Unit scanned successfully";

      playBeep(isSuccess);

      // Trigger mobile haptic vibration if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(isSuccess ? [50] : [100, 50, 100]);
      }

      setFeedback({
        type: isSuccess ? "success" : "error",
        message: msg,
        serial,
      });

      if (isSuccess) {
        setInputVal("");
      }
    } catch (err: any) {
      playBeep(false);
      setFeedback({
        type: "error",
        message: err?.message || "Failed to process scan.",
        serial,
      });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Sound Toggle Header */}
      <div className="flex items-center justify-between text-caption text-[var(--text-muted)]">
        <label className="text-label text-[var(--text-secondary)] font-medium">
          Barcode / QR Scanner Input
        </label>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[var(--accent-base)]" /> Audio Feedback ON
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Audio Muted
            </>
          )}
        </button>
      </div>

      {/* Massive Industrial Scan Input */}
      <form onSubmit={handleScanSubmit} className="relative flex items-center">
        <ScanBarcode className="absolute left-4 w-6 h-6 text-[var(--text-muted)] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={disabled || isProcessing}
          placeholder={placeholder}
          className="w-full h-14 pl-14 pr-28 text-heading font-mono tracking-wide uppercase bg-[var(--surface-card)] border-2 border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:normal-case placeholder:text-body focus:border-[var(--accent-base)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isProcessing}
          className="absolute right-2 h-10 px-4 btn-primary text-body-sm font-semibold disabled:opacity-30 cursor-pointer"
        >
          {isProcessing ? "Scanning..." : "Process Scan"}
        </button>
      </form>

      {/* Instant Tactile Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-body-sm flex items-start gap-3 transition-all ${
            feedback.type === "success"
              ? "bg-[var(--success-subtle)] border-[var(--success-border)] text-[var(--success-text)]"
              : "bg-[var(--danger-subtle)] border-[var(--danger-border)] text-[var(--danger-text)]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--success-base)] mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 shrink-0 text-[var(--danger-base)] mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-semibold">{feedback.message}</div>
            <div className="font-mono text-xs opacity-80 mt-0.5">Serial: {feedback.serial}</div>
          </div>
        </div>
      )}
    </div>
  );
}

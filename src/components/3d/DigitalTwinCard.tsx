"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import { formatDateIST } from "@/lib/formatters";

export interface DigitalTwinCardProps {
  unitType?: "inverter" | "battery" | "panel" | "charge_controller";
  assetType?: "inverter" | "battery" | "panel" | "charge_controller";
  serialNumber?: string;
  serialNo?: string;
  productName?: string;
  customerName?: string;
  installDate?: string | Date;
  warrantyYears?: number; // e.g. 2 for inverter/battery, 20 for panel
  warrantyMonthsTotal?: number;
  warrantyMonthsRemaining?: number;
  warrantyRemainingDays?: number;
  isInWarranty?: boolean;
  className?: string;
}

export function DigitalTwinCard({
  unitType: initialUnitType,
  assetType,
  serialNumber: initialSerial,
  serialNo,
  productName,
  customerName = "Anita Sharma",
  installDate = "2026-03-15",
  warrantyYears: initialYears,
  warrantyMonthsTotal,
  warrantyMonthsRemaining,
  warrantyRemainingDays: initialDays,
  isInWarranty: initialInWarranty,
  className = "",
}: DigitalTwinCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const unitType = assetType || initialUnitType || "inverter";
  const serialNumber = serialNo || initialSerial || "SN-INV-2026-0042";
  const warrantyYears = initialYears || (warrantyMonthsTotal ? Math.round(warrantyMonthsTotal / 12) : 2);
  const warrantyRemainingDays =
    initialDays !== undefined
      ? initialDays
      : warrantyMonthsRemaining !== undefined
      ? warrantyMonthsRemaining * 30
      : 580;
  const isInWarranty =
    initialInWarranty !== undefined
      ? initialInWarranty
      : warrantyMonthsRemaining !== undefined
      ? warrantyMonthsRemaining > 0
      : true;

  // Warranty Arc Math
  const totalDays = warrantyYears * 365;
  const progressRatio = Math.max(0, Math.min(1, warrantyRemainingDays / totalDays));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 130;
    const height = container.clientHeight || 130;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4, 3.5, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    // Procedural Model per Unit Type
    const unitGroup = new THREE.Group();

    if (unitType === "inverter") {
      const bodyGeo = new THREE.BoxGeometry(1.6, 2.2, 0.7);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      unitGroup.add(body);

      // Display Screen
      const screenGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0.4, 0.38);
      unitGroup.add(screen);
    } else if (unitType === "battery") {
      const batGeo = new THREE.BoxGeometry(1.8, 1.4, 1.0);
      const batMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });
      const bat = new THREE.Mesh(batGeo, batMat);
      unitGroup.add(bat);

      // Terminals
      const termGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16);
      const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
      const blkMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
      const term1 = new THREE.Mesh(termGeo, redMat);
      const term2 = new THREE.Mesh(termGeo, blkMat);
      term1.position.set(-0.5, 0.8, 0);
      term2.position.set(0.5, 0.8, 0);
      unitGroup.add(term1);
      unitGroup.add(term2);
    } else if (unitType === "panel") {
      const panelGeo = new THREE.BoxGeometry(1.4, 0.06, 2.4);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.7, roughness: 0.2 });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.rotation.x = 0.5;
      unitGroup.add(panel);
    } else {
      // Charge Controller
      const ccGeo = new THREE.BoxGeometry(1.2, 1.4, 0.5);
      const ccMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.5 });
      const cc = new THREE.Mesh(ccGeo, ccMat);
      unitGroup.add(cc);
    }

    scene.add(unitGroup);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      unitGroup.rotation.y += 0.008; // smooth slow rotation
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [unitType]);

  return (
    <div className={`card-surface p-4 flex flex-col sm:flex-row items-center gap-4 ${className}`}>
      {/* 3D Rotating Unit Preview */}
      <div
        ref={containerRef}
        className="w-28 h-28 shrink-0 flex items-center justify-center bg-[var(--surface-subtle)] rounded-lg border border-[var(--border-subtle)]"
        aria-label={`Digital twin 3D view of ${unitType}`}
      />

      {/* Middle Specs */}
      <div className="flex-1 space-y-1 text-left w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-caption font-semibold uppercase tracking-wider text-[var(--accent-base)]">
            {unitType.replace("_", " ")}
          </span>
          <span className="text-caption text-[var(--text-muted)]">· Digital Twin</span>
        </div>
        <div className="text-heading font-mono font-bold text-[var(--text-primary)] tracking-tight">
          {serialNumber}
        </div>
        <div className="text-body-sm text-[var(--text-secondary)]">
          Assigned to: <strong className="text-[var(--text-primary)]">{customerName}</strong>
        </div>
        <div className="text-caption text-[var(--text-muted)]">
          Commissioned: {formatDateIST(installDate)} ({warrantyYears} Year Warranty)
        </div>
      </div>

      {/* Right Warranty Ring & Verdict */}
      <div className="flex flex-col items-center justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--border-subtle)] pt-3 sm:pt-0 sm:pl-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="text-[var(--surface-subtle)]"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={isInWarranty ? "var(--success-base)" : "var(--danger-base)"}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            {isInWarranty ? (
              <ShieldCheck className="w-5 h-5 text-[var(--success-base)]" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-[var(--danger-base)]" />
            )}
          </div>
        </div>

        <div className="mt-1.5 text-center">
          <span
            className={`text-xs font-semibold block ${
              isInWarranty ? "text-[var(--success-base)]" : "text-[var(--danger-base)]"
            }`}
          >
            {isInWarranty ? "In Warranty" : "Out of Warranty"}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
            {isInWarranty ? `${Math.round(warrantyRemainingDays / 30)} mos left` : "Expired"}
          </span>
        </div>
      </div>
    </div>
  );
}

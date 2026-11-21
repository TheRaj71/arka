"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getPosition } from "suncalc";

export interface HeroHouse3DProps {
  generationKw?: number;
  liveKw?: number;
  batteryKw?: number;
  gridKw?: number;
  consumptionKw?: number;
  lat?: number; // default Punjab 31.0° N
  lng?: number; // default Punjab 75.5° E
  height?: number | string;
  className?: string;
}

export function HeroHouse3D({
  generationKw = 3.2,
  liveKw,
  batteryKw = 1.4,
  gridKw = 0.2,
  consumptionKw = 2.0,
  lat = 31.0,
  lng = 75.5,
  height,
  className = "",
}: HeroHouse3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"3d" | "schematic">("3d");
  const [sunAltitudeDeg, setSunAltitudeDeg] = useState(42);

  const activeGenKw = liveKw !== undefined ? liveKw : generationKw;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeTab !== "3d") return;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 320;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(14, 11, 16);
    camera.lookAt(0, 1.5, 0);

    // 2. Renderer (Capped DPR 1.5 for performance)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Ambient & Environment lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // 4. Calculate real Sun Position using SunCalc
    const sunPos = getPosition(new Date(), lat, lng);
    const altitude = Math.max(0.15, sunPos.altitude); // ensure above horizon
    const azimuth = sunPos.azimuth;
    setSunAltitudeDeg(Math.round((altitude * 180) / Math.PI));

    const sunDistance = 25;
    const sunX = sunDistance * Math.cos(altitude) * Math.sin(azimuth);
    const sunY = sunDistance * Math.sin(altitude);
    const sunZ = sunDistance * Math.cos(altitude) * Math.cos(azimuth);

    const sunLight = new THREE.DirectionalLight(0xfffdf5, 2.2);
    sunLight.position.set(sunX, sunY, sunZ);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // 5. Minimal Studio Plinth (Paper warm grey)
    const plinthGeo = new THREE.CylinderGeometry(8, 8.2, 0.4, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f4,
      roughness: 0.95,
      metalness: 0.05,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.2;
    plinth.receiveShadow = true;
    scene.add(plinth);

    // 6. Architectural Modern House Body
    const houseGroup = new THREE.Group();

    // Main wall
    const wallGeo = new THREE.BoxGeometry(6, 3.2, 4.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
    });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.6;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Pitched Roof (Satin dark slate)
    const roofGeo = new THREE.ConeGeometry(5.2, 1.8, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.7,
      metalness: 0.2,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.8;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.1, 1, 0.9);
    roof.castShadow = true;
    roof.receiveShadow = true;
    houseGroup.add(roof);

    // Neat Solar Panel Array on South-Facing Pitch (Deep Solar Indigo)
    const panelGeo = new THREE.BoxGeometry(0.95, 0.06, 1.6);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Solar cell deep blue
      roughness: 0.25,
      metalness: 0.6,
    });

    const panelRows = 2;
    const panelCols = 3;
    for (let r = 0; r < panelRows; r++) {
      for (let c = 0; c < panelCols; c++) {
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set((c - 1) * 1.15, 3.6 - r * 0.7, 1.4 + r * 0.65);
        panel.rotation.x = 0.45; // 25 degree standard rooftop tilt
        panel.castShadow = true;
        houseGroup.add(panel);
      }
    }

    // Inverter box on side wall
    const invGeo = new THREE.BoxGeometry(0.6, 0.9, 0.3);
    const invMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e, // Deep solar teal
      roughness: 0.5,
    });
    const inverter = new THREE.Mesh(invGeo, invMat);
    inverter.position.set(3.1, 1.5, 0.5);
    inverter.castShadow = true;
    houseGroup.add(inverter);

    scene.add(houseGroup);

    // 7. Subtle Ambient Idle Motion
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      // Gentle, calm 8-second slow orbit oscillation
      houseGroup.rotation.y = Math.sin(elapsed * 0.15) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
      wallGeo.dispose();
      wallMat.dispose();
      roofGeo.dispose();
      roofMat.dispose();
      panelGeo.dispose();
      panelMat.dispose();
      plinthGeo.dispose();
      plinthMat.dispose();
    };
  }, [activeTab, lat, lng]);

  return (
    <div className={`card-surface p-4 relative flex flex-col justify-between ${className}`}>
      {/* Top Bar with Real Solar Coordinates */}
      <div className="flex items-center justify-between text-body-sm z-10">
        <div>
          <span className="font-semibold text-[var(--text-primary)]">Solar Generation Studio</span>
          <span className="text-caption text-[var(--text-muted)] block">
            Punjab 31° N · Sun Altitude {sunAltitudeDeg}°
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-0.5 rounded-md border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab("3d")}
            className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
              activeTab === "3d"
                ? "bg-[var(--surface-card)] text-[var(--accent-base)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            3D View
          </button>
          <button
            onClick={() => setActiveTab("schematic")}
            className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
              activeTab === "schematic"
                ? "bg-[var(--surface-card)] text-[var(--accent-base)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Schematic
          </button>
        </div>
      </div>

      {/* 3D Canvas / Schematic View */}
      {activeTab === "3d" ? (
        <div
          ref={containerRef}
          className="w-full h-64 my-2 flex items-center justify-center relative cursor-grab active:cursor-grabbing"
          style={{ height: height ? (typeof height === "number" ? `${height}px` : height) : undefined }}
          aria-label="3D model of rooftop solar installation with real-time solar path"
        />
      ) : (
        <div
          className="w-full h-64 my-2 flex flex-col items-center justify-center p-4 bg-[var(--surface-subtle)] rounded-md border border-[var(--border-subtle)] text-body-sm space-y-3"
          style={{ height: height ? (typeof height === "number" ? `${height}px` : height) : undefined }}
        >
          <div className="text-label text-[var(--text-secondary)]">Single Line Diagram (SLD)</div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-2.5 py-1.5 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
              Rooftop Array ({generationKw} kW)
            </span>
            <span className="text-[var(--accent-base)] font-bold">→</span>
            <span className="px-2.5 py-1.5 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent-subtle-border)] text-[var(--accent-text)] font-semibold">
              Hybrid Inverter
            </span>
            <span className="text-[var(--accent-base)] font-bold">→</span>
            <span className="px-2.5 py-1.5 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
              Home Load ({consumptionKw} kW)
            </span>
          </div>
          <div className="text-caption text-[var(--text-muted)]">
            Net Meter export to grid: {gridKw} kW · Battery reserve: {batteryKw} kW
          </div>
        </div>
      )}

      {/* Four Quiet Energy Flow Metrics (Panels, Home, Grid, Battery) */}
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--border-subtle)] text-center">
        <div className="flex flex-col">
          <span className="text-caption text-[var(--text-muted)]">Solar Array</span>
          <span className="text-body-sm font-semibold tabular-nums text-[var(--accent-base)]">
            {generationKw.toFixed(1)} kW
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-[var(--text-muted)]">Home Load</span>
          <span className="text-body-sm font-semibold tabular-nums text-[var(--text-primary)]">
            {consumptionKw.toFixed(1)} kW
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-[var(--text-muted)]">Grid Flow</span>
          <span className="text-body-sm font-semibold tabular-nums text-[var(--text-secondary)]">
            {gridKw.toFixed(1)} kW
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-[var(--text-muted)]">Battery</span>
          <span className="text-body-sm font-semibold tabular-nums text-[var(--success-base)]">
            {batteryKw.toFixed(1)} kW
          </span>
        </div>
      </div>
    </div>
  );
}

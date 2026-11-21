"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

interface RoofSurvey3DProps {
  tiltDeg?: number; // e.g. 15 to 35
  azimuthDeg?: number; // 0 = North, 180 = South (ideal in India)
  usableAreaSqM?: number; // shadow-free area in sq.m
  requestedKw?: number; // requested system size
  dcCableM?: number;
  acCableM?: number;
  roofType?: "flat_rcc" | "tin_shed" | "tiled";
  className?: string;
}

export function RoofSurvey3D({
  tiltDeg = 22,
  azimuthDeg = 180, // South
  usableAreaSqM = 24,
  requestedKw = 3.3,
  dcCableM = 15,
  acCableM = 8,
  roofType = "flat_rcc",
  className = "",
}: RoofSurvey3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");

  // Calculations: 550W Mono PERC panel ~ 2.2 sq.m (fits 0.55 kW per panel)
  const PANEL_AREA = 2.2;
  const PANEL_KW = 0.55;
  const maxPanels = Math.floor(usableAreaSqM / PANEL_AREA);
  const maxPossibleKw = Number((maxPanels * PANEL_KW).toFixed(2));
  const neededPanels = Math.ceil(requestedKw / PANEL_KW);
  const fits = maxPossibleKw >= requestedKw;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 300;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera: Toggle between 3D isometric and 2D Top-down orthographic
    let camera: THREE.Camera;
    if (viewMode === "2d") {
      const aspect = width / height;
      const d = 8;
      camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 100);
      camera.position.set(0, 16, 0);
      camera.lookAt(0, 0, 0);
    } else {
      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(12, 11, 13);
      camera.lookAt(0, 1, 0);
    }

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(10, 18, 12);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 5. Roof Plane based on usable area (Width x Length)
    const roofLength = Math.max(4, Math.sqrt(usableAreaSqM * 1.3));
    const roofWidth = Math.max(3, usableAreaSqM / roofLength);

    const roofGroup = new THREE.Group();

    // Roof Slab
    const slabGeo = new THREE.BoxGeometry(roofLength, 0.3, roofWidth);
    const slabMat = new THREE.MeshStandardMaterial({
      color: roofType === "tin_shed" ? 0x94a3b8 : roofType === "tiled" ? 0xca8a04 : 0xe7e5e4,
      roughness: 0.9,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = 0.5;
    slab.receiveShadow = true;
    roofGroup.add(slab);

    // Apply Surveyor Tilt & Azimuth to array structure
    const tiltRad = (tiltDeg * Math.PI) / 180;
    const azimuthRad = ((azimuthDeg - 180) * Math.PI) / 180;

    // 6. Instanced Panels inside usable shadow-free area
    const actualPanelsCount = Math.min(maxPanels, neededPanels);
    const cols = Math.min(actualPanelsCount, Math.floor(roofLength / 1.2)) || 1;
    const rows = Math.ceil(actualPanelsCount / cols) || 1;

    const panelGeo = new THREE.BoxGeometry(1.0, 0.05, 2.0);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Solar Blue
      roughness: 0.3,
      metalness: 0.7,
    });

    const panelGroup = new THREE.Group();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r * cols + c >= actualPanelsCount) break;
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(
          (c - cols / 2 + 0.5) * 1.15,
          0.8 + r * 0.4,
          (r - rows / 2 + 0.5) * 1.9
        );
        panel.rotation.x = tiltRad;
        panel.castShadow = true;
        panelGroup.add(panel);
      }
    }
    panelGroup.rotation.y = azimuthRad;
    roofGroup.add(panelGroup);

    // 7. Sun-path Arc (31° N Punjab Celestial Meridian)
    const arcPoints: THREE.Vector3[] = [];
    const arcRadius = 7.5;
    for (let i = 0; i <= 32; i++) {
      const theta = (i / 32) * Math.PI; // Horizon to horizon
      const x = arcRadius * Math.cos(theta);
      const y = arcRadius * Math.sin(theta) * 0.85;
      const z = -arcRadius * Math.sin(theta) * 0.45; // South bias
      arcPoints.push(new THREE.Vector3(x, y + 0.5, z));
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMat = new THREE.LineDashedMaterial({
      color: 0xb45309, // Amber
      dashSize: 0.3,
      gapSize: 0.2,
    });
    const sunArc = new THREE.Line(arcGeo, arcMat);
    sunArc.computeLineDistances();
    scene.add(sunArc);

    scene.add(roofGroup);

    // Render loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (viewMode === "3d") {
        roofGroup.rotation.y += 0.001; // very slow subtle orbit
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
      slabGeo.dispose();
      slabMat.dispose();
      panelGeo.dispose();
      panelMat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
    };
  }, [tiltDeg, azimuthDeg, usableAreaSqM, requestedKw, viewMode, roofType]);

  return (
    <div className={`card-surface p-4 relative flex flex-col justify-between ${className}`}>
      {/* Visualizer Top Bar */}
      <div className="flex items-center justify-between text-body-sm z-10 mb-2">
        <div>
          <span className="font-semibold text-[var(--text-primary)]">Rooftop Geometry Visualizer</span>
          <span className="text-caption text-[var(--text-muted)] block">
            {azimuthDeg}° Azimuth (South) · {tiltDeg}° Tilt · {usableAreaSqM} m² usable
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-0.5 rounded-md border border-[var(--border-subtle)]">
          <button
            onClick={() => setViewMode("3d")}
            className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
              viewMode === "3d"
                ? "bg-[var(--surface-card)] text-[var(--accent-base)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            3D Iso
          </button>
          <button
            onClick={() => setViewMode("2d")}
            className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
              viewMode === "2d"
                ? "bg-[var(--surface-card)] text-[var(--accent-base)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            2D Plan
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className="w-full h-64 my-1 flex items-center justify-center relative cursor-grab active:cursor-grabbing"
        aria-label="3D procedural rooftop layout matching surveyor measurements"
      />

      {/* Result Strip & REQ-SURV-05 Sizing Gate Verification */}
      <div
        className={`p-3 rounded-lg border text-body-sm flex items-center justify-between mt-2 ${
          fits
            ? "bg-[var(--success-subtle)] border-[var(--success-border)] text-[var(--success-text)]"
            : "bg-[var(--warning-subtle)] border-[var(--warning-border)] text-[var(--warning-text)]"
        }`}
      >
        <div className="flex items-center gap-2">
          {fits ? (
            <CheckCircle2 className="w-4 h-4 text-[var(--success-base)] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[var(--warning-base)] shrink-0" />
          )}
          <span>
            {fits ? (
              <>
                Fits <strong>{requestedKw} kW</strong> ({neededPanels} panels × 550W, {(neededPanels * PANEL_AREA).toFixed(1)} m² required)
              </>
            ) : (
              <>
                Area Warning: Max <strong>{maxPossibleKw} kW</strong> ({maxPanels} panels) fits in {usableAreaSqM} m² shadow-free area
              </>
            )}
          </span>
        </div>
        <div className="text-caption font-mono hidden sm:block">
          DC Run: {dcCableM}m · AC Run: {acCableM}m
        </div>
      </div>
    </div>
  );
}

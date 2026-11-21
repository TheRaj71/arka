"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Layers, BatteryCharging, Zap } from "lucide-react";

interface SystemViewer3DProps {
  systemKw?: number;
  systemType?: "on_grid" | "off_grid" | "hybrid";
  highlightedPart?: string | null;
  onHoverPart?: (partId: string | null) => void;
  className?: string;
}

export function SystemViewer3D({
  systemKw = 3.3,
  systemType = "on_grid",
  highlightedPart,
  onHoverPart,
  className = "",
}: SystemViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [explodeFactor, setExplodeFactor] = useState(0.4); // 0 = closed, 1 = exploded
  const [currentSystemType, setCurrentSystemType] = useState<"on_grid" | "off_grid" | "hybrid">(systemType);

  useEffect(() => {
    setCurrentSystemType(systemType);
  }, [systemType]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(11, 9, 13);
    camera.lookAt(0, 1.5, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    keyLight.position.set(8, 16, 10);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // 5. System Components Group
    const rootGroup = new THREE.Group();

    // Plinth Ground Base
    const baseGeo = new THREE.BoxGeometry(7, 0.2, 5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.1;
    base.receiveShadow = true;
    rootGroup.add(base);

    // Component 1: Mounting Structure (Aluminum Rails)
    const railMat = new THREE.MeshStandardMaterial({
      color: highlightedPart === "structure" ? 0x0f766e : 0xa8a29e,
      metalness: 0.8,
      roughness: 0.3,
    });
    const railGeo = new THREE.BoxGeometry(5.2, 0.1, 0.15);
    const rail1 = new THREE.Mesh(railGeo, railMat);
    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(0, 0.6 + explodeFactor * 0.5, -0.8);
    rail2.position.set(0, 1.2 + explodeFactor * 0.5, 0.8);
    rootGroup.add(rail1);
    rootGroup.add(rail2);

    // Component 2: Solar Panels Tier
    const panelGeo = new THREE.BoxGeometry(1.2, 0.05, 2.2);
    const panelMat = new THREE.MeshStandardMaterial({
      color: highlightedPart === "panels" ? 0x0f766e : 0x1e3a8a,
      roughness: 0.25,
      metalness: 0.6,
    });
    const panelGroup = new THREE.Group();
    for (let i = -1.5; i <= 1.5; i += 1.5) {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(i * 1.05, 0, 0);
      panel.castShadow = true;
      panelGroup.add(panel);
    }
    panelGroup.position.set(0, 1.6 + explodeFactor * 2.2, 0);
    panelGroup.rotation.x = 0.3; // standard tilt
    rootGroup.add(panelGroup);

    // Component 3: Solar Inverter (Teal Box)
    const invGeo = new THREE.BoxGeometry(1.1, 1.5, 0.4);
    const invMat = new THREE.MeshStandardMaterial({
      color: highlightedPart === "inverter" ? 0x115e59 : 0x0f766e,
      roughness: 0.4,
    });
    const inverter = new THREE.Mesh(invGeo, invMat);
    inverter.position.set(-1.8 - explodeFactor * 1.5, 1.2, -1.2);
    inverter.castShadow = true;
    rootGroup.add(inverter);

    // Component 4: DC/AC Junction Box
    const jbGeo = new THREE.BoxGeometry(0.7, 0.9, 0.3);
    const jbMat = new THREE.MeshStandardMaterial({
      color: highlightedPart === "junction_box" ? 0x0f766e : 0x78716c,
      roughness: 0.6,
    });
    const jb = new THREE.Mesh(jbGeo, jbMat);
    jb.position.set(-0.5 - explodeFactor * 1.2, 1.0, -1.2);
    jb.castShadow = true;
    rootGroup.add(jb);

    // Component 5: Battery Bank (Present for Off-Grid and Hybrid only!)
    if (currentSystemType === "off_grid" || currentSystemType === "hybrid") {
      const batGeo = new THREE.BoxGeometry(1.6, 1.2, 0.8);
      const batMat = new THREE.MeshStandardMaterial({
        color: highlightedPart === "battery" ? 0x15803d : 0x1f2937,
        roughness: 0.5,
        metalness: 0.4,
      });
      const battery = new THREE.Mesh(batGeo, batMat);
      battery.position.set(1.8 + explodeFactor * 1.8, 0.6, -0.6);
      battery.castShadow = true;
      rootGroup.add(battery);
    }

    scene.add(rootGroup);

    // Render loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      rootGroup.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
      baseGeo.dispose();
      baseMat.dispose();
      railGeo.dispose();
      panelGeo.dispose();
      panelMat.dispose();
      invGeo.dispose();
      invMat.dispose();
      jbGeo.dispose();
      jbMat.dispose();
    };
  }, [explodeFactor, currentSystemType, highlightedPart]);

  return (
    <div className={`card-surface p-4 relative flex flex-col justify-between ${className}`}>
      {/* Top Controls */}
      <div className="flex items-center justify-between text-body-sm z-10 mb-2">
        <div>
          <span className="font-semibold text-[var(--text-primary)]">System Topology Viewer</span>
          <span className="text-caption text-[var(--text-muted)] block">
            {systemKw} kW {currentSystemType.replace("_", " ").toUpperCase()} BOM
          </span>
        </div>

        {/* On-Grid / Off-Grid Topology Toggle */}
        <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-0.5 rounded-md border border-[var(--border-subtle)]">
          <button
            onClick={() => setCurrentSystemType("on_grid")}
            className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
              currentSystemType === "on_grid"
                ? "bg-[var(--surface-card)] text-[var(--accent-base)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            On-Grid
          </button>
          <button
            onClick={() => setCurrentSystemType("off_grid")}
            className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
              currentSystemType === "off_grid"
                ? "bg-[var(--surface-card)] text-[var(--accent-base)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Off-Grid (Battery)
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className="w-full h-64 my-1 flex items-center justify-center relative cursor-grab active:cursor-grabbing"
        aria-label="3D exploded system view of solar template BOM items"
      />

      {/* Explode Slider Bar */}
      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4 text-caption text-[var(--text-muted)]">
        <div className="flex items-center gap-2 flex-1">
          <Layers className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
          <span className="text-label text-xs">Explode View</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodeFactor}
            onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent-base)] cursor-pointer"
          />
        </div>
        <div className="font-mono tabular-nums text-xs font-medium text-[var(--text-secondary)]">
          {Math.round(explodeFactor * 100)}%
        </div>
      </div>
    </div>
  );
}

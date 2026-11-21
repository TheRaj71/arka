"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface SolarHouse3DProps {
  generationKw?: number;
  batteryKw?: number;
  gridKw?: number;
  consumptionKw?: number;
  efficiency?: number;
}

export function SolarHouse3D({
  generationKw = 3.2,
  batteryKw = 1.4,
  gridKw = 0.2,
  consumptionKw = 2.0,
  efficiency = 98.4,
}: SolarHouse3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera (Isometric Orthographic or slight Perspective)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(16, 14, 18);
    camera.lookAt(0, 2, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(12, 22, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-10, 8, -10);
    scene.add(fillLight);

    // 5. Ground / Podium
    const podiumGeo = new THREE.CylinderGeometry(8.5, 9, 0.8, 64);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.1,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = -0.4;
    podium.receiveShadow = true;
    scene.add(podium);

    // 6. House Structure (Modern Glass & White Architecture)
    const houseGroup = new THREE.Group();

    // Main House Body
    const houseGeo = new THREE.BoxGeometry(6, 4, 5.5);
    const houseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });
    const houseMesh = new THREE.Mesh(houseGeo, houseMat);
    houseMesh.position.y = 2;
    houseMesh.castShadow = true;
    houseMesh.receiveShadow = true;
    houseGroup.add(houseMesh);

    // Large Front Glass Windows
    const windowGeo = new THREE.PlaneGeometry(4.8, 2.6);
    const windowMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.7,
      reflectivity: 0.9,
    });
    const frontWindow = new THREE.Mesh(windowGeo, windowMat);
    frontWindow.position.set(0, 2, 2.76);
    houseGroup.add(frontWindow);

    // Roof Structure (Sloped Pitch)
    const roofPitchedGeo = new THREE.ConeGeometry(5.2, 2.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
    });
    const roofMesh = new THREE.Mesh(roofPitchedGeo, roofMat);
    roofMesh.position.y = 4.8;
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.scale.set(1.1, 1, 0.9);
    roofMesh.castShadow = true;
    houseGroup.add(roofMesh);

    // 7. Solar Panels Array (Mounted on the sun-facing slope)
    const panelsGroup = new THREE.Group();
    const panelGeo = new THREE.BoxGeometry(1.1, 0.06, 1.8);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep solar blue
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
    });

    const panelGrid = [
      { x: -1.4, y: 4.8, z: 0.9 },
      { x: 0, y: 4.8, z: 0.9 },
      { x: 1.4, y: 4.8, z: 0.9 },
      { x: -1.4, y: 4.1, z: 1.7 },
      { x: 0, y: 4.1, z: 1.7 },
      { x: 1.4, y: 4.1, z: 1.7 },
    ];

    panelGrid.forEach((pos) => {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(pos.x, pos.y, pos.z);
      panel.rotation.x = -Math.PI / 6; // 30 degree solar tilt
      panel.castShadow = true;
      panelsGroup.add(panel);
    });

    houseGroup.add(panelsGroup);

    // Inverter on wall
    const invGeo = new THREE.BoxGeometry(0.8, 1.1, 0.4);
    const invMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.5,
    });
    const invMesh = new THREE.Mesh(invGeo, invMat);
    invMesh.position.set(3.1, 2, 0);
    houseGroup.add(invMesh);

    scene.add(houseGroup);

    // 8. Animation & Interaction loop
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      houseGroup.rotation.y += deltaX * 0.008;
      podium.rotation.y += deltaX * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Subtle breathing auto-rotation when not dragging
      if (!isDragging) {
        houseGroup.rotation.y += 0.0025;
        podium.rotation.y += 0.0025;
      }

      // Sun pulsing glow
      const elapsedTime = clock.getElapsedTime();
      panelMat.emissiveIntensity = 0.2 + 0.1 * Math.sin(elapsedTime * 2.5);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-56 cursor-grab active:cursor-grabbing rounded-xl overflow-hidden"
        title="Click and drag to rotate the 3D solar model"
      />

      {/* Energy Metrics overlay matching reference image */}
      <div className="w-full grid grid-cols-2 gap-2 mt-2 px-2 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
            ☀️
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Solar Output</div>
            <div className="font-bold text-slate-800">{generationKw.toFixed(2)} kW</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
            ⚡
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Self-Consumption</div>
            <div className="font-bold text-slate-800">{consumptionKw.toFixed(2)} kW</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
            🔋
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Battery Storage</div>
            <div className="font-bold text-slate-800">{batteryKw.toFixed(2)} kW</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold">
            🌐
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Grid Import</div>
            <div className="font-bold text-slate-800">{gridKw.toFixed(2)} kW</div>
          </div>
        </div>
      </div>
    </div>
  );
}

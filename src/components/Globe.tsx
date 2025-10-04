"use client";

import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import ThreeGlobe from "three-globe";

export interface Satellite {
  id: string;
  title: string;
  lat: number;
  lon: number;
  morse: string;
  answer: string;
  choices: string[];
  hint: string;
  level: number;
}

interface GlobeProps {
  satellites: Satellite[];
  onSatelliteClick: (satellite: Satellite) => void;
  unlockedLevel: number;
  completedSatellites: Set<string>;
}

export default function Globe({
  satellites,
  onSatelliteClick,
  unlockedLevel,
  completedSatellites,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // レンダラー
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // シーン
    const scene = new Scene();
    scene.background = new Color(0x000814);

    // カメラ
    const camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 300;

    // ライト
    const ambientLight = new AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // 地球
    const globe = new ThreeGlobe()
      .globeImageUrl(
        "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      )
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .atmosphereColor("#6dd5ed")
      .atmosphereAltitude(0.15);

    scene.add(globe);

    // 衛星データを準備（軌道角度を初期化）
    const satelliteData = satellites.map((sat, index) => {
      const isUnlocked = sat.level <= unlockedLevel;
      const isCompleted = completedSatellites.has(sat.id);

      let color = "#4a90e2"; // 青：入門
      if (sat.level === 2) color = "#f5a623"; // 黄：中級
      if (sat.level === 3) color = "#e74c3c"; // 赤：上級

      return {
        lat: sat.lat,
        lng: sat.lon,
        orbitalAngle: (index * 137.5) % 360, // 初期角度（黄金角で分散）
        orbitalSpeed: 0.05 + (index % 5) * 0.01, // 各衛星で少し速度を変える
        size: isCompleted ? 2.0 : 1.5,
        color: isCompleted ? "#50fa7b" : isUnlocked ? color : "#555555",
        satellite: sat,
        isUnlocked,
        isCompleted,
        label: `${isCompleted ? "✅" : "🛰"} ${sat.title}`,
      };
    });

    // 衛星をラベルとして表示（絵文字）
    globe
      .labelsData(satelliteData)
      .labelLat("lat")
      .labelLng("lng")
      .labelAltitude(0.01)
      .labelText((d: any) => {
        const sat = d as (typeof satelliteData)[0];
        return sat.isCompleted ? "✅" : sat.isUnlocked ? "🛰️" : "🔒";
      })
      .labelSize(() => 2)
      .labelDotRadius(() => 0.5)
      .labelColor((d: any) => {
        const sat = d as (typeof satelliteData)[0];
        return sat.isCompleted
          ? "#50fa7b"
          : sat.isUnlocked
            ? "#ffffff"
            : "#666666";
      })
      .labelResolution(2);

    // マウス操作
    let isDragging = false;
    let _hasMoved = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      _hasMoved = false;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        return;
      }

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        _hasMoved = true;
      }

      rotation.y += deltaX * 0.005;
      rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };

    // クリックイベント（ラベルのクリック判定）
    const onClick = () => {
      if (_hasMoved) return;

      // ラベルの位置をチェック（簡易版）
      for (const sat of satelliteData) {
        if (!sat.isUnlocked) continue;

        // 3D座標から2D座標へ変換（簡易）
        const phi = ((90 - sat.lat) * Math.PI) / 180;
        const theta = ((sat.lng + 180) * Math.PI) / 180;
        const radius = 100;

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        // カメラからの距離
        const dx = x - camera.position.x;
        const dy = y - camera.position.y;
        const dz = z - camera.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // クリック範囲（広め）
        if (distance < 120) {
          onSatelliteClick(sat.satellite);
          break;
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("click", onClick);

    // ホイールズーム
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.1;
      camera.position.z = Math.max(150, Math.min(500, camera.position.z));
    };

    renderer.domElement.addEventListener("wheel", onWheel);

    // アニメーション
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // 衛星の軌道を更新
      satelliteData.forEach((sat) => {
        sat.orbitalAngle += sat.orbitalSpeed;
        if (sat.orbitalAngle >= 360) sat.orbitalAngle -= 360;
        sat.lng = sat.satellite.lon + sat.orbitalAngle;
      });

      // 衛星データを更新
      globe.labelsData([...satelliteData]);

      globe.rotation.y = rotation.y;
      globe.rotation.x = rotation.x;

      renderer.render(scene, camera);
    };

    animate();

    // リサイズ対応
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // クリーンアップ
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("wheel", onWheel);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [
    satellites,
    onSatelliteClick,
    unlockedLevel,
    completedSatellites,
    isClient,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: "grab" }}
    />
  );
}

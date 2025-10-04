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

    // 衛星データを準備
    const satelliteData = satellites.map((sat) => {
      const isUnlocked = sat.level <= unlockedLevel;
      const isCompleted = completedSatellites.has(sat.id);

      let color = "#4a90e2"; // 青：入門
      if (sat.level === 2) color = "#f5a623"; // 黄：中級
      if (sat.level === 3) color = "#e74c3c"; // 赤：上級

      return {
        lat: sat.lat,
        lng: sat.lon,
        size: isCompleted ? 0.8 : 0.5,
        color: isCompleted ? "#50fa7b" : isUnlocked ? color : "#555555",
        satellite: sat,
        isUnlocked,
        isCompleted,
      };
    });

    // 衛星をポイントとして表示
    globe
      .pointsData(satelliteData)
      .pointLat("lat")
      .pointLng("lng")
      .pointColor("color")
      .pointAltitude(0.1)
      .pointRadius("size");

    // マウス操作
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rotation.y += deltaX * 0.005;
      rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      if (isDragging) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const _x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const _y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // 簡易的なクリック判定（距離ベース）
      const clickThreshold = 0.15;
      for (const sat of satelliteData) {
        if (!sat.isUnlocked) continue;

        // 緯度経度を3D座標に変換して判定（簡易版）
        const phi = ((90 - sat.lat) * Math.PI) / 180;
        const theta = ((sat.lng + 180) * Math.PI) / 180;
        const radius = 100;

        const satX = -(radius * Math.sin(phi) * Math.cos(theta));
        const satY = radius * Math.cos(phi);
        const satZ = radius * Math.sin(phi) * Math.sin(theta);

        // カメラ空間での投影（簡易）
        const distance = Math.sqrt(
          (satX - camera.position.x) ** 2 +
            (satY - camera.position.y) ** 2 +
            (satZ - camera.position.z) ** 2,
        );

        if (distance < clickThreshold * 1000) {
          onSatelliteClick(sat.satellite);
          break;
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
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

      // 自動回転（ドラッグ中は無効）
      if (!isDragging) {
        rotation.y += 0.001;
      }

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
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
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

"use client";

import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
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

    // 衛星をポイントとして表示
    globe
      .pointsData(satelliteData)
      .pointLat("lat")
      .pointLng("lng")
      .pointColor("color")
      .pointAltitude(0)
      .pointRadius("size");

    // マウス操作
    let isDragging = false;
    let hasMoved = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      hasMoved = false;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        // ホバー時のカーソル変更
        const rect = renderer.domElement.getBoundingClientRect();
        const _mouse = {
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
        };

        // 衛星との距離チェック（ホバー時のカーソル変更）
        let nearSatellite = false;
        for (const sat of satelliteData) {
          if (!sat.isUnlocked) continue;

          // 現在の経度を使用
          const currentLng = sat.lng;
          const phi = ((90 - sat.lat) * Math.PI) / 180;
          const theta = ((currentLng + 180) * Math.PI) / 180;
          const radius = 100;

          const satX = -(radius * Math.sin(phi) * Math.cos(theta));
          const satY = radius * Math.cos(phi);
          const satZ = radius * Math.sin(phi) * Math.sin(theta);

          // 画面上の距離を計算（簡易）
          const distance = Math.sqrt(
            (satX - camera.position.x) ** 2 +
              (satY - camera.position.y) ** 2 +
              (satZ - camera.position.z) ** 2,
          );

          if (distance < 150) {
            nearSatellite = true;
            break;
          }
        }

        renderer.domElement.style.cursor = nearSatellite ? "pointer" : "grab";
        return;
      }

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasMoved = true;
      }

      rotation.y += deltaX * 0.005;
      rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };

    const onClick = (e: MouseEvent) => {
      if (hasMoved) return; // ドラッグ中はクリックとみなさない

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );

      // Raycasterでクリック判定
      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // 衛星の現在位置をVector3の配列に変換
      const satellitePositions: Array<{
        position: Vector3;
        data: (typeof satelliteData)[0];
      }> = [];

      for (const sat of satelliteData) {
        if (!sat.isUnlocked) continue;

        // 現在の経度を使用（アニメーション中の位置）
        const currentLng = sat.lng;
        const phi = ((90 - sat.lat) * Math.PI) / 180;
        const theta = ((currentLng + 180) * Math.PI) / 180;
        const radius = 100;

        const position = new Vector3(
          -(radius * Math.sin(phi) * Math.cos(theta)),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta),
        );

        satellitePositions.push({ position, data: sat });
      }

      // 各衛星に対してレイキャスト
      let closestSat: (typeof satelliteData)[0] | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const { position, data } of satellitePositions) {
        const ray = raycaster.ray;
        const distance = ray.distanceToPoint(position);

        // クリック範囲を広めに（画面上で大きめに）
        const threshold = (data.size * 5) / (camera.position.z / 100);

        if (distance < threshold && distance < closestDistance) {
          closestDistance = distance;
          closestSat = data;
        }
      }

      if (closestSat) {
        onSatelliteClick(closestSat.satellite);
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
      globe.pointsData(satelliteData);

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

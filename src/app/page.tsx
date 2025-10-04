"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Satellite } from "@/components/Globe";
import satellitesData from "@/data/satellites.json";
import {
  type GameProgress,
  incrementAttempts,
  loadProgress,
  markSatelliteComplete,
  resetProgress,
  saveProgress,
  updateLevel,
} from "@/lib/progress";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });
const QuizModal = dynamic(() => import("@/components/QuizModal"), {
  ssr: false,
});

export default function Home() {
  const [progress, setProgress] = useState<GameProgress>({
    satellites: {},
    level: 1,
    totalCompleted: 0,
  });
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(
    null,
  );
  const [showCongrats, setShowCongrats] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const satellites = satellitesData as Satellite[];

  useEffect(() => {
    setIsClient(true);
    const loaded = loadProgress();
    setProgress(loaded);
  }, []);

  const completedSatellites = new Set(
    Object.entries(progress.satellites)
      .filter(([_, sat]) => sat.completed)
      .map(([id]) => id),
  );

  const handleSatelliteClick = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
  };

  const handleAnswer = (correct: boolean) => {
    if (!selectedSatellite) return;

    let newProgress = progress;

    if (correct) {
      newProgress = markSatelliteComplete(progress, selectedSatellite.id);
      newProgress = updateLevel(newProgress, satellites);

      // 全クリアチェック
      if (newProgress.totalCompleted === satellites.length) {
        setShowCongrats(true);
      }
    } else {
      newProgress = incrementAttempts(progress, selectedSatellite.id);
    }

    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleReset = () => {
    if (confirm("進捗をリセットしますか？")) {
      const newProgress = resetProgress();
      setProgress(newProgress);
      setShowCongrats(false);
    }
  };

  const level1Satellites = satellites.filter((s) => s.level === 1);
  const level2Satellites = satellites.filter((s) => s.level === 2);
  const level3Satellites = satellites.filter((s) => s.level === 3);

  const completedLevel1 = level1Satellites.filter((s) =>
    completedSatellites.has(s.id),
  ).length;
  const completedLevel2 = level2Satellites.filter((s) =>
    completedSatellites.has(s.id),
  ).length;
  const completedLevel3 = level3Satellites.filter((s) =>
    completedSatellites.has(s.id),
  ).length;

  if (!isClient) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-950 relative overflow-hidden">
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/90 to-transparent p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              🛰 衛星モールスクイズ
            </h1>
            <p className="text-slate-400">
              地球を回る衛星からモールス信号を受信せよ
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
          >
            進捗リセット
          </button>
        </div>
      </div>

      {/* サイドバー（進捗） */}
      <div className="absolute top-24 right-6 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-700 max-w-xs">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span> 進捗状況
        </h2>

        <div className="space-y-4">
          {/* Level 1 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-400">
                🟦 入門衛星
              </span>
              <span className="text-sm text-slate-400">
                {completedLevel1}/{level1Satellites.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(completedLevel1 / level1Satellites.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Level 2 */}
          <div className={progress.level < 2 ? "opacity-50" : ""}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-400">
                🟨 中級衛星
              </span>
              <span className="text-sm text-slate-400">
                {completedLevel2}/{level2Satellites.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(completedLevel2 / level2Satellites.length) * 100}%`,
                }}
              />
            </div>
            {progress.level < 2 && (
              <p className="text-xs text-slate-500 mt-1">
                🔒 入門衛星をすべてクリアで解放
              </p>
            )}
          </div>

          {/* Level 3 */}
          <div className={progress.level < 3 ? "opacity-50" : ""}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-400">
                🟥 実在衛星
              </span>
              <span className="text-sm text-slate-400">
                {completedLevel3}/{level3Satellites.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(completedLevel3 / level3Satellites.length) * 100}%`,
                }}
              />
            </div>
            {progress.level < 3 && (
              <p className="text-xs text-slate-500 mt-1">
                🔒 中級衛星をすべてクリアで解放
              </p>
            )}
          </div>
        </div>

        {/* 総合進捗 */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">総合進捗</span>
            <span className="text-sm text-slate-400">
              {progress.totalCompleted}/{satellites.length}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(progress.totalCompleted / satellites.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 衛星リスト */}
      <div className="absolute top-24 left-6 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-700 max-w-xs max-h-[70vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🛰</span> 衛星リスト
        </h2>
        <div className="space-y-2">
          {satellites.map((sat) => {
            const isUnlocked = sat.level <= progress.level;
            const isCompleted = completedSatellites.has(sat.id);
            let levelColor = "text-blue-400";
            let bgColor = "bg-blue-500/10";
            let borderColor = "border-blue-500/30";
            if (sat.level === 2) {
              levelColor = "text-yellow-400";
              bgColor = "bg-yellow-500/10";
              borderColor = "border-yellow-500/30";
            }
            if (sat.level === 3) {
              levelColor = "text-red-400";
              bgColor = "bg-red-500/10";
              borderColor = "border-red-500/30";
            }

            return (
              <button
                key={sat.id}
                type="button"
                onClick={() => isUnlocked && handleSatelliteClick(sat)}
                disabled={!isUnlocked}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isCompleted
                    ? "bg-green-500/20 border-green-500/50"
                    : isUnlocked
                      ? `${bgColor} ${borderColor} hover:bg-opacity-30`
                      : "bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {isCompleted ? "✅" : isUnlocked ? "🛰" : "🔒"}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isCompleted
                        ? "text-green-300"
                        : isUnlocked
                          ? "text-white"
                          : "text-slate-500"
                    }`}
                  >
                    {sat.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${levelColor}`}>
                    Lv.{sat.level}
                  </span>
                  <span className="text-xs text-slate-500">
                    {isCompleted
                      ? "クリア済み"
                      : isUnlocked
                        ? "挑戦可能"
                        : "未解放"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 操作ガイド */}
      <div className="absolute bottom-6 right-6 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-700 max-w-xs">
        <h3 className="text-sm font-bold text-white mb-2">🎮 操作方法</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>🖱 ドラッグ: 地球を回転</li>
          <li>🎡 ホイール: ズーム</li>
          <li>🛰 地球上をクリック または 左のリストから選択</li>
          <li>💡 衛星にカーソルを合わせると詳細表示</li>
        </ul>
      </div>

      {/* 地球 */}
      <Globe
        satellites={satellites}
        onSatelliteClick={handleSatelliteClick}
        unlockedLevel={progress.level}
        completedSatellites={completedSatellites}
      />

      {/* クイズモーダル */}
      {selectedSatellite && (
        <QuizModal
          satellite={selectedSatellite}
          onClose={() => setSelectedSatellite(null)}
          onAnswer={handleAnswer}
        />
      )}

      {/* 全クリア演出 */}
      {showCongrats && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-6">🎊</div>
            <h2 className="text-5xl font-bold text-white mb-4">
              全世界受信達成！
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              すべての衛星からの信号を受信しました
            </p>
            <button
              type="button"
              onClick={() => setShowCongrats(false)}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-lg hover:scale-105 transition-transform"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

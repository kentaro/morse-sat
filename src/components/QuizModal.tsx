"use client";

import { useCallback, useEffect, useState } from "react";
import { MorsePlayer } from "@/lib/morse";
import type { Satellite } from "./Globe";

interface QuizModalProps {
  satellite: Satellite | null;
  onClose: () => void;
  onAnswer: (correct: boolean) => void;
}

export default function QuizModal({
  satellite,
  onClose,
  onAnswer,
}: QuizModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [morsePlayer, setMorsePlayer] = useState<MorsePlayer | null>(null);

  const playMorse = useCallback(async (player: MorsePlayer, morse: string) => {
    setIsPlaying(true);
    await player.play(morse);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (satellite) {
      const player = new MorsePlayer(15); // 15 WPM
      setMorsePlayer(player);

      // 自動再生
      playMorse(player, satellite.morse);

      return () => {
        player.dispose();
      };
    }
  }, [satellite, playMorse]);

  const handleChoice = (choice: string) => {
    setSelectedChoice(choice);
  };

  const handleSubmit = () => {
    if (!selectedChoice || !satellite) return;

    const correct = selectedChoice === satellite.answer;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleNext = () => {
    onAnswer(isCorrect);
    handleClose();
  };

  const handleClose = () => {
    setSelectedChoice(null);
    setShowResult(false);
    setIsCorrect(false);
    onClose();
  };

  const handleReplay = () => {
    if (morsePlayer && satellite) {
      playMorse(morsePlayer, satellite.morse);
    }
  };

  if (!satellite) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-700">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {satellite.title}
            </h2>
            <p className="text-slate-400 text-sm">
              Level {satellite.level} | 緯度: {satellite.lat.toFixed(2)}°, 経度:{" "}
              {satellite.lon.toFixed(2)}°
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Close icon"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* モールス信号表示 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">
              受信中の信号
            </span>
            <button
              type="button"
              onClick={handleReplay}
              disabled={isPlaying}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors text-sm"
            >
              {isPlaying ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  再生中...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    role="img"
                    aria-label="Play icon"
                  >
                    <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  再生
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-xl text-green-400 tracking-wider break-all">
            {satellite.morse}
          </div>
        </div>

        {!showResult ? (
          <>
            {/* ヒント */}
            <div className="mb-6">
              <p className="text-slate-400 text-sm mb-2">💡 ヒント:</p>
              <p className="text-slate-300">{satellite.hint}</p>
            </div>

            {/* 選択肢 */}
            <div className="space-y-3 mb-6">
              <p className="text-slate-400 text-sm font-medium mb-3">
                この信号は何を送信していますか？
              </p>
              {satellite.choices.map((choice) => (
                <button
                  type="button"
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedChoice === choice
                      ? "border-blue-500 bg-blue-500/20 text-white"
                      : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>

            {/* 回答ボタン */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedChoice}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              回答する
            </button>
          </>
        ) : (
          <>
            {/* 結果表示 */}
            <div
              className={`text-center py-8 mb-6 rounded-lg ${
                isCorrect
                  ? "bg-green-500/20 border-2 border-green-500"
                  : "bg-red-500/20 border-2 border-red-500"
              }`}
            >
              <div className="text-6xl mb-4">{isCorrect ? "🎉" : "❌"}</div>
              <h3
                className={`text-2xl font-bold mb-2 ${
                  isCorrect ? "text-green-400" : "text-red-400"
                }`}
              >
                {isCorrect ? "正解！" : "不正解..."}
              </h3>
              <p className="text-slate-300">
                正解: <span className="font-bold">{satellite.answer}</span>
              </p>
            </div>

            {/* 次へボタン */}
            <button
              type="button"
              onClick={handleNext}
              className={`w-full font-semibold py-3 rounded-lg transition-colors ${
                isCorrect
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              {isCorrect ? "次の衛星へ 🛰" : "閉じる"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

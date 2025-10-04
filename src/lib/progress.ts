export interface SatelliteProgress {
  id: string;
  completed: boolean;
  attempts: number;
  lastAttempt: number;
}

export interface GameProgress {
  satellites: Record<string, SatelliteProgress>;
  level: number; // 現在解放されているレベル
  totalCompleted: number;
}

const STORAGE_KEY = "morse-sat-progress";

/**
 * 進捗をローカルストレージから読み込み
 */
export function loadProgress(): GameProgress {
  if (typeof window === "undefined") {
    return {
      satellites: {},
      level: 1,
      totalCompleted: 0,
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      satellites: {},
      level: 1,
      totalCompleted: 0,
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      satellites: {},
      level: 1,
      totalCompleted: 0,
    };
  }
}

/**
 * 進捗をローカルストレージに保存
 */
export function saveProgress(progress: GameProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * 衛星をクリアとしてマーク
 */
export function markSatelliteComplete(
  progress: GameProgress,
  satelliteId: string,
): GameProgress {
  const satellite = progress.satellites[satelliteId] || {
    id: satelliteId,
    completed: false,
    attempts: 0,
    lastAttempt: Date.now(),
  };

  const wasCompleted = satellite.completed;
  satellite.completed = true;
  satellite.lastAttempt = Date.now();

  const newProgress = {
    ...progress,
    satellites: {
      ...progress.satellites,
      [satelliteId]: satellite,
    },
  };

  // 完了数をカウント
  if (!wasCompleted) {
    newProgress.totalCompleted = Object.values(newProgress.satellites).filter(
      (s) => s.completed,
    ).length;
  }

  return newProgress;
}

/**
 * 試行回数を増やす
 */
export function incrementAttempts(
  progress: GameProgress,
  satelliteId: string,
): GameProgress {
  const satellite = progress.satellites[satelliteId] || {
    id: satelliteId,
    completed: false,
    attempts: 0,
    lastAttempt: Date.now(),
  };

  satellite.attempts += 1;
  satellite.lastAttempt = Date.now();

  return {
    ...progress,
    satellites: {
      ...progress.satellites,
      [satelliteId]: satellite,
    },
  };
}

/**
 * レベルを確認して更新
 */
export function updateLevel(
  progress: GameProgress,
  allSatellites: Array<{ id: string; level: number }>,
): GameProgress {
  const level1Count = allSatellites.filter((s) => s.level === 1).length;
  const level2Count = allSatellites.filter((s) => s.level === 2).length;

  const completedLevel1 = allSatellites
    .filter((s) => s.level === 1)
    .filter((s) => progress.satellites[s.id]?.completed).length;

  const completedLevel2 = allSatellites
    .filter((s) => s.level === 2)
    .filter((s) => progress.satellites[s.id]?.completed).length;

  let newLevel = progress.level;

  if (completedLevel1 === level1Count && newLevel < 2) {
    newLevel = 2;
  }

  if (completedLevel2 === level2Count && newLevel < 3) {
    newLevel = 3;
  }

  return {
    ...progress,
    level: newLevel,
  };
}

/**
 * 進捗をリセット
 */
export function resetProgress(): GameProgress {
  const emptyProgress: GameProgress = {
    satellites: {},
    level: 1,
    totalCompleted: 0,
  };
  saveProgress(emptyProgress);
  return emptyProgress;
}

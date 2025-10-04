// モールス符号のマッピング
const MORSE_CODE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  " ": "/",
};

/**
 * テキストをモールス符号に変換
 */
export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((char) => MORSE_CODE[char] || "")
    .join(" ");
}

/**
 * モールス符号をテキストに変換
 */
export function morseToText(morse: string): string {
  const reverseMorse = Object.fromEntries(
    Object.entries(MORSE_CODE).map(([key, value]) => [value, key]),
  );

  return morse
    .split(" ")
    .map((code) => reverseMorse[code] || "")
    .join("");
}

/**
 * WebAudio APIを使ってモールス信号を再生
 */
export class MorsePlayer {
  private audioContext: AudioContext | null = null;
  private frequency = 800; // Hz
  private dotDuration = 80; // ms
  private dashDuration = this.dotDuration * 3;
  private symbolGap = this.dotDuration;
  private letterGap = this.dotDuration * 3;

  constructor(wpm = 20) {
    // WPM (Words Per Minute) から dot duration を計算
    // PARIS という単語が標準（50 dots 相当）
    this.dotDuration = 1200 / wpm;
    this.dashDuration = this.dotDuration * 3;
    this.symbolGap = this.dotDuration;
    this.letterGap = this.dotDuration * 3;

    if (typeof window !== "undefined") {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextConstructor) {
        this.audioContext = new AudioContextConstructor();
      }
    }
  }

  /**
   * モールス信号を再生
   */
  async play(morse: string): Promise<void> {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    let time = now;

    for (const symbol of morse) {
      if (symbol === ".") {
        time = this.playTone(time, this.dotDuration);
        time += this.symbolGap / 1000;
      } else if (symbol === "-") {
        time = this.playTone(time, this.dashDuration);
        time += this.symbolGap / 1000;
      } else if (symbol === " ") {
        time += this.letterGap / 1000;
      } else if (symbol === "/") {
        time += this.letterGap / 1000;
      }
    }

    // 再生が完了するまで待つ
    return new Promise((resolve) => {
      setTimeout(() => resolve(), (time - now) * 1000);
    });
  }

  /**
   * 指定された長さのトーンを再生
   */
  private playTone(startTime: number, duration: number): number {
    if (!this.audioContext) return startTime;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = this.frequency;
    oscillator.type = "sine";

    // エンベロープ（音の立ち上がり/立ち下がりを滑らかに）
    const fadeTime = 0.005; // 5ms
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + fadeTime);
    gainNode.gain.setValueAtTime(0.3, startTime + duration / 1000 - fadeTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration / 1000);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration / 1000);

    return startTime + duration / 1000;
  }

  /**
   * クリーンアップ
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

# 🛰 Morse-Sat: 衛星モールスクイズ

地球を周回する衛星からモールス信号を受信してクイズに答えるWebアプリ。

## 🎮 遊び方

1. 3D地球ビューに表示された衛星をクリック
2. モールス信号が再生される
3. 何を送信しているかクイズに回答
4. 段階的に難易度の高い衛星が解放される

## 🌟 機能

- **3段階の難易度**
  - 🟦 Level 1: 入門衛星（SOS, OK, HI など短い信号）
  - 🟨 Level 2: 中級衛星（HELLO, EARTH, MOON など）
  - 🟥 Level 3: 実在衛星（ISS, NOAA-19, AO-73 など実際の衛星コールサイン）

- **インタラクティブな3D地球**
  - マウスドラッグで地球を回転
  - ホイールでズーム
  - 衛星の位置を実際の緯度経度で表示

- **モールス信号の再生**
  - WebAudio APIで生成（音声ファイル不要）
  - 何度でも再聴可能

- **進捗管理**
  - localStorageで進捗を保存
  - クリア済み衛星を視覚的に表示
  - 段階的な解放システム

## 🚀 デプロイ

### GitHub Pagesへのデプロイ

1. GitHubリポジトリで **Settings** → **Pages** に移動
2. **Source** を **GitHub Actions** に設定
3. `main` ブランチにpushすると自動デプロイ

### ローカルでの実行

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

開発サーバーは http://localhost:3000 で起動します。

## 🛠 技術スタック

- **Next.js 15** - React フレームワーク（静的エクスポート）
- **React 19** - UIライブラリ
- **Three.js & three-globe** - 3D地球表示
- **Tailwind CSS v4** - スタイリング
- **TypeScript** - 型安全性
- **WebAudio API** - モールス信号生成

## 📁 プロジェクト構成

```
morse-sat/
├── src/
│   ├── app/
│   │   ├── page.tsx          # メインページ
│   │   ├── layout.tsx         # レイアウト
│   │   └── globals.css        # グローバルスタイル
│   ├── components/
│   │   ├── Globe.tsx          # 3D地球コンポーネント
│   │   └── QuizModal.tsx      # クイズモーダル
│   ├── data/
│   │   └── satellites.json    # 衛星データ（30件）
│   └── lib/
│       ├── morse.ts           # モールス信号ユーティリティ
│       └── progress.ts        # 進捗管理ユーティリティ
├── public/                    # 静的アセット
└── .github/
    └── workflows/
        └── deploy.yml         # GitHub Actions デプロイ設定
```

## 📚 衛星データの追加

`src/data/satellites.json` に新しい衛星を追加できます：

```json
{
  "id": "新しい衛星ID",
  "title": "衛星名",
  "lat": 緯度,
  "lon": 経度,
  "morse": "モールス符号（. と -）",
  "answer": "正解テキスト",
  "choices": ["選択肢1", "選択肢2", "選択肢3"],
  "hint": "ヒント文",
  "level": 1-3
}
```

## 🎓 モールス符号について

- `.` = 短点（ドット）
- `-` = 長点（ダッシュ）
- ` ` = 文字間の区切り
- `/` = 単語間の区切り

例：
- `SOS` = `... --- ...`
- `HELLO` = `.... . .-.. .-.. ---`

## 📄 ライセンス

MIT

# Pathweave Lab

[English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

Pathweave Lab は、グリッド探索アルゴリズムを説明するための、インタラクティブでローカルファーストな経路探索プレイグラウンドです。

## 課題と動機

学習者が盤面を変更し、アルゴリズムがどこを探索したかをすぐ確認できると、経路探索は理解しやすくなります。Pathweave Lab は、壁を描き、開始点とゴールを動かし、幅優先探索（BFS）を実行し、アカウント・テレメトリ・バックエンドなしで簡潔な指標を読める小さな静的 Web アプリです。

## 機能

- インタラクティブなグリッドで壁の切り替えと開始点/ゴールの移動ができます。
- 重みなしグリッドで幅優先探索による決定的な最短経路を求めます。
- BFS のステップ再生コントロールで、訪問セルを 1 つずつ確認できます。
- 訪問セル数、距離、壁の数、到達可能/到達不能の状態を表示します。
- 各探索結果を平易な言葉で説明します。
- 授業で再現しやすい決定的なサンプル盤面を提供します。
- JSON のエクスポート/インポートでローカルに共有し、例を再現できます。
- 共有可能なエンコード済み `#board=` URL で、サーバーなしに盤面状態を読み込めます。
- 純粋な TypeScript のグリッド/探索関数を振る舞いテストで保護しています。

## インストール

Pathweave Lab はパッケージレジストリには公開されていません。GitHub のソースチェックアウトを使用してください。

```bash
git clone https://github.com/codecat-ai/pathweave-lab.git
cd pathweave-lab
npm ci
```

## クイックスタート

ローカルの Vite 開発サーバーを起動します。

```bash
npm run dev
```

その後、Vite が表示するローカル URL をブラウザで開きます。

## 例

1. **Braid**、**Rooms**、**Corridor** のサンプル盤面を選びます。
2. **Toggle walls** を選び、セルをクリックして盤面を変更します。
3. **Move start** または **Move goal** を選んで端点を移動します。
4. **Run BFS** をクリックし、訪問セルと最終経路を比較します。
5. **Reset playback**、**Prev**、**Next** で各訪問セルを確認します。
6. JSON 状態をコピーするか、**Copy share URL** を使って同じ盤面をローカルで共有します。

## 設定

MVP にはランタイム設定ファイルはありません。盤面サイズとサンプル名は `src/app.ts` に定義され、純粋なグリッドと共有の動作は `src/grid.ts`、`src/shareUrl.ts`、`src/algorithms.ts`、`src/samples.ts` にあります。

## 開発

このプロジェクトは Node.js 24、Vite、TypeScript、Vitest、ESLint、Prettier を使用します。`.mise-tool-versions` は自律開発で使用したローカル Node ツールチェーンを記録しています。

```bash
npm ci
npm run lint
npm run typecheck
npm run format
npm test -- --run
npm run build
```

## テスト

振る舞いテストは、最短経路、BFS 再生フレーム、壁の処理、到達不能な盤面、JSON 往復、共有 URL エンコード、壊れた入力の拒否、決定的なサンプル生成をカバーします。

```bash
npm test -- --run
```

## ロードマップ

- 重み付き地形と Dijkstra 比較モード。
- 授業用ワークシート例。
- 任意のダーク/ライトテーマ切り替え。

## コントリビューション

コントリビューションを歓迎します。変更は小さく保ち、新機能やバグ修正には振る舞いテストを追加し、プルリクエスト前に完全な検証コマンドを実行してください。[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

MIT License。詳細は [LICENSE](LICENSE) を参照してください。

## メンテナンスメモ

このプロジェクトは AI 支援を受けて保守されており、公開前にテストと CI で変更を検証します。

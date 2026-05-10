# Pathweave Lab

[English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

Pathweave Lab 是一个交互式、本地优先的寻路实验场，用于讲解网格搜索算法。

## 问题与动机

当学习者可以修改棋盘并立即看到算法探索过程时，寻路更容易理解。Pathweave Lab 提供一个小型静态 Web 应用，可用于绘制墙体、绘制加权地形、移动起点和终点、比较广度优先搜索（BFS）与 Dijkstra 搜索，并在没有账号、遥测或后端服务的情况下查看简洁指标。

## 功能

- 用交互式网格切换墙体并移动起点/终点。
- 支持普通、泥地和水域单元格的加权地形绘制。
- 在无权重网格上使用广度优先搜索生成确定性的最短路径。
- 使用确定性的 Dijkstra 搜索在加权地形上寻找最低成本路径。
- 用 BFS 与 Dijkstra 对比摘要解释步数和加权成本的区别。
- 提供正交或对角两种移动课程模式，并保持正交为默认行为。
- 提供分步回放控制，可一次检查一个已访问单元格。
- 提供可选浅色主题切换，并保持深色模式为默认且按浏览器保存。
- 显示已访问单元格数、距离、加权成本、移动模式、墙体数、地形数以及可达/不可达状态。
- 用通俗语言解释每次搜索结果。
- 提供确定性的示例棋盘，便于重复教学。
- 提供命名教师课程预设，例如 **Detour wall**、**Weighted detour** 和 **No path**，可快速加载聚焦的棋盘状态。
- 通过 JSON 导出/导入在本地分享和复现实例。
- 使用可分享的编码 `#board=` URL，无需服务器即可加载棋盘状态、地形和移动模式。
- 可复制课堂练习变体：默认的简洁讲义，或带有额外预测与反思提示的引导式讲义。
- 可复制独立 SVG 棋盘快照，包含标题、图例、指标、地形、已访问单元格和最终路径。
- 纯 TypeScript 网格与搜索函数，并由行为测试覆盖。

## 安装

请使用 GitHub 源码检出：

```bash
git clone https://github.com/codecat-ai/pathweave-lab.git
cd pathweave-lab
npm ci
```

## 快速开始

启动本地 Vite 开发服务器：

```bash
npm run dev
```

然后在浏览器中打开 Vite 输出的本地地址。

## 示例

1. 选择 **Braid**、**Rooms** 或 **Corridor** 示例棋盘。
2. 在 **Lesson preset** 中选择 **Detour wall**、**Weighted detour** 或 **No path**，加载聚焦的教学棋盘。
3. 选择 **Toggle walls** 并点击单元格来调整棋盘。
4. 选择 **Cycle terrain** 来绘制普通、泥地和水域单元格。
5. 选择 **Move start** 或 **Move goal** 来移动端点。
6. 在 **Search** 中切换 **BFS (unweighted)**、**Dijkstra (weighted)** 和 **Compare BFS and Dijkstra**。
7. 在 **Movement** 中切换 **Orthogonal (4-way)** 与 **Diagonal (8-way)**，比较移动规则如何改变结果。
8. 使用 **Light mode** 或 **Dark mode** 切换浏览器主题。
9. 点击 **Run search**，比较已访问单元格、步数、加权成本和最终路径。
10. 使用 **Reset playback**、**Prev** 和 **Next** 检查每个已访问单元格。
11. 复制 JSON 状态，或使用 **Copy share URL** 在本地分享同一个棋盘、地形和移动模式。
12. 使用 **Copy SVG** 复制独立棋盘快照，用于幻灯片、练习纸、LMS 页面或错误报告。
13. 在练习文本控件旁选择 **Concise** 或 **Guided**，然后使用 **Copy worksheet** 将所选 Markdown 题目和答案复制到课程讲义中。

## 配置

MVP 中没有运行时配置文件。棋盘尺寸、示例名称、课程预设控件和练习文本变体控件定义在 `src/app.ts` 中，纯网格、预设、主题、练习文本、SVG 导出与分享行为位于 `src/grid.ts`、`src/presets.ts`、`src/theme.ts`、`src/worksheet.ts`、`src/svgExport.ts`、`src/shareUrl.ts`、`src/algorithms.ts` 和 `src/samples.ts`。课程预设是 `src/presets.ts` 中的类型化定义；`applyPreset` 会返回完整克隆的棋盘状态，便于教师加载示例而不改变源预设。练习文本变体是 `src/worksheet.ts` 中确定性的 TypeScript 格式化选项。

## 开发

本项目使用 Node.js 24、Vite、TypeScript、Vitest、ESLint 和 Prettier。`.mise-tool-versions` 记录了自主开发使用的本地 Node 工具链。

```bash
npm ci
npm run lint
npm run typecheck
npm run format
npm test -- --run
npm run build
```

## 测试

行为测试覆盖最短路径结果、加权地形成本、Dijkstra 低成本路径选择、BFS 与 Dijkstra 对比解释、正交和对角移动、对角穿角阻止、回放帧、墙体处理、不可达棋盘、命名课程预设查找与克隆、加权预设地形、简洁与引导式练习文本导出、确定性 SVG 导出、JSON 往返、分享 URL 编码、主题偏好存储、错误输入拒绝以及确定性示例生成。

```bash
npm test -- --run
```

## 路线图

- 提供可打印练习纸版式预览，便于教师在复制前检查课堂讲义。

## 贡献

欢迎贡献。请保持改动小而清晰，为新功能或修复添加行为测试，并在提交拉取请求前运行完整验证命令。参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

MIT License。参见 [LICENSE](LICENSE)。

## 维护说明

本项目在 AI 辅助下维护，并通过测试和 CI 在发布前验证更改。

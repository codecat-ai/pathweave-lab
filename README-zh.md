# Pathweave Lab

[English](README.md) | [中文](README-zh.md) | [日本語](README-jp.md)

Pathweave Lab 是一个交互式、本地优先的寻路实验场，用于讲解网格搜索算法。

## 问题与动机

当学习者可以修改棋盘并立即看到算法探索过程时，寻路更容易理解。Pathweave Lab 提供一个小型静态 Web 应用，可用于绘制墙体、移动起点和终点、运行广度优先搜索（BFS），并在没有账号、遥测或后端服务的情况下查看简洁指标。

## 功能

- 用交互式网格切换墙体并移动起点/终点。
- 在无权重网格上使用广度优先搜索生成确定性的最短路径。
- 提供分步 BFS 回放控制，可一次检查一个已访问单元格。
- 显示已访问单元格数、距离、墙体数以及可达/不可达状态。
- 用通俗语言解释每次搜索结果。
- 提供确定性的示例棋盘，便于重复教学。
- 通过 JSON 导出/导入在本地分享和复现实例。
- 纯 TypeScript 网格与搜索函数，并由行为测试覆盖。

## 安装

Pathweave Lab 尚未发布到任何包注册表。请使用 GitHub 源码检出：

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
2. 选择 **Toggle walls** 并点击单元格来调整棋盘。
3. 选择 **Move start** 或 **Move goal** 来移动端点。
4. 点击 **Run BFS**，比较已访问单元格和最终路径。
5. 使用 **Reset playback**、**Prev** 和 **Next** 检查每个已访问单元格。
6. 复制 JSON 状态，在本地分享同一个棋盘。

## 配置

MVP 中没有运行时配置文件。棋盘尺寸和示例名称定义在 `src/app.ts` 中，纯网格行为位于 `src/grid.ts`、`src/algorithms.ts` 和 `src/samples.ts`。

## 开发

本项目使用 Node.js 24、Vite、TypeScript、Vitest、ESLint 和 Prettier。`.mise-tool-versions` 记录了自主开发使用的本地 Node 工具链。

```bash
npm ci
npm run lint
npm run format
npm test -- --run
npm run build
```

## 测试

行为测试覆盖最短路径结果、BFS 回放帧、墙体处理、不可达棋盘、JSON 往返、错误输入拒绝以及确定性示例生成。

```bash
npm test -- --run
```

## 路线图

- 加权地形和 Dijkstra 对比模式。
- 可分享的棋盘状态编码 URL。
- 课堂练习示例。
- 可选的深色/浅色主题切换。

## 贡献

欢迎贡献。请保持改动小而清晰，为新功能或修复添加行为测试，并在提交拉取请求前运行完整验证命令。参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

MIT License。参见 [LICENSE](LICENSE)。

## 维护说明

本项目在 AI 辅助下维护，并通过测试和 CI 在发布前验证更改。

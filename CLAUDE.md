# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 项目概览

SVG → PNG 在线转换工具。Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui（`base-nova` 风格）。核心渲染基于 `@resvg/resvg-wasm`，浏览器端在 Web Worker 内运行 WASM；当客户端失败时回退到服务端 `/api/convert`。生产环境通过 `@opennextjs/cloudflare` 部署到 Cloudflare Workers。

> 注意：`README.md` 提到 Drizzle / Turso / `db:generate` 脚本，但 `package.json` 中并不存在这些依赖与脚本——README 是模板残留，不要按其说明执行 DB 命令。

## 常用命令

```bash
npm run dev              # next dev（开发服务器）
npm run build            # prebuild 会先把 resvg WASM 复制到 public/，再 next build
npm run start            # 生产模式本地启动
npm run lint             # eslint（沿用 eslint-config-next，已排除 .claude/skills/**）
npm run test             # vitest run（一次性跑完）
npm run test:watch       # vitest watch
npm run deploy           # wrangler deploy（依赖先跑过 opennextjs 构建产物 .open-next/）
```

跑单测：`npx vitest run src/__tests__/svg-parser.test.ts`；按用例名：`npx vitest run -t "viewBox"`。

## 架构要点

### 双路径渲染（关键不变量）

`src/lib/converter/` 是三层抽象，三处共享 `ResvgOptions` 类型，**只能通过 `buildResvgOptions(ConvertOptions)` 构造**——不要直接拼装 resvg 配置。

| 文件 | 运行位置 | WASM 加载方式 |
|---|---|---|
| `client.ts` | 浏览器主线程的胶水层，单例 Worker + 单回调队列 | 委托 worker |
| `worker.ts` | Web Worker | `initWasm('/resvg.wasm')`（HTTP 取静态资源） |
| `server.ts` | Node / Edge runtime | 优先用调用方传入的 `wasmSource`；本地 fallback 读 `node_modules/@resvg/resvg-wasm/index_bg.wasm` |
| `api/convert/route.ts` | Next route handler | 构造同源 `/resvg.wasm` URL 传给 `convertOnServer` |

`public/resvg.wasm` 由 `prebuild` 脚本从 `node_modules` 拷贝而来——动手修改 WASM 相关依赖时记得这一步，否则浏览器端会 404。

### Worker 并发模型

`client.ts` 使用单 Worker + `currentCallback` 单插槽 + `pendingQueue` 排队，串行处理。`converter-app.tsx` 的 `BatchConverter` 在此基础上再排一层任务队列（`processQueue` 用 `convertingRef` 互斥）。新增并发能力前要同时改这两层，否则回调会被覆盖。

### 客户端 → 服务端回退

`converter-app.tsx` 在 `convert(...)` 失败回调里直接 `fetch('/api/convert')`，把同一份 SVG + `ConvertOptions`（不是 `ResvgOptions`）发给后端。意味着 `ConvertOptions` 是跨边界契约，新增字段时需要：
1. 更新 `options.ts` 类型
2. 改 `buildResvgOptions` 映射
3. 客户端 `DEFAULT_OPTIONS`、`AdvancedOptions` UI、API route 反序列化都要兼容

### Cloudflare / OpenNext

- `open-next.config.ts` 强制 `incrementalCache/tagCache/queue: "dummy"`、`proxyExternalRequest: "fetch"`，因此**不要假设 ISR / 后台队列 / Node 网络栈可用**。
- `next.config.ts` 把 `@resvg/resvg-wasm` 标为 `serverExternalPackages`——这是服务端能 `import('fs')` 读 WASM 的前提，删它会破坏 Cloudflare 构建。
- `wrangler.toml` 中 `main = ".open-next/worker.js"`，部署前必须先执行 OpenNext 构建产物（`npm run build` 会触发；如果 `.open-next/` 不存在，`wrangler deploy` 会失败）。
- 存在 `next.config.mjs`（引用 `@libsql/client`）和 `next.config.ts`（resvg）两份配置——`.ts` 优先生效，`.mjs` 是模板残留。新加配置统一改 `next.config.ts`。

### 路径别名 & 测试

- `@/*` → `src/*`（`tsconfig.json` 和 `vitest.config.ts` 各自维护）；改别名要双改。
- Vitest 使用 `environment: 'node'`，不要在测试里依赖 DOM/Worker API（涉及 worker 的逻辑只测 `buildResvgOptions`、`parseSvg`、`BatchConverter` 这些纯函数/纯类）。
- 测试只覆盖 `src/lib/**`，UI 层没有测试基建。

### UI 体系

- shadcn 风格固定为 `base-nova`，`tailwind.config.ts` 不开启自定义主题——新增颜色优先走 CSS variables (`src/app/globals.css`)。
- 组件分层：`components/ui/`（shadcn 原子）、`components/features/`（业务组件）、`components/layout/`。`ConverterApp` 是单根，状态都集中在这里；`BatchConverter` 实例存放在 `useRef`，避免 React 重渲触发重建。

## 计划与规范文档

`docs/superpowers/` 下保存了项目的设计与实施计划（`specs/*-design.md`、`plans/*-implementation.md`、`plans/*-experience-enhancements.md`）。改动较大的功能时先核对这些文档，避免与既定设计冲突。

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发或执行实现计划之前使用——创建具有智能目录选择和安全验证的隔离 git 工作树
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->

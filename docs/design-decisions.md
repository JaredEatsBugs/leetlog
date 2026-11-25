# LeetCode 打卡 App：设计决策

_最后更新：2026-11-24。这份文件是 claude.ai Project「1st side project」里同名文档的副本，产品和设计讨论在那边进行。_

## 定位

- 个人用，主要在电脑上刷题时顺手记录
- 同时也是简历和 GitHub 上的作品项目
- 核心目标：坚持打卡（streak、热力图）+ 复习（没独立做出的题按间隔重新出现）。面试准备的整体进度（behavioral、system design）以后再加

## 技术栈（已定）

- Next.js 16（App Router）+ TypeScript
- PostgreSQL + Drizzle；驱动用通用的 postgres.js，不用 Neon 专用驱动（见「自部署」）
- 生产数据库用 Neon，本地开发用 Docker 里的 Postgres
- Auth.js，GitHub OAuth 登录，另有 `AUTH_MODE=local` 单用户模式
- Tailwind + shadcn/ui
- 部署在 Vercel；GitHub Actions 跑 lint、typecheck、format check 和测试

## 数据模型（已落地在 src/db/schema.ts）

- users：字段名兼容 Auth.js Drizzle adapter；另有 timezone（IANA）、day_start_hour（默认 4）、daily_goal（默认 3）
- problems：所有用户共享的题库，slug 唯一，frontend_id 是 LeetCode 上显示的题号，tags 为 text[]
- attempts：每做一次一行；result 为 solo（独立 AC）/ hint（看了提示）/ solution（看了题解），duration_minutes、notes 可空
- 复习计划不单独建表，从 attempts 计算
- （以后）PrepItem：behavioral、system design 等非 LeetCode 内容

## 关键约定

- 时间戳一律存 UTC（timestamptz）。「今天」「streak」等按天的计算，都在用户 timezone 下进行，并以 day_start_hour 作为一天的开始（默认凌晨 4 点前的记录算前一天）
- API 要按「将来会有第二个客户端（Chrome 插件）」来设计：用 route handlers 提供清楚的 REST 接口，用 Zod 校验输入，请求和返回的类型前后端共用；不要把业务逻辑都写在 server actions 里
- 核心业务逻辑（streak、复习日期、热力图聚合）写成不依赖数据库的纯函数，用 Vitest 写单测

## 入口（建议，待确认）

- Web app 是主入口，可以固定成浏览器的 pinned tab 或装成 PWA
- Chrome 插件只负责快速记录：
  - LeetCode 题目页浮层：拿到 Accepted 后弹出「记一下？」，题目和用时自动填好
  - 工具栏小弹窗：今日完成数、streak、待复习数，加一个跳转到 web app 的按钮
  - （可选）每日打卡提醒，用 Chrome 通知
- 插件的登录方式到 v0.3 再定：共享 web app 的 session cookie，或者在网页设置页生成 API token

## 部署

- **Web app**：Vercel Hobby（免费，限非商业的个人用途）。push 到 main 自动部署，每个 PR 自动生成预览链接
- **数据库**：Neon 免费计划。闲置时缩到零，隔很久第一次访问会有一两秒冷启动。生产环境用 Neon 的 pooled 连接串（所以 postgres.js 设了 prepare: false）
- **Chrome 插件**：自用阶段用「加载已解压的扩展程序」；发布到 Chrome 商店需要一次性 5 美元开发者注册费和审核
- **域名**：先用 xxx.vercel.app，以后可以买自己的域名

### 环境

| 环境     | Web app           | 数据库                                  |
| -------- | ----------------- | --------------------------------------- |
| 本地开发 | next dev          | Docker Postgres（docker compose up -d） |
| PR 预览  | Vercel 预览链接   | 自动创建的 Neon 分支                    |
| 生产     | main 分支自动部署 | Neon main 分支                          |

### 发布流程

- PR 上由 GitHub Actions 跑检查，通过后合并到 main，Vercel 自动部署
- 数据库 migration：Vercel 的 build command 设为 `drizzle-kit migrate && next build`

### 注意事项

- 一个 GitHub OAuth App 只能填一个 callback URL：本地和生产各建一个 OAuth App，用环境变量切换
- PR 预览的域名每次都不同，前期可以先不支持在预览环境登录

## 自部署（别人 clone 下来自己跑）

目标：clone 下来五条命令以内就能在本地跑起来（见 README 的 Quick start）。

- 数据库驱动用 postgres.js，换数据库只需要改 `DATABASE_URL`
- docker-compose.yml 起本地 Postgres；.env.example 列出所有环境变量
- `AUTH_MODE=local`：不需要登录，自动用一个本地用户
- 插件的 server URL 可以配置（v0.3）
- 以后可以加：「Deploy to Vercel」按钮、Dockerfile（standalone 输出）

## 迭代路线

- v0.1：登录、手动记一道题、列表、热力图和 streak
- v0.2：复习队列、Today 页
- v0.3：Chrome 插件，在 LeetCode 题目页一键打卡
- v0.4：统计页（按 topic 和难度看覆盖度）

## v0.1 开发顺序

0. 空架子：脚手架、Drizzle、Docker Postgres、Prettier、Vitest、CI（文件已写好；依赖安装和首次 migration 待执行）
1. Schema 和 migration（schema 已写好，待 `pnpm db:generate && pnpm db:migrate`）
2. 核心业务逻辑纯函数 + Vitest：streak、复习日期、热力图聚合
3. 登录：GitHub OAuth（Auth.js + Drizzle adapter）+ AUTH_MODE=local 单用户模式
4. API：`POST /api/attempts`、`GET /api/attempts`、`GET /api/today`、`GET /api/problems?q=`
5. 最简 UI，然后按 mockup 细化

## 页面

Today（首页）· Log · Problem 详情 · Stats

## 界面（mockup 要点）

Mockup 画布：https://claude.ai/artifact/6hCke2YhomvuDeVjA2ppMT

视觉方向：浅色，偏开发者工具风格。页面底色 #F6F7F9，卡片白底、1px #E5E7EB 边框、12px 圆角；主色绿色 #15803D；数字用 JetBrains Mono，正文用 Inter。难度标签：Easy #0F766E / #E6F6F4，Medium #B45309 / #FDF3E2，Hard #B91C1C / #FDECEC。热力图 5 档：#EBEDF0 #A7E3B8 #5CC27A #2E9E52 #166534。

**Today 页**

- 顶栏：logo「LeetLog」、导航（Today / Log / Stats）、主按钮「记一道题」（快捷键 N）、头像
- 标题区：日期，以及「今天还差 N 道就达成目标」
- 四张统计卡：连续打卡（含最长记录）、今日完成 x / 目标（带进度条）、今日待复习、本周题数（含独立 AC 率）
- 左栏：「待复习」列表（题号、标题、第几次复习、上次结果、难度标签、「重做」按钮），下面是「今天做过的」（题号、标题、笔记摘要、结果、用时）
- 右栏：近 20 周热力图，加「薄弱 topic」（按独立 AC 率排序的进度条）

**记一道题弹窗**

- 题目：粘贴 LeetCode 链接或输入题号，自动识别出题号、标题、难度和 tags
- 结果：三选一（独立 AC / 看了提示 / 看了题解），选择后下方提示这道题会在哪天进入复习队列（独立 AC 不进；看了提示 3 天后；看了题解 1 天后）
- 用时（分钟）和笔记可以留空
- 取消 / 保存（⌘↵）

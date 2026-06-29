# ToolVault 清理候选清单

本文只记录清理建议，不代表已经删除任何文件。涉及数据库、导入 payload、工具配置目录、历史规格或历史计划的内容，都需要用户确认后再处理。

## 1. 可通过 `.gitignore` 管控

这些通常是本地运行、系统或工具生成文件，不应作为项目源码提交。

| 候选 | 证据 | 建议 |
|---|---|---|
| `.toolvault-frontend.log` | 本地前端运行日志 | 保持忽略；需要排查时临时查看，不提交 |
| `.toolvault-backend.log` | 本地后端运行日志 | 保持忽略；需要排查时临时查看，不提交 |
| `.toolvault-frontend-refresh.log` | 本地刷新流程日志 | 保持忽略；不作为正式更新日志来源 |
| `.toolvault-backend-refresh.log` | 本地刷新流程日志 | 保持忽略；不作为正式更新日志来源 |
| `.DS_Store` | macOS 系统文件 | 保持忽略 |
| `docs/.DS_Store` | macOS 系统文件 | 保持忽略 |
| `backend/**/__pycache__/` | Python 字节码缓存 | 保持忽略 |
| `backend/.pytest_cache/` | pytest 缓存 | 保持忽略 |
| `frontend/test-results/` | Playwright 运行结果 | 保持忽略 |
| `frontend/playwright-report/` | Playwright HTML 报告 | 保持忽略 |
| `frontend/dist/` | Vite 构建产物 | 保持忽略 |

当前 `.gitignore` 已覆盖 `.DS_Store`、`*.log`、`__pycache__/`、`.pytest_cache/`、`node_modules/`、`dist/`、`build/`、`test-results/`、`playwright-report/` 等常见产物。

## 2. 需要用户确认后再删除或归档

这些文件可能包含项目运行数据、当前内容源、历史设计依据或导入记录。不能自动删除。

| 候选 | 风险 | 建议 |
|---|---|---|
| `backend/toolvault.db` | 可能包含当前本地工具库、页面内容和更新日志数据 | 不直接删除；如需清理，先确认是否已有备份或可从 payload 重建 |
| `imports/toolvault-import-preview.json` | 当前导入 payload，可能是网站内容的主要来源 | 不直接删除；如需归档，先确认最新数据库和更新日志已验证 |
| `imports/page-content-plan.json` | 页面内容刷新清单，仍被 weekly refresh 和 daily_update 使用 | 保留；不要当作临时文件删除 |
| `docs/superpowers/plans/2026-06-25-personal-homepage.md` | 历史个人主页实施计划，可能有设计过程价值 | 若确认 About 页面已稳定，可归档到历史目录，但不建议直接删除 |
| `docs/superpowers/specs/2026-06-25-personal-homepage-design.md` | 历史个人主页设计规格，可能有需求依据 | 保留或归档；删除前需确认不再追溯设计决策 |
| 旧的 `docs/superpowers/plans/*.md` | 多为英文历史实施计划，审阅噪音较大 | 不批量翻译；如需整理，可统一移动到 `docs/history/`，但需单独确认 |

## 3. 不要动

这些目录虽然可能未跟踪或看起来像工具产物，但属于 Claude Code、Playwright MCP 或 superpowers 工作流状态。删除可能影响后续协作和自动化能力。

| 路径 | 原因 | 建议 |
|---|---|---|
| `.claude/` | Claude Code 项目配置、计划、定时任务或工作流状态 | 不删除；如要调整，必须先确认具体文件用途 |
| `.playwright-mcp/` | Playwright MCP 浏览器或运行状态 | 不删除；除非明确需要重置浏览器状态 |
| `.superpowers/` | superpowers 插件/技能相关状态 | 不删除；避免破坏既有工作流 |

## 4. 源码清理建议

当前只读扫描没有发现可以直接删除的业务源码文件。对于源码清理，建议采用更谨慎的流程：

1. 先通过引用搜索确认文件、组件、函数没有被使用。
2. 再运行 TypeScript build、后端测试和 E2E。
3. 如果删除影响路由、导入字段或页面内容，需要同步更新 README、PRD、架构文档和 E2E。
4. 对“看起来暂时没用”的页面或组件，不在没有需求确认的情况下删除。

## 5. 本次不会执行的动作

- 不删除 `backend/toolvault.db`。
- 不删除 `imports/*.json`。
- 不删除 `.claude/`、`.playwright-mcp/`、`.superpowers/`。
- 不批量翻译或删除历史 `docs/superpowers/plans/*.md`。
- 不清空数据库、导入内容、更新日志或页面内容。

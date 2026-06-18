# ToolVault E2E Fix Log

## 2026-06-18 - Loopback frontend origin was blocked by CORS

- 触发方式：启动 Vite 时使用 `--host 127.0.0.1`，浏览器从 `http://127.0.0.1:5173` 请求 FastAPI API。
- 观察结果：公开工具库页面显示“工具加载失败，请稍后重试。”，浏览器控制台报 CORS 错误，API 响应缺少 `Access-Control-Allow-Origin`。
- 根因：后端默认 CORS 配置只包含 `http://localhost:5173`，不包含计划中使用的 `http://127.0.0.1:5173`。
- 修复：将默认 `TOOLVAULT_CORS_ORIGINS` 和 `.env.example` 更新为同时包含 `localhost` 与 `127.0.0.1` 前端来源，并新增配置测试覆盖默认来源。
- 验证：`uv run --directory backend pytest tests/test_config.py -v` 通过；运行时用浏览器打开 `http://127.0.0.1:5173/tools` 可加载 `Playwright MCP`。

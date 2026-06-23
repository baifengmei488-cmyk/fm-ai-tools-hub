import { expect, test } from '@playwright/test';

const sampleImportPayload = {
  source: 'claude_local_scan',
  generated_at: '2026-06-18T10:00:00+08:00',
  tools: [
    {
      name: 'Playwright MCP',
      slug: 'playwright-mcp',
      type: 'mcp',
      status: 'configured',
      summary: '用于浏览器自动化、页面测试、截图和 E2E 验收。',
      homepage_url: '',
      install_command: 'claude mcp add -s user playwright -- npx -y @playwright/mcp',
      verify_command: 'claude mcp get playwright',
      visibility: 'public',
      is_skill_candidate: false,
      is_runbook_candidate: true,
      categories: ['测试工具', 'MCP'],
      tags: ['playwright', 'browser', 'e2e'],
      guides: [
        {
          title: 'Playwright MCP 使用指南',
          guide_type: 'usage',
          visibility: 'public',
          content_markdown: '# Playwright MCP 使用指南\n\n用于打开网页、点击按钮、填写表单、截图和检查控制台错误。\n\n## 适合做什么\n\n| 场景 | 用途 |\n|---|---|\n| UI 验证 | 打开页面并检查关键元素 |\n| 回归测试 | 执行主流程并截图 |',
        },
      ],
    },
    {
      name: 'uv',
      slug: 'uv',
      type: 'cli',
      status: 'installed',
      summary: '高速 Python 包和工具管理器。',
      homepage_url: '',
      install_command: 'brew install uv',
      verify_command: 'uv --version',
      visibility: 'public',
      is_skill_candidate: false,
      is_runbook_candidate: true,
      categories: ['开发工具', 'Python'],
      tags: ['uv', 'python', 'tooling'],
      guides: [
        {
          title: 'uv 使用指南',
          guide_type: 'usage',
          visibility: 'public',
          content_markdown: '# uv 使用指南\n\nuv 用于管理 Python 项目依赖和 CLI 工具。\n\n## 常用命令\n\n```bash\nuv --version\nuv tool list\n```',
        },
      ],
    },
  ],
};

const privateImportPayload = {
  source: 'claude_local_scan',
  generated_at: '2026-06-18T10:30:00+08:00',
  tools: [
    {
      name: 'Private Runbook',
      slug: 'private-runbook',
      type: 'skill',
      status: 'draft',
      summary: 'Internal workflow',
      visibility: 'login_required',
      categories: [],
      tags: [],
      guides: [
        {
          title: 'Internal',
          guide_type: 'usage',
          visibility: 'login_required',
          content_markdown: '# Internal',
        },
      ],
    },
  ],
};

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('密码').fill('toolvault-admin-local');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/admin\/tools$/);
}

test('public users can browse imported public tool details', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'FM AI Tools Hub' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: '工具库', exact: true }).click();
  await expect(page.getByRole('heading', { name: '工具库' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();

  await page.getByRole('link', { name: /Playwright MCP/ }).click();
  await expect(page).toHaveURL(/\/tools\/playwright-mcp$/);
  await expect(page.getByRole('heading', { name: 'Playwright MCP', exact: true })).toBeVisible();
  await expect(page.getByText('configured')).toBeVisible();
  await expect(page.getByText('claude mcp add -s user playwright -- npx -y @playwright/mcp')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP 使用指南' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: '指南目录' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: '指南目录' }).getByRole('link', { name: '适合做什么' }),
  ).toBeVisible();
  await expect(page.getByText('用于打开网页、点击按钮、填写表单、截图和检查控制台错误。')).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: '工具库', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Context7 MCP' })).toBeVisible();
  await page.getByRole('link', { name: /Context7 MCP/ }).click();
  await expect(page).toHaveURL(/\/tools\/context7-mcp$/);
  await expect(page.getByRole('heading', { name: 'Context7 MCP', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Context7 MCP 使用指南' })).toHaveCount(1);
  await expect(page.getByText('安装后可以在 Claude Code 中请求公开库文档')).toBeVisible();
});

test('public users can browse workflow navigation guides', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'FM AI Tools Hub' })).toBeVisible();
  await expect(page.getByText('Context7 MCP 新增后')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Context7 MCP' }).first()).toHaveAttribute('href', '/tools/context7-mcp');

  await page.getByRole('link', { name: '查看工作流' }).click();
  await expect(page).toHaveURL(/\/workflows$/);
  await expect(page.getByRole('heading', { name: '实用工作流' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Context7 文档研究到指南更新' })).toBeVisible();
  await expect(page.getByText('Context7 MCP 查询公开库文档 → Claude Code 整理使用指南 → Playwright MCP 打开页面验收展示。')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Context7 + Playwright' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Context7 MCP' }).first()).toHaveAttribute('href', '/tools/context7-mcp');
  await expect(page.getByRole('heading', { name: '测试人员常用提示词模板' })).toBeVisible();
  await expect(page.getByText('用 Context7 MCP 查询这个工具的公开文档')).toBeVisible();
  await expect(page.getByRole('heading', { name: '快速命令汇总' })).toBeVisible();
  await expect(page.getByText('claude mcp get context7')).toBeVisible();
});

test('public users can browse update logs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: '更新日志' }).click();
  await expect(page).toHaveURL(/\/updates$/);
  await expect(page.getByRole('heading', { name: '更新日志' })).toBeVisible();

  const latestLog = page.getByRole('article', { name: /更新日志 \d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}:\d{2}/ }).first();
  await expect(latestLog).toBeVisible();
  await expect(latestLog.getByText('claude_local_scan')).toBeVisible();
  await expect(latestLog.getByText('Validation passed')).toBeVisible();
  await expect(page.getByText('2026-06-18T10:00:00+08:00')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /展开执行前页面内容清单/ })).toHaveCount(0);
  await expect(page.getByText('/tools/{slug}')).toHaveCount(0);

  await latestLog.getByRole('button', { name: /展开更新日志/ }).click();
  await expect(page.getByText('2026-06-18T10:00:00+08:00')).toBeVisible();
  await expect(page.getByRole('button', { name: /展开执行前页面内容清单/ })).toBeVisible();
  await page.getByRole('button', { name: /展开执行前页面内容清单/ }).click();
  await expect(page.getByText('/tools/{slug}')).toBeVisible();
  await expect(page.getByText('说明安装后怎么使用')).toBeVisible();
  await expect(page.getByRole('button', { name: /展开执行结果报告/ })).toBeVisible();
  await expect(page.getByText(/质量结论：/)).toHaveCount(0);
  await page.getByRole('button', { name: /展开执行结果报告/ }).click();
  await expect(page.getByText(/结果：status=imported import_id=/)).toBeVisible();
  await expect(page.getByText(/质量结论：/)).toBeVisible();
  await expect(page.getByRole('button', { name: /展开具体更新内容/ })).toBeVisible();
  await expect(page.getByText('工具', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /展开具体更新内容/ }).click();
  await expect(page.getByText('工具', { exact: true })).toBeVisible();
  await expect(page.getByText('页面', { exact: true })).toBeVisible();
  await expect(page.getByText('字段', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '/tools/playwright-mcp' }).first()).toHaveAttribute('href', '/tools/playwright-mcp');
  await expect(page.getByText('tool', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Playwright MCP', exact: true }).first()).toHaveAttribute('href', '/tools/playwright-mcp');
  await expect(page.getByRole('link', { name: 'uv', exact: true }).first()).toHaveAttribute('href', '/tools/uv');

  await page.getByRole('link', { name: 'Playwright MCP', exact: true }).first().click();
  await expect(page).toHaveURL(/\/tools\/playwright-mcp$/);
});

test('public users can browse prompt, command, and guide pages', async ({ page }) => {
  await page.goto('/prompts');
  await expect(page.getByRole('heading', { name: '提示词模板库' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '资料研究和指南更新' })).toBeVisible();
  await expect(page.getByText('使用 Context7 MCP 查询公开库文档')).toBeVisible();
  await expect(page.getByText('用 Context7 MCP 查询这个工具的公开文档')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Python 工具和后端脚本' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Context7 MCP' })).toHaveAttribute('href', '/tools/context7-mcp');

  await page.getByRole('navigation').getByRole('link', { name: '命令速查' }).click();
  await expect(page).toHaveURL(/\/commands$/);
  await expect(page.getByRole('heading', { name: '快速命令汇总' })).toBeVisible();
  await expect(page.getByText('claude mcp get context7', { exact: true })).toBeVisible();
  await expect(page.getByText('claude mcp get playwright', { exact: true })).toBeVisible();
  await expect(page.getByText('uv --version', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Context7 MCP' }).first()).toHaveAttribute('href', '/tools/context7-mcp');

  await page.getByRole('navigation').getByRole('link', { name: '使用指南' }).click();
  await expect(page).toHaveURL(/\/guides$/);
  await expect(page.getByRole('heading', { name: '工具使用导航' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MCP 装了以后怎么使用？' })).toBeVisible();
  await expect(page.getByText('Claude 会根据任务选择合适的 MCP 工具。')).toBeVisible();
  await expect(page.getByRole('heading', { name: '安全注意事项' })).toBeVisible();
  await expect(page.getByText('公开库文档、API 示例和指南资料补充')).toBeVisible();
  await expect(page.getByText('新增 MCP 工具后需要补全全站内容')).toBeVisible();
  await expect(page.getByRole('link', { name: 'uv' })).toHaveAttribute('href', '/tools/uv');
  await expect(page.getByRole('link', { name: 'Context7 MCP' }).first()).toHaveAttribute('href', '/tools/context7-mcp');
});

test('public users can filter tools by type radio buttons', async ({ page }) => {
  await page.goto('/tools');
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'uv' })).toBeVisible();

  const typeFilter = page.getByLabel('工具标识筛选');

  await typeFilter.getByText('mcp', { exact: true }).click();
  await expect(typeFilter.locator('input[value="mcp"]')).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Context7 MCP' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'uv' })).toHaveCount(0);

  await typeFilter.getByText('cli', { exact: true }).click();
  await expect(typeFilter.locator('input[value="cli"]')).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'uv' })).toBeVisible();

  await typeFilter.getByText('全部', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'uv' })).toBeVisible();
});

test('admin can log in and re-import reviewed JSON', async ({ page }) => {
  await login(page);

  await page.getByRole('link', { name: '导入 JSON' }).click();
  await expect(page).toHaveURL(/\/admin\/imports$/);
  await page.getByLabel('导入 JSON').fill(JSON.stringify(sampleImportPayload, null, 2));
  await page.getByRole('button', { name: '执行导入' }).click();

  await expect(page.getByRole('status')).toContainText('导入成功');
  await expect(page.getByRole('status')).toContainText('更新 2');
});

test('private imported tools stay hidden publicly and visible to admin', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: '导入 JSON' }).click();
  await page.getByLabel('导入 JSON').fill(JSON.stringify(privateImportPayload, null, 2));
  await page.getByRole('button', { name: '执行导入' }).click();
  await expect(page.getByRole('status')).toContainText('导入成功');

  await page.getByRole('navigation').getByRole('link', { name: '工具库', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByText('Private Runbook')).toHaveCount(0);

  await page.goto('/admin/tools');
  await expect(page.getByText('Private Runbook')).toBeVisible();
  await expect(page.getByText('skill · login_required')).toBeVisible();
});

test('invalid import JSON shows an error without leaving the page', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: '导入 JSON' }).click();
  await page.getByLabel('导入 JSON').fill('{ invalid json');
  await page.getByRole('button', { name: '执行导入' }).click();

  await expect(page).toHaveURL(/\/admin\/imports$/);
  await expect(page.getByRole('alert')).toHaveText('导入失败，请检查 JSON、登录状态或敏感信息提示。');
});

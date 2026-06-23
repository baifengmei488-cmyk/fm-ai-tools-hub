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
  await expect(page.getByRole('heading', { name: 'ToolVault' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: '工具库', exact: true }).click();
  await expect(page.getByRole('heading', { name: '工具库' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();

  await page.getByRole('link', { name: /Playwright MCP/ }).click();
  await expect(page).toHaveURL(/\/tools\/playwright-mcp$/);
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByText('configured')).toBeVisible();
  await expect(page.getByText('claude mcp add -s user playwright -- npx -y @playwright/mcp')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP 使用指南' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: '指南目录' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: '指南目录' }).getByRole('link', { name: '适合做什么' }),
  ).toBeVisible();
  await expect(page.getByText('用于打开网页、点击按钮、填写表单、截图和检查控制台错误。')).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});

test('public users can browse workflow navigation guides', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ToolVault' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '推荐组合工作流' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub MCP' }).first()).toHaveAttribute('href', '/tools/github-mcp');

  await page.getByRole('link', { name: '查看工作流' }).click();
  await expect(page).toHaveURL(/\/workflows$/);
  await expect(page.getByRole('heading', { name: '实用工作流' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PR 验收' })).toBeVisible();
  await expect(page.getByText('GitHub MCP 查看 PR → 分析改动范围 → Playwright 测页面 → MySQL 查数据 → Time MCP 记录验证时间 → 输出测试结论。')).toBeVisible();
  await expect(page.getByRole('heading', { name: '公开资料研究' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Firecrawl MCP' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Time MCP' }).first()).toHaveAttribute('href', '/tools/time-mcp');
  await expect(page.getByText('Superpowers Skills', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Frontend Design plugin', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Skill Creator plugin', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('PicGo', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Playwright MCP' }).first()).toHaveAttribute('href', '/tools/playwright-mcp');
  await expect(page.getByRole('heading', { name: '测试人员常用提示词模板' })).toBeVisible();
  await expect(page.getByText('根据这个需求，帮我生成测试用例')).toBeVisible();
  await expect(page.getByRole('heading', { name: '快速命令汇总' })).toBeVisible();
  await expect(page.getByText('claude mcp list')).toBeVisible();
});

test('public users can browse update logs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: '更新日志' }).click();
  await expect(page).toHaveURL(/\/updates$/);
  await expect(page.getByRole('heading', { name: '更新日志' })).toBeVisible();
  await expect(page.getByText('claude_local_scan')).toBeVisible();
  await expect(page.getByText('2026-06-18T10:00:00+08:00')).toBeVisible();
  await expect(page.getByText('Validation passed')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Playwright MCP', exact: true })).toHaveAttribute('href', '/tools/playwright-mcp');
  await expect(page.getByRole('link', { name: 'uv', exact: true })).toHaveAttribute('href', '/tools/uv');

  await page.getByRole('link', { name: 'Playwright MCP', exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/playwright-mcp$/);
});

test('public users can browse prompt, command, and guide pages', async ({ page }) => {
  await page.goto('/prompts');
  await expect(page.getByRole('heading', { name: '提示词模板库' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '生成测试用例' })).toBeVisible();
  await expect(page.getByText('根据 PR 改动生成测试点')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'UI 和前端设计' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '资料研究和指南更新' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '时间和排期处理' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '图片和文档素材' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Firecrawl MCP' })).toHaveAttribute('href', '/tools/firecrawl-mcp');

  await page.getByRole('navigation').getByRole('link', { name: '命令速查' }).click();
  await expect(page).toHaveURL(/\/commands$/);
  await expect(page.getByRole('heading', { name: '快速命令汇总' })).toBeVisible();
  await expect(page.getByText('claude plugin list', { exact: true })).toBeVisible();
  await expect(page.getByText('claude --version', { exact: true })).toBeVisible();
  await expect(page.getByText('claude mcp get firecrawl', { exact: true })).toBeVisible();
  await expect(page.getByText('claude mcp get mysql', { exact: true })).toBeVisible();
  await expect(page.getByText('open -a PicGo', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub MCP' }).first()).toHaveAttribute('href', '/tools/github-mcp');

  await page.getByRole('navigation').getByRole('link', { name: '使用指南' }).click();
  await expect(page).toHaveURL(/\/guides$/);
  await expect(page.getByRole('heading', { name: '工具使用导航' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MCP 装了以后怎么使用？' })).toBeVisible();
  await expect(page.getByText('Claude 会根据任务选择合适的 MCP 工具。')).toBeVisible();
  await expect(page.getByRole('heading', { name: '安全注意事项' })).toBeVisible();
  await expect(page.getByText('当前时间、时区转换、相对日期')).toBeVisible();
  await expect(page.getByText('高速 Python 工具、包和项目运行管理')).toBeVisible();
  await expect(page.getByText('图片上传和图床管理')).toBeVisible();
  await expect(page.getByRole('link', { name: 'uv' })).toHaveAttribute('href', '/tools/uv');
});

test('public users can filter tools by type radio buttons', async ({ page }) => {
  await page.goto('/tools');
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'uv' })).toBeVisible();

  const typeFilter = page.getByLabel('工具标识筛选');

  await typeFilter.getByText('mcp', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'mcp' })).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'uv' })).toHaveCount(0);

  await typeFilter.getByText('cli', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'cli' })).toBeChecked();
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

import { expect, test } from '@playwright/test';

const apiBase = process.env.PLAYWRIGHT_API_BASE ?? 'http://127.0.0.1:8000';

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

test('homepage recommendation scroll stays inside the card and changes recommendations', async ({ page }) => {
  await page.route('**/api/page-content', async (route) => {
    await route.fulfill({
      json: {
        home_highlights: Array.from({ length: 6 }, (_, index) => ({
          title: `第 ${index + 1} 条推荐`,
          description: `推荐说明 ${index + 1}`,
          tools: [],
        })),
        workflows: [],
        tool_combinations: [],
        prompt_groups: [],
        command_groups: [],
        guide_choices: [],
        guide_workflow_tips: [],
        guide_safety_notes: [],
      },
    });
  });

  await page.goto('/');
  await expect(page.getByText('第 1 条推荐')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 140));
  const initialPageScroll = await page.evaluate(() => window.scrollY);
  const recommendationCard = page.getByLabel('每日推荐卡片');
  const scrollRecommendation = async (index: number) => {
    await recommendationCard.evaluate((element, targetIndex) => {
      element.scrollTo({ top: element.clientHeight * targetIndex, behavior: 'instant' });
    }, index);
  };

  await scrollRecommendation(1);
  await expect(page.getByText('第 2 条推荐')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(initialPageScroll);

  await scrollRecommendation(2);
  await expect(page.getByText('第 3 条推荐')).toBeVisible();
  await scrollRecommendation(1);
  await expect(page.getByText('第 2 条推荐')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(initialPageScroll);
});

test('public users can browse imported public tool details', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'FM AI Tools Hub' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: '工具库', exact: true }).click();
  await expect(page.getByRole('heading', { name: '工具库' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Playwright MCP 工具图标' })).toBeVisible();

  await page.getByRole('link', { name: /Playwright MCP/ }).click();
  await expect(page).toHaveURL(/\/tools\/playwright-mcp$/);
  await expect(page.getByRole('heading', { name: 'Playwright MCP', exact: true })).toBeVisible();
  await expect(page.getByText('configured').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '工具速查' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '安装与验证' })).toBeVisible();
  await expect(page.getByText('claude mcp add -s user playwright -- npx -y @playwright/mcp')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP 使用指南' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: '指南目录' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: '指南目录' }).getByRole('link', { name: '它具体能测什么' }),
  ).toBeVisible();
  await expect(page.getByText('你可以把它理解成“让 Claude 真的打开网页看一遍”')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'FM AI Tools Hub 专用验收模板' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: '工具库', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Context7 MCP' })).toBeVisible();
  await page.getByRole('link', { name: /Context7 MCP/ }).click();
  await expect(page).toHaveURL(/\/tools\/context7-mcp$/);
  await expect(page.getByRole('heading', { name: 'Context7 MCP', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Context7 MCP 使用指南' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: '安装后怎么用' })).toBeVisible();
  await expect(page.locator('#tool-install-verify').getByText('claude mcp get context7')).toBeVisible();
});

test('public users can browse workflow, prompt, and command tabs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'FM AI Tools Hub' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '今日推荐' })).toBeVisible();
  await expect(page.getByText('工具库 + 工作流 + 提示词 + 命令速查')).toHaveCount(0);
  await expect(page.getByText('工具库 + 综合工作流')).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: '提示词' })).toHaveCount(0);
  await expect(page.getByRole('navigation').getByRole('link', { name: '命令速查' })).toHaveCount(0);

  await page.getByRole('link', { name: '查看工作流' }).click();
  await expect(page).toHaveURL(/\/workflows$/);
  await expect(page.getByRole('heading', { name: '实用工作流' })).toBeVisible();
  const workflowTabs = page.getByRole('tablist', { name: '工作流内容分类' });
  await expect(workflowTabs.getByText('点击切换下方内容')).toBeVisible();
  await expect(workflowTabs.getByRole('tab', { name: /工作流/ }).getByText('当前栏目')).toBeVisible();
  await expect(workflowTabs.getByRole('tab', { name: /提示词/ }).getByText('点击切换')).toBeVisible();
  await expect(page.getByRole('tab', { name: '工作流' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '推荐组合工作流' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '组合使用示例' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '常用场景提示词模板' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '快速命令汇总' })).toHaveCount(0);

  await page.getByRole('tab', { name: '提示词' }).click();
  await expect(page).toHaveURL(/\/workflows\?tab=prompts$/);
  await expect(page.getByRole('tab', { name: '提示词' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '常用场景提示词模板' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '推荐组合工作流' })).toHaveCount(0);

  await page.getByRole('tab', { name: '命令' }).click();
  await expect(page).toHaveURL(/\/workflows\?tab=commands$/);
  await expect(page.getByRole('tab', { name: '命令' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '快速命令汇总' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '安全边界' })).toBeVisible();

  await page.goto('/prompts');
  await expect(page).toHaveURL(/\/workflows\?tab=prompts$/);
  await expect(page.getByRole('tab', { name: '提示词' })).toHaveAttribute('aria-selected', 'true');

  await page.goto('/commands');
  await expect(page).toHaveURL(/\/workflows\?tab=commands$/);
  await expect(page.getByRole('tab', { name: '命令' })).toHaveAttribute('aria-selected', 'true');
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
  await expect(page.getByText(/更新时间：/)).toBeVisible();
  await expect(page.getByText(/资料生成：/)).toBeVisible();
  await expect(page.getByText(/验证：Validation passed/)).toBeVisible();
  await expect(page.getByText(/影响工具：/)).toBeVisible();
  await expect(page.getByRole('button', { name: /展开执行前页面内容清单/ })).toHaveCount(0);
  await expect(page.getByText('/tools/{slug}')).toHaveCount(0);
  await expect(page.getByText('说明安装后怎么使用')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /展开执行详情/ })).toBeVisible();
  await expect(page.getByText(/质量结论：/)).toHaveCount(0);
  await page.getByRole('button', { name: /展开执行详情/ }).click();
  await expect(page.getByRole('tab', { name: '执行结果报告' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('结果：')).toBeVisible();
  await expect(page.getByText('status=imported')).toBeVisible();
  await expect(page.getByText(/import_id=\d+/)).toBeVisible();
  await expect(page.getByText(/质量结论：/)).toBeVisible();
  await expect(page.getByText('工具', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: '具体更新内容' }).click();
  await expect(page.getByRole('tab', { name: '具体更新内容' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('工具', { exact: true })).toBeVisible();
  await expect(page.getByText('页面', { exact: true })).toBeVisible();
  await expect(page.getByText('字段', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '/workflows' }).first()).toHaveAttribute('href', '/workflows');
  await expect(page.getByText('page_content.home_highlights').first()).toBeVisible();
  await expect(page.getByRole('link', { name: '/prompts' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '/commands' })).toHaveCount(0);
  const firstToolLink = page.locator('a[href^="/tools/"]').first();
  await expect(firstToolLink).toBeVisible();
  await firstToolLink.click();
  await expect(page).toHaveURL(/\/tools\//);
});

test('public users can browse guide page and legacy workflow redirects', async ({ page }) => {
  await page.goto('/prompts');
  await expect(page).toHaveURL(/\/workflows\?tab=prompts$/);
  await expect(page.getByRole('tab', { name: '提示词' })).toHaveAttribute('aria-selected', 'true');

  await page.goto('/commands');
  await expect(page).toHaveURL(/\/workflows\?tab=commands$/);
  await expect(page.getByRole('tab', { name: '命令' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('navigation').getByRole('link', { name: '使用指南' }).click();
  await expect(page).toHaveURL(/\/guides$/);
  await expect(page.getByRole('heading', { name: '工具使用导航' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '安全注意事项' })).toBeVisible();
  await expect(page.locator('a[href^="/tools/"]').first()).toBeVisible();
});

test('public users can browse the editorial personal homepage and existing content stays populated', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByText('FM Personal Portfolio')).toBeVisible();
  await expect(page.getByRole('heading', { name: '在复杂业务系统里，把需求、质量、流程和工具连接起来。' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'FM 抽象人物剪影' })).toBeVisible();
  await expect(page.getByText('可验证 · 可补跑 · 可交接 · 可复用')).toBeVisible();
  await expect(page.getByRole('heading', { name: '不是项目罗列，而是复杂问题的处理证据。' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'RPA 自动化项目群' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ToolVault / FM AI Tools Hub' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '我真正擅长的，不是单点技能，而是把复杂事情推进到可交付。' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '能力不是标签，而是有项目证据的组合。' })).toBeVisible();
  await expect(page.getByText('write218@163.com')).toHaveCount(1);
  await expect(page.getByText('bfm_135')).toHaveCount(1);
  await expect(page.getByText('白凤梅')).toHaveCount(0);
  await expect(page.getByText(/电话|手机/)).toHaveCount(0);
  await expect(page.getByText(/求职|找工作|投递/)).toHaveCount(0);
  await expect(page.getByText(/下载简历|查看简历/)).toHaveCount(0);

  const toolsResponse = await page.request.get(`${apiBase}/api/tools`);
  expect(toolsResponse.ok()).toBeTruthy();
  const tools = await toolsResponse.json();
  expect(Array.isArray(tools)).toBeTruthy();
  expect(tools.length).toBeGreaterThan(0);

  const pageContentResponse = await page.request.get(`${apiBase}/api/page-content`);
  expect(pageContentResponse.ok()).toBeTruthy();
  const pageContent = await pageContentResponse.json();
  for (const section of [
    'home_highlights',
    'workflows',
    'tool_combinations',
    'prompt_groups',
    'command_groups',
    'guide_choices',
    'guide_workflow_tips',
    'guide_safety_notes',
  ]) {
    expect(Array.isArray(pageContent[section])).toBeTruthy();
    expect(pageContent[section].length).toBeGreaterThan(0);
  }

  const updateLogsResponse = await page.request.get(`${apiBase}/api/update-logs`);
  expect(updateLogsResponse.ok()).toBeTruthy();
  const updateLogs = await updateLogsResponse.json();
  expect(Array.isArray(updateLogs)).toBeTruthy();
  expect(updateLogs.length).toBeGreaterThan(0);
});

test('public users can filter tools by type radio buttons', async ({ page }) => {
  await page.goto('/tools');
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'uv' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Playwright MCP/ }).getByText('playwright', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /uv/ }).getByText('tooling', { exact: true })).toHaveCount(0);

  const typeFilter = page.getByLabel('工具标识筛选');

  await typeFilter.getByText('mcp_server', { exact: true }).click();
  await expect(typeFilter.locator('input[value="mcp_server"]')).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Context7 MCP' })).toBeVisible();
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

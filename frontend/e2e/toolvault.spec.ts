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
          title: '使用指南',
          guide_type: 'usage',
          visibility: 'public',
          content_markdown: '# Playwright MCP 使用指南\n\n用于打开网页、点击按钮、填写表单、截图和检查控制台错误。',
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

  await page.getByRole('link', { name: '工具库' }).click();
  await expect(page.getByRole('heading', { name: '工具库' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();

  await page.getByRole('link', { name: /Playwright MCP/ }).click();
  await expect(page).toHaveURL(/\/tools\/playwright-mcp$/);
  await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
  await expect(page.getByText('configured')).toBeVisible();
  await expect(page.getByText('claude mcp add -s user playwright -- npx -y @playwright/mcp')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright MCP 使用指南' })).toBeVisible();
  await expect(page.getByText('用于打开网页、点击按钮、填写表单、截图和检查控制台错误。')).toBeVisible();
});

test('admin can log in and re-import reviewed JSON', async ({ page }) => {
  await login(page);

  await page.getByRole('link', { name: '导入 JSON' }).click();
  await expect(page).toHaveURL(/\/admin\/imports$/);
  await page.getByLabel('导入 JSON').fill(JSON.stringify(sampleImportPayload, null, 2));
  await page.getByRole('button', { name: '执行导入' }).click();

  await expect(page.getByRole('status')).toContainText('导入成功');
  await expect(page.getByRole('status')).toContainText('更新 1');
});

test('private imported tools stay hidden publicly and visible to admin', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: '导入 JSON' }).click();
  await page.getByLabel('导入 JSON').fill(JSON.stringify(privateImportPayload, null, 2));
  await page.getByRole('button', { name: '执行导入' }).click();
  await expect(page.getByRole('status')).toContainText('导入成功');

  await page.getByRole('link', { name: '工具库' }).click();
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

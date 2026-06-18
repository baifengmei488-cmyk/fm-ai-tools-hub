import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost, getStoredToken } from '../../api/client';

type ImportStatus = 'idle' | 'submitting' | 'success' | 'error' | 'unauthenticated';

type ImportResult = {
  created: number;
  updated: number;
  import_id: number;
};

export function ImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    const token = getStoredToken();
    if (!token) {
      setStatus('unauthenticated');
      setMessage('请先登录后台，再执行导入。');
      return;
    }

    if (!jsonText.trim()) {
      setStatus('error');
      setMessage('请先粘贴需要导入的 JSON。');
      return;
    }

    setStatus('submitting');
    try {
      const payload = JSON.parse(jsonText) as unknown;
      const result = await apiPost<ImportResult>(
        '/api/admin/imports/tools',
        payload,
        token,
      );
      setStatus('success');
      setMessage(`导入成功：新增 ${result.created}，更新 ${result.updated}`);
    } catch {
      setStatus('error');
      setMessage('导入失败，请检查 JSON、登录状态或敏感信息提示。');
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Claude JSON 导入</h1>
          <p className="mt-2 text-sm text-slate-600">粘贴 Claude 生成并审阅过的导入 JSON。</p>
        </div>
        <Link className="text-sm font-medium text-blue-700" to="/admin/tools">返回工具管理</Link>
      </div>
      <label className="mt-6 block text-sm font-medium" htmlFor="import-json">导入 JSON</label>
      <textarea
        id="import-json"
        className="mt-2 min-h-96 w-full rounded-lg border p-3 font-mono text-sm"
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
      />
      {message && (
        <p className={status === 'error' || status === 'unauthenticated' ? 'mt-4 text-sm text-red-600' : 'mt-4 text-sm text-slate-700'} role={status === 'error' || status === 'unauthenticated' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
      {status === 'unauthenticated' && (
        <Link className="mt-4 inline-flex min-h-11 items-center rounded-lg border px-4 py-2 font-medium text-slate-700" to="/login">前往登录</Link>
      )}
      <button
        className="mt-4 min-h-11 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? '正在导入...' : '执行导入'}
      </button>
    </form>
  );
}

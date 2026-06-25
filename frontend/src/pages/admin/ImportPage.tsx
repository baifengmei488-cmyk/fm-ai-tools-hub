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
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Import</p>
          <h1 className="text-2xl font-black">Claude JSON 导入</h1>
          <p className="mt-1 text-sm text-slate-600">粘贴 Claude 生成并审阅过的导入 JSON。</p>
        </div>
        <Link className="text-sm font-bold text-blue-700" to="/admin/tools">返回工具管理</Link>
      </div>
      <label className="mt-4 block text-sm font-bold" htmlFor="import-json">导入 JSON</label>
      <textarea
        id="import-json"
        className="mt-1.5 min-h-80 w-full rounded-lg border border-slate-200 p-3 font-mono text-sm leading-6"
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
      />
      {message && (
        <p className={status === 'error' || status === 'unauthenticated' ? 'mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700 ring-1 ring-red-100' : 'mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700 ring-1 ring-emerald-100'} role={status === 'error' || status === 'unauthenticated' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
      {status === 'unauthenticated' && (
        <Link className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700" to="/login">前往登录</Link>
      )}
      <button
        className="mt-3 min-h-10 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? '正在导入...' : '执行导入'}
      </button>
    </form>
  );
}

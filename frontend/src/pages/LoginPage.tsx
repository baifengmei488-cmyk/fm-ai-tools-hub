import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, storeToken } from '../api/client';

type LoginStatus = 'idle' | 'submitting';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      const response = await login(username, password);
      storeToken(response.access_token);
      navigate('/admin/tools');
    } catch {
      setError('用户名或密码错误，请检查后重试。');
      setStatus('idle');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">ADM</span>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Admin</p>
          <h1 className="text-2xl font-black">后台登录</h1>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">登录后可查看内部工具并导入 Claude JSON。</p>
      <label className="mt-5 block text-sm font-bold" htmlFor="admin-username">用户名</label>
      <input
        id="admin-username"
        autoComplete="username"
        className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <label className="mt-3 block text-sm font-bold" htmlFor="admin-password">密码</label>
      <input
        id="admin-password"
        autoComplete="current-password"
        className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700 ring-1 ring-red-100" role="alert">{error}</p>}
      <button
        className="mt-5 min-h-10 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? '正在登录...' : '登录'}
      </button>
    </form>
  );
}

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
    <form onSubmit={onSubmit} className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">后台登录</h1>
      <p className="mt-2 text-sm text-slate-600">登录后可查看内部工具并导入 Claude JSON。</p>
      <label className="mt-6 block text-sm font-medium" htmlFor="admin-username">用户名</label>
      <input
        id="admin-username"
        autoComplete="username"
        className="mt-2 min-h-11 w-full rounded-lg border px-3 py-2"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <label className="mt-4 block text-sm font-medium" htmlFor="admin-password">密码</label>
      <input
        id="admin-password"
        autoComplete="current-password"
        className="mt-2 min-h-11 w-full rounded-lg border px-3 py-2"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
      <button
        className="mt-6 min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? '正在登录...' : '登录'}
      </button>
    </form>
  );
}

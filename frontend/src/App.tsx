import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ToolListPage } from './pages/ToolListPage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { LoginPage } from './pages/LoginPage';
import { AdminToolsPage } from './pages/admin/AdminToolsPage';
import { ImportPage } from './pages/admin/ImportPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools', element: <ToolListPage /> },
      { path: 'tools/:slug', element: <ToolDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'admin/tools', element: <AdminToolsPage /> },
      { path: 'admin/imports', element: <ImportPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

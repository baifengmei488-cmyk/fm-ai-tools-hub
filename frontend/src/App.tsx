import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ToolListPage } from './pages/ToolListPage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { PromptTemplatePage } from './pages/PromptTemplatePage';
import { CommandPage } from './pages/CommandPage';
import { GuideNavigationPage } from './pages/GuideNavigationPage';
import { UpdateLogPage } from './pages/UpdateLogPage';
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
      { path: 'workflows', element: <WorkflowPage /> },
      { path: 'prompts', element: <PromptTemplatePage /> },
      { path: 'commands', element: <CommandPage /> },
      { path: 'guides', element: <GuideNavigationPage /> },
      { path: 'updates', element: <UpdateLogPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'admin/tools', element: <AdminToolsPage /> },
      { path: 'admin/imports', element: <ImportPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

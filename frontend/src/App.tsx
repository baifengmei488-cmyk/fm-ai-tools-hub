import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ToolListPage } from './pages/ToolListPage';
import { ToolDetailPage } from './pages/ToolDetailPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools', element: <ToolListPage /> },
      { path: 'tools/:slug', element: <ToolDetailPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

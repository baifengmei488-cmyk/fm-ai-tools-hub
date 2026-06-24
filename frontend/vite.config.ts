import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const frontendPort = Number(process.env.TOOLVAULT_FRONTEND_PORT ?? '5173');

export default defineConfig({
  plugins: [react()],
  server: {
    port: frontendPort,
    strictPort: true,
  },
});

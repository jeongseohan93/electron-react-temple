import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        // main 프로세스를 위한 vite 설정을 여기에 추가합니다.
        vite: {
          build: {
            rollupOptions: { 
              external: ['@prisma/client'], // sqlite3를 외부 모듈로 지정
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
    build: {
    rollupOptions: { 
      // --- 이 부분을 수정합니다 ---
      input: {
        main: resolve(__dirname, 'index.html'),
        settings: resolve(__dirname, 'settings.html'),
      },
    },
  },
})
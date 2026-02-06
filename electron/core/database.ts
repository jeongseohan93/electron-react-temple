import { PrismaClient } from '@prisma/client';
import { app } from 'electron';
import path from 'node:path';

// 플라즈마 ORM을 사용하여 SQLite 데이터베이스에 연결 설정
const productionDbPath = path.join(app.getPath('userData'), 'app.db');

// PrismaClient를 생성할 때, 데이터소스 URL을 동적으로 설정
export const prisma = new PrismaClient({
  datasources: {
    db: {
      // 'vite dev'로 실행 중일 때는(development), .env 파일의 DATABASE_URL을 사용하고,
      // 빌드된 앱을 실행할 때는(production), 위에서 만든 최종 경로(productionDbPath)를 사용합니다.
      url: process.env.NODE_ENV === 'development'
        ? process.env.DATABASE_URL
        : `file:${productionDbPath}`,
    },
  },
});
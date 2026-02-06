import { prisma } from './database';

export const getApiKey = async (): Promise<string> => {
    
  // Prisma를 사용하여 'settings' 테이블에서 키가 'api_key'인 항목을 검색
    const apiKey = await prisma.settings.findUnique({
        where: { key: 'api_key' },
      });

      // 조회된 항목이 없거나, 있더라도 value 속성이 비어있으면 에러를 발생
      if(!apiKey?.value) {
        throw new Error ('api키가 존재하지 않아요');
      }
      // 조회된 API 키 값을 반환
      return apiKey?.value;
}
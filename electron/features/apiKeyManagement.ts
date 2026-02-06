import { ipcMain } from 'electron';
import { prisma } from '../core/database';
import { initializeApiClient } from './apiRequestMainPage';

export const registerApiManagement = () => {

     // api키 저장 핸들러
     // ORM(Prisma)을 이용하여 api키 저장
     ipcMain.handle('save:api-key', async (_, apiKey: string) => {
            await prisma.settings.upsert({
                where: { key: 'api_key' },
                update: { value: apiKey },
                create: { key: 'api_key', value: apiKey },
            });
            return { success: true };
        });

        ipcMain.on('api-key-updated', () => {
            console.log('API 키 변경 감지. API 클라이언트를 재초기화합니다.');
            initializeApiClient();
        });
    
        // API 키 존재 여부 확인 
        // ORM(Prisma)을 이용하여 api키 존재하는 지 체크
        ipcMain.handle('check:api-key', async () => {
            const apikeySetting = await prisma.settings.findUnique({
                where: { key: 'api_key' },
            });
            return !!apikeySetting; // 존재하면 true, 없으면 false 반환
        });

}
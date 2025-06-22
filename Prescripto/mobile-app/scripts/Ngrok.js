import ngrok from 'ngrok';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//kill ngrok process
ngrok.kill();

const startNgrok = async () => {
    try {
        const url5000 = await ngrok.connect(5000);
        const url9000 = await ngrok.connect(9000);

        const ngrokData = {
            BACKEND_URL: url9000,
            BACKEND_URL_CHATBOT: url5000
        };

        fs.writeFileSync(
            path.join(__dirname, '../ngrok-urls.json'),
            JSON.stringify(ngrokData, null, 2),
            'utf8'
        );

        console.log('✅ Đã lưu ngrok URL vào ngrok-urls.json ');
        console.log('🌐 Backend URL:', url9000);
        console.log('🤖 Chatbot URL:', url5000);
        console.log('\n📱 Bây giờ bạn có thể chạy mobile app: npm start');
        console.log('🛑 Nhấn Ctrl+C để dừng ngrok tunnels');

        // Xử lý khi nhấn Ctrl+C
        process.on('SIGINT', () => {
            console.log('\n🛑 Đang dừng ngrok tunnels...');
            ngrok.kill();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Lỗi khi khởi động ngrok:', error.message);
        process.exit(1);
    }
};

startNgrok();
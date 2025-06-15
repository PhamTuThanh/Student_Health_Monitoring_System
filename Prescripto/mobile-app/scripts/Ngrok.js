import fs from 'fs';
import path from 'path';
import ngrok from 'ngrok';

const __dirname = path.resolve();
//kill ngrok process
  ngrok.kill();
(async () => {
  const url5000 = await ngrok.connect(5000);
  const url9000 = await ngrok.connect(9000);

  const ngrokData = {
    BACKEND_URL: url9000,
    BACKEND_URL_CHATBOT: url5000,
  };

  fs.writeFileSync(
    path.join(__dirname, '../ngrok-urls.json'),
    JSON.stringify(ngrokData, null, 2),
    'utf8'
  );
  console.log('✅ Đã lưu ngrok URL vào ngrok-urls.json ');
})();
import express from 'express';
import bodyParser from 'body-parser';
import prisma from './database/prisma.js';
import topBuyersHandler from './express/route/top_buyers.js';
import tokenInfoPumpHandler from './express/route/token_info_pump.js';

const app = express();
const PORT = 3000;

// 使用 body-parser 来解析 JSON 格式的请求体
app.use(bodyParser.json());

// 创建一个 POST 请求的 webhook 路由
app.post('/top/buyers', topBuyersHandler);
app.post('/token/info/pump', tokenInfoPumpHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// 监听进程的关闭事件
async function handleExit(signal: string) {
  server.close(async () => {
    console.log('Server closed.');
    await prisma.$disconnect();
  });
}

// 捕捉系统信号，用于优雅地关闭连接
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('SIGQUIT', handleExit);
process.on('exit', (code) => {
  console.log(`Process exit event with code: ${code}`);
});

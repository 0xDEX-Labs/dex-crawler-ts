import { router } from '@/routes.js';
import { crawlerGmgnUrlConfigs } from './const/crawlerUrls.js';
import gmgn from './site/gmgn.js';
import { RequestQueue } from 'crawlee';
import { generatePumpUrl, generateTopBuyersUrl } from './utils/urlGenerate.js';
import prisma from './database/prisma.js';
import pump from './site/pump.js';

// https://pump.fun/BY1phzPpWavqEMC5zQsHpsVD2Tp11q4HpK2DfEpspump

const data = [
  {
    chain: 'sol',
    token: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump',
  },
  // {
  //   chain: 'sol',
  //   token: 'FqvtZ2UFR9we82Ni4LeacC1zyTiQ77usDo31DUokpump',
  // },
  // {
  //   chain: 'sol',
  //   token: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
  // },
];

async function main() {
  const requestQueueGmgn = await RequestQueue.open('gmgn');
  const requestQueuePump = await RequestQueue.open('pump');
  const urls = [];
  for (let item of data) {
    urls.push({
      url: generateTopBuyersUrl(item.token, item.chain),
      label: 'top/buyers',
      datasetName: 'top_buyers',
    });
  }
  const url = generatePumpUrl('BY1phzPpWavqEMC5zQsHpsVD2Tp11q4HpK2DfEpspump');
  requestQueueGmgn.addRequests([
    ...urls,
    {
      url: url,
      label: 'token/info/pump',
      datasetName: 'top_buyers',
      uniqueKey: `${url}${new Date().valueOf()}`,
    },
    ...crawlerGmgnUrlConfigs,
  ]);

  const crawlerGmgn = gmgn({
    requestHandler: router,
    requestQueue: requestQueueGmgn,
  });

  const crawlerPump = pump({
    requestHandler: router,
    requestQueue: requestQueuePump,
  });

  try {
    await crawlerGmgn.run();
    await crawlerPump.run();
    console.log('爬虫任务成功完成');
  } catch (error) {
    console.error('爬虫运行过程中发生错误:', error);
  } finally {
    await crawlerGmgn.teardown();
    await crawlerPump.teardown();
    await prisma.$disconnect();
    console.log('爬虫资源已清理，程序正常退出');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('程序执行过程中发生未捕获的错误:', error);
  process.exit(1);
});

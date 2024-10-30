import { smartWalletActivity } from '@/handlers/smartWalletActivity.js';
import { topBuyers } from '@/handlers/topBuyers.js';
import gmgn from '@/site/gmgn.js';
import { generateTopBuyersUrl } from '@/utils/urlGenerate.js';
import { createPlaywrightRouter, RequestQueue } from 'crawlee';

const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, request }) => {
  const title = await page.title();
  console.log(`URL: ${request.url}`);
  console.log(`Title: ${title}`);
});

router.addHandler('top/buyers', topBuyers);
router.addHandler('smart/wallet/activity', smartWalletActivity);

const topBuyersHandler = async (req, res) => {
  const data = req.body;
  console.log('Received webhook data:', data);
  const list = [
    {
      chain: data.chain,
      token: data.token,
    },
  ];
  const requestQueue = await RequestQueue.open();
  const urls = [];
  for (let item of list) {
    urls.push({
      url: generateTopBuyersUrl(item.token, item.chain),
      label: 'top/buyers',
      datasetName: 'top_buyers',
    });
  }
  await requestQueue.addRequests(urls);

  const crawler = gmgn({
    requestHandler: router,
    requestQueue,
  });

  try {
    await crawler.run();
    console.log('爬虫任务成功完成');
    res.sendStatus(200); // 返回成功状态码
  } catch (error) {
    console.error('爬虫运行过程中发生错误:', error);
    res.sendStatus(500); // 返回成功状态码
  } finally {
    await crawler.teardown();
    console.log('爬虫资源已清理，程序正常退出');
  }
};

export default topBuyersHandler;

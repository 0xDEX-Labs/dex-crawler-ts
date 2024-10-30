import { tokenInfoPump } from '@/handlers/token_info_pump.js';
import pump from '@/site/pump.js';
import { generatePumpUrl } from '@/utils/urlGenerate.js';
import { createPlaywrightRouter, RequestQueue } from 'crawlee';

const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, request }) => {
  const title = await page.title();
  console.log(`URL: ${request.url}`);
  console.log(`Title: ${title}`);
});

router.addHandler('token/info/pump', tokenInfoPump);

const tokenInfoPumpHandler = async (req, res) => {
  const data = req.body;
  console.log('Received webhook data:', data);

  const requestQueue = await RequestQueue.open();
  const urls = [];
  const url = generatePumpUrl(data.token);
  urls.push({
    url,
    label: 'token/info/pump',
    datasetName: 'token_info',
    uniqueKey: `${url}${new Date().valueOf()}`,
  });

  await requestQueue.addRequests(urls);

  const crawler = pump({
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

export default tokenInfoPumpHandler;

// main.ts

import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { firefox } from 'playwright';
import prisma from '@dex_crawler/gmgn_crawler/src/database/prisma.js';
import {
  Token,
  RequestType,
  TokenStatsData,
  HolderData,
} from '@/types/interfaces.js';
import { fetchTokenData } from '@/helper/dataFetchers.js';
import {
  //updateTokenSecurityDataInDatabase,
  updateTokenStatsInDatabase,
  updateTopBuysInDatabase,
} from '@/database/index.js';
import {
  MAX_CONCURRENCY,
  REQUEST_TIMEOUT,
  BASE_URLS,
} from '@/helper/constants.js';
import { FetchError, DatabaseError } from '@/helper/errorHandling.js';

// 添加 enum 定义（在文件顶部的 imports 后面）
enum ChainType {
  ETH = 'eth',
  SOLANA = 'sol',
}

async function updateTokensData(): Promise<void> {
  try {
    // Fetch tokens from the database
    const tokens: Token[] = await prisma.token.findMany({
      where: { chain: 'sol' },
      orderBy: { created_at: 'desc' },
      select: {
        chain: true,
        token_address: true,
        created_at: true,
      },
    });
    console.log(`Found ${tokens.length} tokens in the database.`);

    // Build and interleave requests
    const requests = buildRequests(tokens);

    const proxyConfiguration = new ProxyConfiguration({
      proxyUrls: [process.env.PROXY_URL],
    });

    // Initialize PlaywrightCrawler
    const crawler = new PlaywrightCrawler({
      useSessionPool: true,
      persistCookiesPerSession: true,
      proxyConfiguration,
      requestHandlerTimeoutSecs: REQUEST_TIMEOUT,
      maxConcurrency: MAX_CONCURRENCY,
      launchContext: {
        launcher: firefox,
        launchOptions: {
          headless: true,
          ignoreHTTPSErrors: true,
        },
      },
      // Use preNavigationHooks to modify headers before navigation
      preNavigationHooks: [
        async ({ page, request, log }, gotoOptions) => {
          // Set up request interception
          await page.route('**', (route) => {
            const headers = {
              ...route.request().headers(),
              accept: 'application/json',
              'accept-encoding': 'gzip, deflate, br, zstd',
              'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
              referer: 'https://gmgn.ai',

              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
            };

            // Continue the request with modified headers
            route.continue({ headers });
          });
        },
      ],
      requestHandler: async ({ request, page }) => {
        const { token, type } = request.userData as {
          token: Token;
          type: RequestType;
        };
        try {
          const data = await fetchTokenData(page);

          // Add data validation
          if (!data) {
            throw new FetchError(
              `No data returned for token ${token.token_address}`,
            );
          }

          switch (type) {
            case 'stats':
              await updateTokenStatsInDatabase(token, data as TokenStatsData);
              console.log(`Token ${token.token_address} stats updated.`);
              break;
            case 'top_buys_stats':
              // Validate holder data structure
              if (!data.holders || typeof data.holders !== 'object') {
                throw new FetchError(
                  `Invalid holder data for token ${token.token_address}`,
                );
              }
              await updateTopBuysInDatabase(token, data.holders as HolderData);
              console.log(
                `Token ${token.token_address} top_buys_stats data updated.`,
              );
              break;
            default:
              throw new Error(`Unknown request type: ${type}`);
          }
        } catch (error) {
          // Add network error handling
          if (error.message?.includes('network not supported')) {
            console.log(
              `Skipping unsupported network for token ${token.token_address}`,
            );
            return;
          }

          if (error instanceof FetchError || error instanceof DatabaseError) {
            console.error(error.message);
          } else {
            console.error(
              `Unexpected error for token ${token.token_address}: ${error}`,
            );
          }
        }
      },
    });

    // Start crawling
    await crawler.run(requests);
    console.log('All token data updated.');
  } catch (error) {
    console.error(error);
    console.error(`Error updating token data: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

function buildRequests(tokens: Token[]) {
  const securityRequests = [];
  const statsRequests = [];
  const topBuysRequests = [];

  tokens.forEach((token) => {
    // 根据 token.chain 使用相应的链类型
    const chainType =
      token.chain === ChainType.ETH ? ChainType.ETH : ChainType.SOLANA;
    // 使用 token.chain 来确定正确的链
    statsRequests.push({
      url: `${BASE_URLS.stats}/${chainType}/${token.token_address}`,
      userData: { token, type: 'stats' },
    });
    topBuysRequests.push({
      url: `${BASE_URLS.topBuys}/${chainType}/${token.token_address}`,
      userData: { token, type: 'top_buys_stats' },
    });
  });

  // Interleave the requests
  const requests = interleaveArrays([
    securityRequests,
    statsRequests,
    topBuysRequests,
  ]);

  return requests;
}

function interleaveArrays(arrays: any[][]): any[] {
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  const result = [];
  for (let i = 0; i < maxLength; i++) {
    arrays.forEach((arr) => {
      if (i < arr.length) {
        result.push(arr[i]);
      }
    });
  }
  return result;
}

updateTokensData();

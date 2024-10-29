import { PlaywrightCrawlingContext } from 'crawlee';

export async function tokenInfoPump({
  request,
  page,
  response,
}: PlaywrightCrawlingContext) {
  console.log('request', request.url);

  const button = await page.getByRole('button', {
    name: `[I'm ready to pump]`,
  });
  if (button) {
    await button.click();
  }

  const websiteLink = await page
    .getByRole('link', {
      name: '[website]',
    })
    .getAttribute('href');
  const twitterLink = await page
    .getByRole('link', {
      name: '[twitter]',
    })
    .getAttribute('href');

  console.log('websiteLink', websiteLink, twitterLink);
}

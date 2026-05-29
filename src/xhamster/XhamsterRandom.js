import { load } from 'cheerio';
import { scrapeVideoPage } from './XhamsterGet.js';

const XHAMSTER = 'https://xhamster.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

export async function randomXhamster() {
    try {
        const response = await fetch(`${XHAMSTER}/newest`, { headers: { 'User-Agent': UA } });
        const html = await response.text();
        const $ = load(html);

        const videoLinks = $('div.thumb-list__item[data-video-id]')
            .map((_, el) => {
                const href = $(el).find("a[data-role='thumb-link']").attr('href');
                return href && href.includes('/videos/') ? href : null;
            })
            .get()
            .filter(Boolean);

        if (videoLinks.length === 0) return null;

        const randomUrl = videoLinks[Math.floor(Math.random() * videoLinks.length)];
        return await scrapeVideoPage(randomUrl);
    } catch (err) {
        console.error(err);
        return null;
    }
}

import { load } from 'cheerio';

const XHAMSTER = 'https://xhamster.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

/** Fetch the HLS master playlist and parse each quality variant into a sources array */
async function extractSources($) {
    const masterUrl = $('link[rel="preload"][as="fetch"][crossorigin]').attr('href');
    if (!masterUrl) return [];
    try {
        const resp = await fetch(masterUrl, { headers: { 'User-Agent': UA } });
        const m3u8 = await resp.text();
        const base = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);
        const lines = m3u8.split('\n').map(l => l.trim()).filter(Boolean);
        const sources = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXT-X-STREAM-INF:')) {
                const resMatch = lines[i].match(/RESOLUTION=(\d+x\d+)/);
                const segLine = lines[i + 1];
                if (segLine && !segLine.startsWith('#') && resMatch) {
                    const quality = segLine.split('.')[0]; // "144p", "720p", etc.
                    const url = segLine.startsWith('http') ? segLine : base + segLine;
                    sources.push({ quality, resolution: resMatch[1], url });
                }
            }
        }
        return sources;
    } catch {
        return [];
    }
}

export async function scrapeVideoPage(url) {
    const response = await fetch(url, { headers: { 'User-Agent': UA } });
    const html = await response.text();
    const $ = load(html);

    const raw = $('#initials-script').html();
    const initials = raw
        ? JSON.parse(raw.replace(/^window\.initials\s*=\s*/, '').replace(/;$/, ''))
        : null;

    const link = $("link[rel='canonical']").attr('href') || 'None';
    const slug = link.split('/')[4] || 'None';
    const title = $("meta[property='og:title']").attr('content') || 'None';
    const image = $("meta[property='og:image']").attr('content') || 'None';

    let duration = 'None';
    let views = 'None';

    const scripts = $('script').map((i, el) => $(el).html()).get().filter(Boolean);
    const videoScript = scripts.find(s => s.includes('"videoModel"') && s.includes('"duration"'));
    if (videoScript) {
        const durMatch = videoScript.match(/"duration"\s*:\s*(\d+)/);
        if (durMatch) duration = durMatch[1];
        const viewMatch = videoScript.match(/"views"\s*:\s*(\d+)/);
        if (viewMatch) views = viewMatch[1];
    }

    const rating = initials?.ratingComponent?.ratingModel?.value?.toString() || 'None';
    const publish = $('div.entity-info-container__date').attr('data-tooltip') || 'None';

    const tags = initials?.videoTagsComponent?.tags?.filter(t => t.isTag).map(t => t.name) || [];

    const sources = await extractSources($);

    return {
        success: true,
        data: {
            title: title.replace(/<[^>]*>/g, ''),
            id: slug,
            image,
            duration,
            views,
            rating,
            uploaded: publish,
            tags,
            source: link,
            sources,
        },
    };
}

export async function getXhamsterVideo(id) {
    try {
        const url = `${XHAMSTER}/videos/${id}`;
        return await scrapeVideoPage(url);
    } catch (err) {
        console.error(err);
        return null;
    }
}

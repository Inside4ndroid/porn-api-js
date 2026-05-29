import { load } from 'cheerio';

const XHAMSTER = 'https://xhamster.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

/** Format seconds to "HH:MM:SS" or "MM:SS" */
function formatDuration(seconds) {
    const s = seconds % 60;
    const m = Math.floor(seconds / 60) % 60;
    const h = Math.floor(seconds / 3600);
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Format raw view count to "1.3M views", "317.3K views", "100 views" */
function formatViews(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1)}K views`;
    return `${n} views`;
}

/** Extract the initials JSON from a page and return the parsed object */
function parseInitials(html) {
    const $ = load(html);
    const scriptContent = $('#initials-script').html() || '';
    if (!scriptContent) return null;
    try {
        const jsonStr = scriptContent.replace(/^window\.initials\s*=\s*/, '').replace(/;\s*$/, '');
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

/** Map a videoThumbProp entry to our normalized output shape */
function mapThumb(v) {
    const link = v.pageURL || '';
    // slug-based URLs: /videos/slug-xhXXXXX  →  id = last segment
    // numeric URLs:   /videos/title-12345678  →  id = last segment
    const segments = link.split('/');
    const id = segments[segments.length - 1] || String(v.id);
    // embed id is the hash part after last dash for slug URLs, or numeric id
    const embedId = id.includes('-') ? id.split('-').pop() : String(v.id);
    return {
        link,
        id,
        title: v.title || 'None',
        image: v.imageURL || v.thumbURL || 'None',
        duration: v.duration != null ? formatDuration(v.duration) : 'None',
        views: v.views != null ? formatViews(v.views) : 'None',
        video: embedId ? `${XHAMSTER}/embed/${embedId}` : 'None',
    };
}

async function fetchPage(url) {
    const response = await fetch(url, { headers: { 'User-Agent': UA } });
    return response.text();
}

async function scrapeSearchPage(url) {
    const html = await fetchPage(url);
    const initials = parseInitials(html);
    if (!initials) return [];

    // Search pages: initials.searchResult.videoThumbProps
    const thumbs = initials.searchResult?.videoThumbProps;
    if (Array.isArray(thumbs)) return thumbs.map(mapThumb);

    return [];
}

async function scrapeRelatedPage(url) {
    const html = await fetchPage(url);
    const initials = parseInitials(html);
    if (!initials) return [];

    // Video detail pages: look for related/recommended video list
    // Common keys: videoSectionComponent, recommendedVideos, relatedVideos
    for (const key of ['videoSectionComponent', 'recommendedVideos', 'relatedVideos', 'xRelatedVideos']) {
        const val = initials[key];
        if (val && Array.isArray(val.videoThumbProps)) return val.videoThumbProps.map(mapThumb);
        if (Array.isArray(val)) return val.map(mapThumb);
    }
    return [];
}

export async function searchXhamster(query, page = '1') {
    try {
        const q = query.replace(/\s/g, '+');
        const url = `${XHAMSTER}/search/${q}?page=${page}`;
        const results = await scrapeSearchPage(url);
        if (results.length === 0) return null;
        return { success: true, data: results, source: url };
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getRelatedXhamster(id) {
    try {
        const url = `${XHAMSTER}/videos/${id}`;
        const results = await scrapeRelatedPage(url);
        if (results.length === 0) return null;
        return { success: true, data: results, source: url };
    } catch (err) {
        console.error(err);
        return null;
    }
}


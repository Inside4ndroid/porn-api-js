# porn-api-js

Unofficial multi-provider adult video REST API built with Node.js and Express. Supports **EPorner** (via the official eporner API v2) and **XHamster** (via HTML scraping + embedded JSON state parsing).

---

## Interactive Docs

A full Swagger UI is available at `/docs` when the server is running.  
The raw OpenAPI 3.0 spec is served at `/swagger.json`.

---

## Endpoints

### EPorner — `/api/eporner/`

#### GET `/api/eporner/details/:id`

Returns full video metadata and all available MP4 source URLs.

| Parameter   | Type   | In    | Required | Default  | Description |
|-------------|--------|-------|----------|----------|-------------|
| `id`        | string | path  | ✅       | —        | EPorner video ID (e.g. `Nxm27jfWQ98`) |
| `thumbsize` | string | query | ❌       | `medium` | Thumbnail size: `small` (190×152), `medium` (427×240), `big` (640×360) |

**Response shape:**
```json
{
  "success": true,
  "data": {
    "title": "string",
    "id": "string",
    "image": "url",
    "duration": "12:34",
    "views": "1500000",
    "rating": "87",
    "uploaded": "2024-01-15",
    "tags": ["string"],
    "source": "https://www.eporner.com/embed/:id/",
    "sources": [
      { "quality": "1080p", "url": "https://..." },
      { "quality": "720p",  "url": "https://..." }
    ]
  }
}
```

---

#### GET `/api/eporner/search/:query`

Returns paginated video search results. Use `all` as the query to return all videos.

| Parameter   | Type    | In    | Required | Default  | Description |
|-------------|---------|-------|----------|----------|-------------|
| `query`     | string  | path  | ✅       | —        | Search string |
| `per_page`  | integer | query | ❌       | `30`     | Results per page (1–1000) |
| `page`      | integer | query | ❌       | `1`      | Page number (1–1000000) |
| `thumbsize` | string  | query | ❌       | `medium` | `small`, `medium`, `big` |
| `order`     | string  | query | ❌       | `latest` | `latest`, `longest`, `shortest`, `top-rated`, `most-popular`, `top-weekly`, `top-monthly` |
| `gay`       | string  | query | ❌       | `0`      | `0` excluded · `1` included · `2` only |
| `lq`        | string  | query | ❌       | `1`      | Low quality filter: `0` excluded · `1` included · `2` only |

**Response shape:**
```json
{
  "success": true,
  "data": [
    {
      "link": "url",
      "id": "string",
      "title": "string",
      "image": "url",
      "duration": "12:34",
      "views": "1500000",
      "video": "https://www.eporner.com/embed/:id/"
    }
  ],
  "page": 1,
  "total_pages": 50,
  "total_count": 1500
}
```

---

### XHamster — `/api/xhamster/`

#### GET `/api/xhamster/details/:id`

Scrapes an XHamster video page and returns full metadata plus all HLS stream sources per quality.

| Parameter | Type   | In   | Required | Description |
|-----------|--------|------|----------|-------------|
| `id`      | string | path | ✅       | Full video slug from the URL (e.g. `distracted-my-girlfriend-from-playing-with-my-dick-xhfrS3j`) |

**Response shape:**
```json
{
  "success": true,
  "data": {
    "title": "string",
    "id": "string",
    "image": "url",
    "duration": "02:52",
    "views": "12710594",
    "rating": "100",
    "uploaded": "2026-05-28 21:40:16 UTC",
    "tags": ["string"],
    "source": "https://xhamster.com/videos/:slug",
    "sources": [
      { "quality": "144p",  "resolution": "256x144",   "url": "https://video-cf.xhcdn.com/.../144p.h264.mp4.m3u8" },
      { "quality": "240p",  "resolution": "426x240",   "url": "https://video-cf.xhcdn.com/.../240p.h264.mp4.m3u8" },
      { "quality": "480p",  "resolution": "854x480",   "url": "https://video-cf.xhcdn.com/.../480p.h264.mp4.m3u8" },
      { "quality": "720p",  "resolution": "1280x720",  "url": "https://video-cf.xhcdn.com/.../720p.h264.mp4.m3u8" },
      { "quality": "1080p", "resolution": "1920x1080", "url": "https://video-cf.xhcdn.com/.../1080p.h264.mp4.m3u8" },
      { "quality": "2160p", "resolution": "3840x2160", "url": "https://video-cf.xhcdn.com/.../2160p.h264.mp4.m3u8" }
    ]
  }
}
```

> Sources are HLS `.m3u8` playlist segments — playable in any HLS-compatible player.

---

#### GET `/api/xhamster/search/:query`

Scrapes XHamster search results and returns video thumbnails with metadata.

| Parameter | Type    | In    | Required | Default | Description |
|-----------|---------|-------|----------|---------|-------------|
| `query`   | string  | path  | ✅       | —       | Search string (e.g. `bbw`) |
| `page`    | integer | query | ❌       | `1`     | Page number |

**Response shape:**
```json
{
  "success": true,
  "data": [
    {
      "link": "https://xhamster.com/videos/:slug",
      "id": "string",
      "title": "string",
      "image": "url",
      "duration": "02:52",
      "views": "317.3K views",
      "video": "https://xhamster.com/embed/:embedId"
    }
  ],
  "source": "https://xhamster.com/search/:query?page=1"
}
```

---

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInside4ndroid%2Feporner-api-js)


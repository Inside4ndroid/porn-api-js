export async function getRemovedIds() {
    try {
        const url = 'https://www.eporner.com/api/v2/video/removed/?format=json';
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

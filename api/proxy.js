const axios = require('axios');

// [캐싱 로직 추가]
const cache = new Map();
const CACHE_TTL = 2000; // 2초 캐시

async function fetchData(url, options) {
    try {
        const response = await axios({
            method: options.method || 'GET',
            url: url,
            data: options.data,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' },
            timeout: 8000 // 8초 타임아웃
        });
        return response.data;
    } catch (error) {
        console.error(`Fetch Error for ${url}:`, error.message);
        return null; // 에러 발생 시 null 반환
    }
}

module.exports = async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    const now = Date.now();
    const cached = cache.get(targetUrl);

    // 캐시가 있고, 2초가 지나지 않았다면 캐시된 데이터 반환
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return res.status(200).send(cached.data);
    }

    // 캐시가 없거나 만료되었으면 새로 요청
    const data = await fetchData(targetUrl, { method: req.method, data: req.body });

    if (data) {
        // 성공 시 캐시에 저장
        cache.set(targetUrl, { timestamp: now, data });
        return res.status(200).send(data);
    } else {
        // 실패 시 502 에러 반환
        return res.status(502).send('Failed to fetch data from upstream');
    }
};

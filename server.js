const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// JSON 요청 본문 처리
app.use(express.json());

// 정적 파일 제공 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '.')));

// 프록시 엔드포인트
app.all('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        // 내 서버 -> 거래소 직접 요청 (CORS 문제 없음, 속도 빠름)
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: {
                'User-Agent': 'Mozilla/5.0', // 일부 거래소 차단 방지
                'Content-Type': 'application/json'
            }
        });
        res.send(response.data);
    } catch (error) {
        console.error(`Proxy Error: ${targetUrl}`, error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

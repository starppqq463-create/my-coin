const axios = require('axios');

module.exports = async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/json'
            }
        });
        res.send(response.data);
    } catch (error) {
        console.error(`Proxy Error: ${targetUrl}`, error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
};

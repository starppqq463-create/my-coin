const axios = require('axios');

// 안정적인 공개 RPC 목록
const RPC_LIST = [
    'https://solana.publicnode.com', 
    'https://rpc.ankr.com/solana', 
    'https://api.mainnet-beta.solana.com'
];
let rpcIndex = 0;

module.exports = async (req, res) => {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const rpcUrl = RPC_LIST[rpcIndex];
    
    try {
        const response = await axios.post(rpcUrl, req.body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000 // 8초 타임아웃
        });

        rpcIndex = (rpcIndex + 1) % RPC_LIST.length; // 성공 시 다음 요청은 다른 노드로 분산
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Solana RPC proxy to ${rpcUrl} failed:`, error.message);
        rpcIndex = (rpcIndex + 1) % RPC_LIST.length; // 실패 시에도 다음 노드로 전환
        res.status(502).json({ error: 'Bad Gateway', message: `Failed to fetch from Solana RPC: ${error.message}` });
    }
};
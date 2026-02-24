const axios = require('axios');

// URL 상수
const UPBIT_TICKER_URL = 'https://api.upbit.com/v1/ticker?markets=';
const UPBIT_MARKETS_URL = 'https://api.upbit.com/v1/market/all?isDetails=false';
const BITHUMB_TICKER_URL = 'https://api.bithumb.com/public/ticker/ALL_KRW';
const OKX_TICKER_URL = 'https://www.okx.com/api/v5/market/tickers?instType=SPOT';
const HYPERLIQUID_TICKER_URL = 'https://api.hyperliquid.xyz/info';
const GATEIO_TICKER_URL = 'https://api.gateio.ws/api/v4/spot/tickers';
const EXCHANGE_RATE_URL = 'https://api.manana.kr/exchange/rate/KRW/KRW,USD.json';
const OKX_FUTURES_TICKER_URL = 'https://www.okx.com/api/v5/market/tickers?instType=SWAP';
const BINANCE_FUNDING_URL = 'https://fapi.binance.com/fapi/v1/premiumIndex';
const OKX_FUNDING_URL = 'https://www.okx.com/api/v5/public/funding-rate-current?instType=SWAP';

// [개선] 안정성을 위해 API 도메인 목록화
const BINANCE_DOMAINS = ['api.binance.com', 'api1.binance.com', 'api2.binance.com', 'api3.binance.com'];
const BINANCE_FUTURES_DOMAINS = ['fapi.binance.com', 'fapi1.binance.com', 'fapi2.binance.com', 'fapi3.binance.com'];
const BYBIT_DOMAINS = ['api.bybit.com', 'api.bytick.com'];
const OKX_DOMAINS = ['www.okx.com', 'aws.okx.com'];

// 캐시 저장소 및 유효 시간
const cache = { kimchi: null, funbi: null };
const CACHE_TTL = 2000; // 2초

// app.js에서 가져온 상수 및 함수 (서버 환경 최적화용)
const MAX_MARKETS_PER_REQUEST = 150;
const MAIN_SYMBOLS = [
  'BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'UNI', 'ATOM',
  'LTC', 'BCH', 'ETC', 'XLM', 'ALGO', 'NEAR', 'FIL', 'APT', 'ARB', 'OP', 'INJ', 'SUI', 'SEI',
  'TIA', 'STX', 'IMX', 'RUNE', 'AAVE', 'MKR', 'CRV', 'SNX', 'SAND', 'MANA', 'AXS', 'THETA',
  'FTM', 'HBAR', 'VET', 'ICP', 'GRT', 'RNDR', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'SHIB',
  'TRX', 'BSV', 'EOS', 'XTZ', 'KAVA', 'ZEC', 'DASH', 'COMP', 'YFI', 'SUSHI', '1INCH',
  'LDO', 'ENS', 'BLUR', 'PIXEL', 'STRK', 'W', 'JUP', 'PYTH', 'JTO', 'DYM', 'TNSR', 'PORTAL',
  'ORDI', 'SATS', 'RATS', 'MOVR', 'KSM', 'CELO', 'ONE', 'ZIL', 'FLOW', 'KLAY',
  'WAVES', 'CHZ', 'ENJ', 'BAT', 'ZRX', 'OMG', 'SKL', 'ANKR', 'C98', 'GALA', 'APE', 'GMT',
  'AR', 'STRAX', 'LSK', 'SC', 'SCRL', 'STEEM', 'STORJ', 'DGB', 'BTG', 'QTUM', 'ICX', 'KAIA',
  'MEW', 'TURBO', 'ATH', 'ZK', 'BLAST', 'UXLINK', 'AVAIL', 'BANANA', 'RENDER', 'LISTA',
  'ZETA', 'OMNI', 'SAGA', 'ENA', 'ETHFI', 'AXL', 'MANTA', 'XAI', 'AI', 'NFP', 'ACE', 'GLMR', 'CRO', 'DOOD',
  'VANRY', 'MEME', 'TOKEN', 'NTRN', 'BIGTIME', 'HIFI', 'CYBER', 'MAV', 'EDU', 'MINA',
  'MASK', 'KDA', 'JOE', 'ACH', 'FXS', 'BNT', 'BAL', 'REN', 'NU', 'PDA', 'PCI', 'MED',
  'AERGO', 'ORBS', 'TFUEL', 'AMO', 'ELF', 'KNC', 'LRC', 'GLM', 'WAXP', 'POWR', 'SNT', 'CVC',
  'MTL', 'IOST', 'NMR', 'RLC', 'UOS', 'BEL', 'OBSR', 'POLA', 'ADP', 'GHX', 'CBK', 'MVC',
  'BLY', 'BIOT', 'GRACY', 'OXT', 'MAPO', 'AQT', 'WIKEN', 'CTSI', 'LPT', 'PUNDIX', 'CELR',
  'BFC', 'ALICE', 'OGN', 'CTC', 'CKB', 'SXP', 'COS', 'EL', 'HIVE', 'XPR', 'EGG', 'BORA',
  'ARPA', 'FCT2', 'MOG', 'BRETT', 'POPCAT', 'NEIRO', 'DEGEN', 'TOSHI', 'BOME', 'MOTHER',
  'ARKM', 'ALT', 'LAYER', 'ID', 'STG', 'ASTR', 'PENDLE', 'GLMR', 'ONDO', 'POL', 'EIGEN', 'BEAM',
  'ZRO', 'IO', 'GRASS', 'DRIFT', 'CLOUD', 'SAFE', 'AEVO', 'G', 'TAO'
];

function buildMarketBatch(allMarkets) {
    const allMarketsSet = new Set(allMarkets);
    const orderedMarkets = [];
    for (const symbol of MAIN_SYMBOLS) {
        const market = `KRW-${symbol}`;
        if (allMarketsSet.has(market)) {
            orderedMarkets.push(market);
            allMarketsSet.delete(market);
        }
    }
    orderedMarkets.push(...Array.from(allMarketsSet));
    return orderedMarkets.slice(0, MAX_MARKETS_PER_REQUEST);
}

// 서버 내에서 사용할 데이터 요청 함수
async function fetchJson(url, options = {}, retries = 1) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await axios({
                method: options.method || 'GET',
                url: `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, // 캐시 방지
                data: options.data,
                headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json', 'Accept': 'application/json' },
                timeout: 8000 // 8초 타임아웃
            });
            return response.data;
        } catch (error) {
            if (i === retries) {
                console.error(`[API] Fetch failed after ${retries + 1} attempts for ${url}: ${error.message}`);
                return null;
            }
            await new Promise(res => setTimeout(res, 500)); // 재시도 전 0.5초 대기
        }
    }
}

// 각 거래소 데이터 가져오는 함수들 (app.js에서 이동)
async function getExchangeRate() {
    const data = await fetchJson(EXCHANGE_RATE_URL);
    const item = Array.isArray(data) ? data.find(d => d.name === 'USDKRW=X') : null;
    return (item && item.rate) ? item.rate : 1350;
}
async function getUpbitMarkets() {
    const markets = await fetchJson(UPBIT_MARKETS_URL);
    return markets ? markets.filter(m => m.market.startsWith('KRW-')).map(m => m.market) : [];
}
async function getUpbitTickers(markets) {
    if (!markets || !markets.length) return [];
    return await fetchJson(UPBIT_TICKER_URL + markets.join(',')); // fetchJson이 캐시 방지 처리
}
async function getBithumbTickers() {
    const res = await fetchJson(BITHUMB_TICKER_URL);
    if (!res || !res.data) return {};
    return Object.keys(res.data).reduce((acc, key) => {
        if (key !== 'date') acc[key] = parseFloat(res.data[key].closing_price);
        return acc;
    }, {});
}
async function getBinanceTickers() {
    for (const domain of BINANCE_DOMAINS) {
        const list = await fetchJson(`https://${domain}/api/v3/ticker/24hr`, {}, 0); // 도메인별 1회 시도
        if (list && Array.isArray(list)) {
            return list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
                acc[t.symbol.replace('USDT', '')] = { price: parseFloat(t.lastPrice), change: parseFloat(t.priceChangePercent), volume: parseFloat(t.quoteVolume) };
                return acc;
            }, {});
        }
    }
    console.error(`[API] All Binance spot domains failed.`);
    return {};
}
async function getBybitTickers() {
    for (const domain of BYBIT_DOMAINS) {
        const res = await fetchJson(`https://${domain}/v5/market/tickers?category=spot`, {}, 0);
        if (res && res.result && res.result.list) {
            return res.result.list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
                acc[t.symbol.replace('USDT', '')] = parseFloat(t.lastPrice);
                return acc;
            }, {});
        }
    }
    console.error(`[API] All Bybit spot domains failed.`);
    return {};
}
async function getOkxTickers() {
    for (const domain of OKX_DOMAINS) {
        const res = await fetchJson(`https://${domain}/api/v5/market/tickers?instType=SPOT`, {}, 0);
        if (res && res.data) {
            return res.data.filter(t => t.instId.endsWith('-USDT')).reduce((acc, t) => {
                acc[t.instId.replace('-USDT', '')] = parseFloat(t.last);
                return acc;
            }, {});
        }
    }
    console.error(`[API] All OKX spot domains failed.`);
    return {};
}
async function getHyperliquidTickers() {
    const combined = {};
    try {
        const spotRes = await fetchJson(HYPERLIQUID_TICKER_URL, { method: 'POST', data: { type: 'metaAndAssetCtxs' } });
        if (Array.isArray(spotRes) && spotRes.length >= 2 && spotRes[0] && Array.isArray(spotRes[0].universe) && Array.isArray(spotRes[1])) {
            const universe = spotRes[0].universe;
            const ctxs = spotRes[1];
            universe.forEach((u, i) => {
                const ctx = ctxs[i];
                if (u.name && ctx) {
                    if (!combined[u.name]) combined[u.name] = {};
                    combined[u.name].spot = parseFloat(ctx.oraclePx);
                    combined[u.name].funding = parseFloat(ctx.funding);
                }
            });
        }
    } catch (e) { /* 에러는 fetchJson에서 로깅 */ }

    try {
        const perpRes = await fetchJson(HYPERLIQUID_TICKER_URL, { method: 'POST', data: { type: 'allMids' } });
        if (perpRes) {
            for (const [key, val] of Object.entries(perpRes)) {
                if (!combined[key]) combined[key] = {};
                combined[key].perp = parseFloat(val);
            }
        }
    } catch (e) { /* 에러는 fetchJson에서 로깅 */ }
    return combined;
}
async function getGateioTickers() {
    const list = await fetchJson(GATEIO_TICKER_URL);
    if (!list) return {};
    return list.filter(t => t.currency_pair.endsWith('_USDT')).reduce((acc, t) => {
        acc[t.currency_pair.replace('_USDT', '')] = parseFloat(t.last);
        return acc;
    }, {});
}
async function getBinanceFuturesTickers() {
    for (const domain of BINANCE_FUTURES_DOMAINS) {
        const list = await fetchJson(`https://${domain}/fapi/v1/ticker/24hr`, {}, 0);
        if (list && Array.isArray(list)) return list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
            acc[t.symbol.replace('USDT', '')] = { price: parseFloat(t.lastPrice) };
            return acc;
        }, {});
    }
    console.error(`[API] All Binance futures domains failed.`);
    return {};
}
async function getBinanceFundingRates() {
    for (const domain of BINANCE_FUTURES_DOMAINS) {
        const list = await fetchJson(`https://${domain}/fapi/v1/premiumIndex`, {}, 0);
        if (list && Array.isArray(list)) return list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
            acc[t.symbol.replace('USDT', '')] = {
                funding: parseFloat(t.lastFundingRate),
                nextFundingTime: parseInt(t.nextFundingTime)
            };
            return acc;
        }, {});
    }
    return {};
}
async function getBybitFuturesTickers() {
    for (const domain of BYBIT_DOMAINS) {
        const res = await fetchJson(`https://${domain}/v5/market/tickers?category=linear`, {}, 0);
        if (res && res.result && res.result.list) {
            return res.result.list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
                acc[t.symbol.replace('USDT', '')] = {
                    price: parseFloat(t.lastPrice),
                    funding: parseFloat(t.fundingRate),
                    nextFundingTime: parseInt(t.nextFundingTime)
                };
                return acc;
            }, {});
        }
    }
    console.error(`[API] All Bybit futures domains failed.`);
    return {};
}
async function getOkxFuturesTickers() {
    for (const domain of OKX_DOMAINS) {
        const res = await fetchJson(`https://${domain}/api/v5/market/tickers?instType=SWAP`, {}, 0);
        if (res && res.data) {
            return res.data.filter(t => t.instId.endsWith('-USDT-SWAP')).reduce((acc, t) => {
                acc[t.instId.replace('-USDT-SWAP', '')] = { price: parseFloat(t.last) };
                return acc;
            }, {});
        }
    }
    console.error(`[API] All OKX futures domains failed.`);
    return {};
}
async function getOkxFundingRates() {
    for (const domain of OKX_DOMAINS) {
        const res = await fetchJson(`https://${domain}/api/v5/public/funding-rate-current?instType=SWAP`, {}, 0);
        if (res && res.data) {
            return res.data.filter(t => t.instId.endsWith('-USDT-SWAP')).reduce((acc, t) => {
                acc[t.instId.replace('-USDT-SWAP', '')] = {
                    funding: parseFloat(t.fundingRate),
                    nextFundingTime: parseInt(t.fundingTime)
                };
                return acc;
            }, {});
        }
    }
    console.error(`[API] All OKX funding domains failed.`);
    return {};
}
async function getBitgetFuturesTickers() {
    const res = await fetchJson('https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES');
    if (!res || !res.data) return {};
    return res.data.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
        acc[t.symbol.replace('USDT', '')] = {
            price: parseFloat(t.lastPr),
            funding: parseFloat(t.fundingRate),
            nextFundingTime: parseInt(t.nextFundingTime)
        };
        return acc;
    }, {});
}
async function getGateioFuturesTickers() {
    const list = await fetchJson('https://api.gateio.ws/api/v4/futures/usdt/tickers');
    if (!list) return {};
    return list.filter(t => t.contract.endsWith('_USDT')).reduce((acc, t) => {
        acc[t.contract.replace('_USDT', '')] = {
            price: parseFloat(t.last),
            funding: parseFloat(t.funding_rate),
            nextFundingTime: parseInt(t.funding_next_apply) * 1000
        };
        return acc;
    }, {});
}
async function getBitgetTickers() {
    const res = await fetchJson('https://api.bitget.com/api/v2/spot/market/tickers');
    if (!res || !res.data) return {};
    return res.data.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
        acc[t.symbol.replace('USDT', '')] = parseFloat(t.lastPr);
        return acc;
    }, {});
}

// 메인 핸들러
module.exports = async (req, res) => {
    const now = Date.now();
    // 캐시가 유효하면 캐시된 데이터 반환
    if (cache.kimchi && (now - cache.kimchiTimestamp < CACHE_TTL)) {
        res.setHeader('X-Vercel-Cache', 'HIT');
        return res.status(200).json(cache.kimchi);
    }

    try {
        // 1. 업비트 전체 마켓 목록을 먼저 가져옴
        const allUpbitMarkets = await getUpbitMarkets();
        const upbitMarketBatch = buildMarketBatch(allUpbitMarkets);

        // 2. 모든 거래소 데이터를 병렬로 요청
        const results = await Promise.allSettled([
            getExchangeRate(),
            getUpbitTickers(upbitMarketBatch),
            getBithumbTickers(),
            getBinanceTickers(),
            getBybitTickers(),
            getOkxTickers(),
            getBitgetTickers(),
            getGateioTickers(),
            getHyperliquidTickers(),
            getBinanceFuturesTickers(),
            getBybitFuturesTickers(),
            getOkxFuturesTickers(),
            getBitgetFuturesTickers(),
            getGateioFuturesTickers(),
            getBinanceFundingRates(), // 펀딩비 추가
            getOkxFundingRates()      // 펀딩비 추가
        ]);

        const getValue = (result, defaultValue) => (result.status === 'fulfilled' && result.value !== null) ? result.value : defaultValue;

        // 최종 데이터 취합
        const allData = {
            rate: getValue(results[0], 1350),
            upbitTickers: getValue(results[1], []),
            bithumbMap: getValue(results[2], {}),
            binanceMap: getValue(results[3], {}),
            bybitMap: getValue(results[4], {}),
            okxMap: getValue(results[5], {}),
            bitgetMap: getValue(results[6], {}),
            gateMap: getValue(results[7], {}),
            hyperliquidMap: getValue(results[8], {}),
            binanceFuturesMap: getValue(results[9], {}),
            bybitFuturesMap: getValue(results[10], {}),
            okxFuturesMap: getValue(results[11], {}),
            bitgetFuturesMap: getValue(results[12], {}),
            gateioFuturesMap: getValue(results[13], {})
        };

        // 펀딩비 데이터 병합
        const binanceFunding = getValue(results[14], {});
        const okxFunding = getValue(results[15], {});

        for (const symbol in binanceFunding) {
            if (allData.binanceFuturesMap[symbol]) {
                allData.binanceFuturesMap[symbol].funding = binanceFunding[symbol].funding;
                allData.binanceFuturesMap[symbol].nextFundingTime = binanceFunding[symbol].nextFundingTime;
            }
        }
        for (const symbol in okxFunding) {
            if (allData.okxFuturesMap[symbol]) {
                allData.okxFuturesMap[symbol].funding = okxFunding[symbol].funding;
                allData.okxFuturesMap[symbol].nextFundingTime = okxFunding[symbol].nextFundingTime;
            }
        }

        cache.kimchi = allData;
        cache.kimchiTimestamp = now;

        res.setHeader('X-Vercel-Cache', 'MISS');
        res.status(200).json(allData);
    } catch (error) {
        console.error('[API] Main handler failed:', error);
        res.status(500).json({ error: 'Failed to fetch all exchange data.' });
    }
};
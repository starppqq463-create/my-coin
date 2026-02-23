(function () {
  'use strict';

  const UPBIT_TICKER_URL = 'https://api.upbit.com/v1/ticker?markets=';
  const UPBIT_MARKETS_URL = 'https://api.upbit.com/v1/market/all?isDetails=false';
  const BITHUMB_TICKER_URL = 'https://api.bithumb.com/public/ticker/ALL_KRW';
  const BINANCE_TICKER_URL = 'https://api.binance.com/api/v3/ticker/24hr';
  const BYBIT_TICKER_URL = 'https://api.bybit.com/v5/market/tickers?category=spot';
  const OKX_TICKER_URL = 'https://www.okx.com/api/v5/market/tickers?instType=SPOT';
  const HYPERLIQUID_TICKER_URL = 'https://api.hyperliquid.xyz/info';
  const GATEIO_TICKER_URL = 'https://api.gateio.ws/api/v4/spot/tickers';
  const EXCHANGE_RATE_URL = 'https://api.manana.kr/exchange/rate/KRW/KRW,USD.json';
  const BINANCE_FUTURES_TICKER_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr';
  const BYBIT_FUTURES_TICKER_URL = 'https://api.bybit.com/v5/market/tickers?category=linear';
  const OKX_FUTURES_TICKER_URL = 'https://www.okx.com/api/v5/market/tickers?instType=SWAP';
  const BINANCE_FUNDING_URL = 'https://fapi.binance.com/fapi/v1/premiumIndex';
  const OKX_FUNDING_URL = 'https://www.okx.com/api/v5/public/funding-rate-current?instType=SWAP';
  
  // CORS 우회용 프록시 후보군 (순차적 시도)
  // 고래 추적 설정
  const WHALE_THRESHOLD_USD = 2000; // 100만 달러 이상 감지
  const PROXY_CANDIDATES = [
    url => '/proxy?url=' + encodeURIComponent(url), // 1. 내 서버 (백엔드 구축 시 최우선 사용)
    url => '/api/proxy?url=' + encodeURIComponent(url), // 1. Vercel API 경로 (기본값)
    url => 'https://corsproxy.io/?' + encodeURIComponent(url),
    url => 'https://api.allorigins.win/get?url=' + encodeURIComponent(url),
    url => 'https://thingproxy.freeboard.io/fetch/' + url,
    url => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url)
  ];
  // POST 요청을 지원하는 프록시 목록
  const POST_SUPPORTING_PROXIES = [
    PROXY_CANDIDATES[0], // 내 서버
    PROXY_CANDIDATES[1], // corsproxy.io
    PROXY_CANDIDATES[0], // Vercel API
    PROXY_CANDIDATES[1]  // corsproxy.io
  ];

  async function fetchProxy(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20초 타임아웃

    // POST 요청은 현재 corsproxy.io에만 의존합니다.
    // 이 단일 의존성이 간헐적 실패의 원인이므로, 아래 getHyperliquidTickers 함수에서
    // 요청 방식을 변경하여 안정성을 보강합니다.
    const candidates = options.method === 'POST'
      ? POST_SUPPORTING_PROXIES
      : PROXY_CANDIDATES;

    for (const proxyFn of candidates) {
      try {
        const fetchOptions = {
          signal: controller.signal,
          ...options
        };
        const res = await fetch(proxyFn(url), fetchOptions);
        if (!res.ok) throw new Error(res.status);
        clearTimeout(timeoutId);
        
        let data = await res.json();
        // 프록시가 응답을 'contents'로 감싸서 보내는 경우 처리 (공통 적용)
        if (data && data.contents && typeof data.contents === 'string') {
            try { data = JSON.parse(data.contents); } catch (e) {}
        }
        return data;
      } catch (e) {
        console.warn(`Proxy failed for ${url} with proxy ${proxyFn(url)}:`, e);
      }
    }
    throw new Error('All proxies failed for ' + url);
  }

  /** 메인 코인 우선 순서 (업비트 KRW 상장 심볼 기준, 시총 상위 150개 근사치) */
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

  const MAX_MARKETS_PER_REQUEST = 150; // 150개 요청을 위해 확장

  /** 코인 로고: simplr-sh/coin-logos (16,000+ 코인, CoinGecko ID 기반) */
  const COIN_IMG_CDN = 'https://cdn.jsdelivr.net/gh/simplr-sh/coin-logos/images';
  /** CDN에 없는 코인들을 위한 직접 이미지 주소 (빗썸/업비트 원본 사용) */
  const COIN_IMG_CUSTOM = {
    '0G': 'https://static.upbit.com/logos/0G.png',
    '2Z': 'https://static.upbit.com/logos/2Z.png',
    'A': 'https://static.upbit.com/logos/A.png',
    'TRUMP': 'https://static.upbit.com/logos/TRUMP.png',
    'BIO': 'https://static.upbit.com/logos/BIO.png',
    'F': 'https://static.upbit.com/logos/F.png',
    'FG': 'https://static.upbit.com/logos/FG.png',
    'ANIME': 'https://static.upbit.com/logos/ANIME.png',
    'CTC': 'https://static.upbit.com/logos/CTC.png',
    'DOOD': 'https://static.upbit.com/logos/DOOD.png',
    'ERA': 'https://static.upbit.com/logos/ERA.png',
    'G': 'https://static.upbit.com/logos/G.png',
    'KAITO': 'https://static.upbit.com/logos/KAITO.png',
    'LAYER': 'https://static.upbit.com/logos/LAYER.png',
    'NXPC': 'https://static.upbit.com/logos/NXPC.png',
    'PENGU': 'https://static.upbit.com/logos/PENGU.png',
    'TREE': 'https://static.upbit.com/logos/TREE.png',
    'WET': 'https://static.upbit.com/logos/WET.png'
  };
  const COIN_GECKO_ID = {
    BTC: 'bitcoin', ETH: 'ethereum', XRP: 'ripple', SOL: 'solana', ADA: 'cardano', DOGE: 'dogecoin', GLMR: 'moonbeam',
    AVAX: 'avalanche-2', DOT: 'polkadot', LINK: 'chainlink', MATIC: 'polygon', UNI: 'uniswap', ATOM: 'cosmos',
    LTC: 'litecoin', BCH: 'bitcoin-cash', ETC: 'ethereum-classic', XLM: 'stellar', ALGO: 'algorand',
    NEAR: 'near', FIL: 'filecoin', APT: 'aptos', ARB: 'arbitrum', OP: 'optimism', INJ: 'injective-protocol',
    SUI: 'sui', SEI: 'sei-network', TIA: 'celestia', STX: 'blockstack', IMX: 'immutable-x', RUNE: 'thorchain',
    AAVE: 'aave', MKR: 'maker', CRV: 'curve-dao-token', SNX: 'synthetix-network-token', SAND: 'the-sandbox', MANA: 'decentraland',
    AXS: 'axie-infinity', THETA: 'theta-token', FTM: 'fantom', HBAR: 'hedera-hashgraph', VET: 'vechain',
    ICP: 'internet-computer', GRT: 'the-graph', RNDR: 'render-token', PEPE: 'pepe', WIF: 'dogwifcoin',
    BONK: 'bonk', FLOKI: 'floki', SHIB: 'shiba-inu', TRX: 'tron', BSV: 'bitcoin-cash-sv', EOS: 'eos',
    XTZ: 'tezos', KAVA: 'kava', ZEC: 'zcash', DASH: 'dash', COMP: 'compound-governance-token',
    YFI: 'yearn-finance', SUSHI: 'sushi', '1INCH': '1inch', LDO: 'lido-dao', ENS: 'ethereum-name-service',
    BLUR: 'blur', PIXEL: 'pixels', STRK: 'starknet', W: 'wormhole', JUP: 'jupiter-exchange-solana',
    PYTH: 'pyth-network', JTO: 'jito-governance-token', DYM: 'dymension', TNSR: 'tensor', PORTAL: 'portal',
    LAYER: 'layerai', ALT: 'altlayer', ARKM: 'arkham', STG: 'stargate-finance', ASTR: 'astar', ID: 'space-id',
    ONDO: 'ondo-finance', PENDLE: 'pendle', POL: 'polygon-ecosystem-token', EIGEN: 'eigenlayer',
    ZRO: 'layerzero', IO: 'io-net', GRASS: 'grass', DRIFT: 'drift-protocol', CLOUD: 'sanctum-cloud',
    SAFE: 'safe', AEVO: 'aevo', G: 'gravity', TAO: 'bittensor', BEAM: 'beam-2',
    USDT: 'tether', USD1: 'tether', USDC: 'usd-coin', USDE: 'ethena-usde', AERO: 'aerodrome-finance', ANIME: 'anime',
    KAITO: 'kaito', MOCA: 'mocaverse', MOVE: 'movement', NXPC: 'nexpace', TRUMP: 'official-trump',
    WLD: 'worldcoin-wld', WLFI: 'world-liberty-financial', '0G': '0g-protocol', TREE: 'tree', WET: 'wet', '2Z': '2z', DOOD: 'doodles', A: 'a', BIO: 'bio-protocol', F: 'f', FG: 'fg',
    ORDI: 'ordinals', SATS: '1000sats-ordinals', RATS: 'rats', MOVR: 'moonriver', KSM: 'kusama', CELO: 'celo',
    ONE: 'harmony', ZIL: 'zilliqa', FLOW: 'flow', KLAY: 'klay-token', WAVES: 'waves', CHZ: 'chiliz',
    ENJ: 'enjincoin', BAT: 'basic-attention-token', ZRX: '0x', OMG: 'omisego', SKL: 'skale',
    ANKR: 'ankr', C98: 'coin98', GALA: 'gala', APE: 'apecoin', GMT: 'stepn', AR: 'arweave',
    STRAX: 'stratis', LSK: 'lisk', SC: 'siacoin', STEEM: 'steem', STORJ: 'storj', DGB: 'digibyte',
    BTG: 'bitcoin-gold', QTUM: 'qtum', ICX: 'icon',
    AERGO: 'aergo', ORBS: 'orbs', TFUEL: 'theta-fuel', AMO: 'amo', ELF: 'aelf', KNC: 'kyber-network-crystal',
    LRC: 'loopring', GLM: 'golem', WAXP: 'wax', POWR: 'power-ledger', SNT: 'status', CVC: 'civic',
    MTL: 'metal', IOST: 'iostoken', NMR: 'numeraire', RLC: 'iexec-rlc', UOS: 'ultra', AWE: 'awe',
    BEL: 'bella-protocol', OBSR: 'observer', POLA: 'polaris-shared', ADP: 'adappter-token', GHX: 'gamercoin',
    CBK: 'cobak-token', MVC: 'mileverse', BLY: 'blocery', BIOT: 'biopassport', GRACY: 'gracy', OXT: 'orchid-protocol', FCT2: 'firmachain',
    MAPO: 'map-protocol', AQT: 'alpha-quark-token', WIKEN: 'project-with', CTSI: 'cartesi', LPT: 'livepeer',
    PUNDIX: 'pundi-x-2', CELR: 'celer-network', BFC: 'bifrost', ALICE: 'my-neighbor-alice', OGN: 'origin-protocol',
    CTC: 'creditcoin', CKB: 'nervos-network', SCRL: 'scroll', MEV: 'meverse', SXP: 'swipe', COS: 'contentos', CRO: 'crypto-com-chain',
    EL: 'elysia', HIVE: 'hive', XPR: 'proton', EGG: 'nestegg-coin', BORA: 'bora', ARPA: 'arpa',
    '1000SATS': '1000sats-ordinals', '1000RATS': '1000rats', '1000BONK': '1000bonk', '1000PEPE': 'pepe',
    MOG: 'mog-coin', MOGCOIN: 'mog-coin', BRETT: 'based-brett', POPCAT: 'popcat', NEIRO: 'neiro-ethereum',
    DEGEN: 'degen-base', TOSHI: 'toshi', BOME: 'book-of-meme', MOTHER: 'mother-iggy', ACT: 'act-2-the-peanut-prophecy',
    KAIA: 'kaia', MEW: 'cat-in-a-dogs-world', TURBO: 'turbo', ATH: 'aethir', ZK: 'zksync', BLAST: 'blast',
    UXLINK: 'uxlink', AVAIL: 'avail', BANANA: 'banana-gun', RENDER: 'render-token', LISTA: 'lista-dao',
    ZETA: 'zetachain', OMNI: 'omni-network', SAGA: 'saga-2', ENA: 'ethena', ETHFI: 'ether-fi', AXL: 'axelar',
    MANTA: 'manta-network', XAI: 'xai-blockchain', AI: 'sleepless-ai', NFP: 'nfprompt', ACE: 'fusionist',
    VANRY: 'vanar-chain', MEME: 'memecoin', TOKEN: 'tokenfi', NTRN: 'neutron-3', BIGTIME: 'big-time',
    HIFI: 'hifi-finance', CYBER: 'cyberconnect', MAV: 'maverick-protocol', EDU: 'edu-coin', MINA: 'mina-protocol',
    MASK: 'mask-network', KDA: 'kadena', JOE: 'joe', ACH: 'alchemy-pay', FXS: 'frax-share', BNT: 'bancor',
    BAL: 'balancer', REN: 'ren', NU: 'nu-cypher', PDA: 'playdapp', PCI: 'paycoin', MED: 'medibloc',
    MOC: 'mossland', STPT: 'standard-tokenization-protocol', MVL: 'mass-vehicle-ledger', META: 'metadium',
    HUM: 'humanscape', TON: 'tokamak-network', UPP: 'sentinel-protocol', IQ: 'everipedia', TT: 'thunder-token',
    MBL: 'moviebloc', AHT: 'aha-token', QKC: 'quarkchain', DKA: 'dka', SBD: 'steem-dollars', ARDR: 'ardor',
    ARK: 'ark', XEM: 'nem', NEO: 'neo', GAS: 'gas', ONT: 'ontology', ONG: 'ontology-gas', VTHO: 'vethor-token',
    EGLD: 'elrond-erd-2', IOTA: 'iota', HUNT: 'hunt-token', BOBA: 'boba-network', AGLD: 'adventure-gold',
    FIO: 'fio-protocol', JST: 'just', LOOM: 'loom-network', POLY: 'polymath', SOLVE: 'solve', SUN: 'sun-token'
  };
  const COIN_IMG_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="14" fill="%23e5e7eb"/%3E%3Ctext x="16" y="20" text-anchor="middle" font-size="12" fill="%236b7280"%3E?%3C/text%3E%3C/svg%3E';
  function getCoinIconUrl(symbol) {
    if (COIN_IMG_CUSTOM[symbol]) return COIN_IMG_CUSTOM[symbol];
    var id = COIN_GECKO_ID[symbol] || symbol.toLowerCase();
    return COIN_IMG_CDN + '/' + id + '/small.png';
  }

  /** 심볼 → 한글/영문 이름 (표시용) */
  const COIN_NAMES = {
    BTC: '비트코인', ETH: '이더리움', XRP: '리플', SOL: '솔라나', ADA: '에이다', DOGE: '도지코인',
    AVAX: '아발란체', DOT: '폴카닷', LINK: '체인링크', MATIC: '폴리곤', UNI: '유니스왑', ATOM: '코스모스',
    LTC: '라이트코인', BCH: '비트코인캐시', ETC: '이더리움클래식', XLM: '스텔라루멘', ALGO: '알고랜드',
    NEAR: '니어', FIL: '파일코인', APT: '앱토스', ARB: '아비트럼', OP: '옵티미즘', INJ: '인젝티브',
    SUI: '수이', SEI: '세이', TIA: '셀레스티아', STX: '스택스', IMX: '이뮤터블엑스', RUNE: '토르체인',
    AAVE: '에이브', MKR: '메이커', CRV: '커브', SNX: '신세틱스', SAND: '샌드박스', MANA: '디센트럴랜드',
    AXS: '엑시인피니티', THETA: '쎄타', FTM: '팬텀', HBAR: '헤데라', VET: '베체인', ICP: '인터넷컴퓨터',
    GRT: '더그래프', RNDR: '렌더', PEPE: '페페', WIF: '독', BONK: '봉크', FLOKI: '플로키', SHIB: '시바이누',
    TRX: '트론', BSV: '비트코인SV', EOS: '이오스', XTZ: '테조스', KAVA: '카바', ZEC: '지캐시', CRO: '크로노스',
    DASH: '대시', COMP: '컴파운드', YFI: '연파이낸스', SUSHI: '스시스왑', '1INCH': '1인치',
    LDO: '리도', ENS: '이더리움네임서비스', BLUR: '블러', PIXEL: '픽셀', STRK: '스타크넷', W: '웜',
    JUP: '쥬피터', PYTH: '피스', JTO: '제이토', DYM: '다이멘션', TNSR: '텐서', PORTAL: '포털',
    ORDI: '오디', SATS: '새츠', RATS: '랫츠', MOVR: '문빔', KSM: '쿠사마', CELO: '셀로',
    ONE: '하모니', ZIL: '질리카', FLOW: '플로우', KLAY: '클레이튼', WAVES: '웨이브', CHZ: '칠리즈',
    ENJ: '엔진코인', BAT: '베이직어텐션', ZRX: '제로엑스', OMG: '오미세고', SKL: '스킬', ANKR: '앵커',
    C98: '코인98', GALA: '갈라', APE: '에이프코인', GMT: '스테픈', AR: '아르위브', STRAX: '스트라티스',
    LSK: '리스크', SC: '시아코인', STEEM: '스팀', STORJ: '스토리지', DGB: '디지바이트', BTG: '비트코인골드',
    QTUM: '퀀텀', ICX: '아이콘',
    AERGO: '아르고', ORBS: '오브스', TFUEL: '쎄타퓨엘', AMO: '아모', ELF: '엘프', KNC: '카이버',
    LRC: '루프링', GLM: '골렘', WAXP: '왁스', POWR: '파워렛저', SNT: '스테이터스', CVC: '시빅',
    MTL: '메탈', IOST: '이오스트', NMR: '뉴메레르', RLC: '아이엑스이크', UOS: '울트라', BEL: '벨라',
    OBSR: '옵저버', POLA: '폴라리스', ADP: '어댑터', GHX: '게이머코인', CBK: '코박', MVC: '마일버스',
    BLY: '블로서리', BIOT: '바이옵', GRACY: '그레이시', OXT: '오키드', MAPO: '맵프로토콜',
    AQT: '알파쿼크', WIKEN: '위켄', CTSI: '카르테시', LPT: '라이브피어', PUNDIX: '펀디엑스',
    CELR: '셀러네트워크', BFC: '비프로스트', ALICE: '앨리스', OGN: '오리진', CTC: '크레딧코인',
    CKB: '너보스', SCRL: '스크롤', MEV: '미버스', SXP: '스와이프', COS: '콘텐토스', EL: '엘리시아',
    HIVE: '하이브', XPR: '프로톤', EGG: '네스트에그', BORA: '보라', ARPA: '아르파', FCT2: '피르마체인',
    '1000SATS': '새츠', '1000RATS': '랫츠', MOG: '모그', BRETT: '브렛', POPCAT: '팝캣', NEIRO: '네이로',
    DEGEN: '디젠', TOSHI: '토시', BOME: '북오브밈', MOTHER: '마더',
    KAIA: '카이아', MEW: '뮤', TURBO: '터보', ATH: '에이셔', ZK: '제트케이싱크', BLAST: '블라스트',
    UXLINK: '유엑스링크', AVAIL: '어베일', BANANA: '바나나건', RENDER: '렌더', LISTA: '리스타',
    ZETA: '제타체인', OMNI: '옴니네트워크', SAGA: '사가', ENA: '에테나', ETHFI: '이더파이', AXL: '액셀라',
    MANTA: '만타네트워크', XAI: '엑스아이', AI: '슬립리스AI', NFP: '엔에프프롬프트', ACE: '퓨저니스트',
    VANRY: '바나르', MEME: '밈코인', TOKEN: '토큰파이', NTRN: '뉴트론', BIGTIME: '빅타임',
    HIFI: '하이파이', CYBER: '사이버커넥트', MAV: '매버릭', EDU: '에듀', MINA: '미나',
    MASK: '마스크네트워크', KDA: '카데나', JOE: '조', ACH: '알케미페이', FXS: '프랙스쉐어', BNT: '뱅코르',
    BAL: '밸런서', REN: '렌', NU: '누사이퍼', PDA: '플레이댑', PCI: '페이코인', MED: '메디블록',
    USDT: '테더', USD1: '테더', USDC: 'USDC', USDE: 'USDe', AERO: '에어로드롬', ANIME: '애니메', KAITO: '카이토',
    MOCA: '모카버스', MOVE: '무브먼트', NXPC: '넥스페이스', TRUMP: '트럼프', WLD: '월드코인', WLFI: '월드리버티', G: '그래비티', A: '에이', BIO: '바이오', F: '에프', FG: '에프지',
    LAYER: '레이어AI', '0G': '제로지', TREE: '트리', WET: '웻', '2Z': '투지',
    MOC: '모스코인', STPT: '에스티피', MVL: '엠블', META: '메타디움', HUM: '휴먼스케이프',
    TON: '토카막', UPP: '센티넬', IQ: '아이큐', TT: '썬더토큰', MBL: '무비블록', AHT: '아하토큰',
    QKC: '쿼크체인', DKA: '디카르고', SBD: '스팀달러', ARDR: '아더', ARK: '아크', XEM: '넴',
    NEO: '네오', GAS: '가스', ONT: '온톨로지', ONG: '온톨로지가스', VTHO: '비토르',
    EGLD: '엘론드', IOTA: '아이오타', HUNT: '헌트', BOBA: '보바', AGLD: '어드벤처골드',
    FIO: '피오', JST: '저스트', LOOM: '룸네트워크', POLY: '폴리매쓰', SOLVE: '솔브케어', SUN: '썬'
  };

  let allRows = [];
  let sortKey = 'volume';
  let sortAsc = false;
  let premiumBase = 'upbit';
  let funbiRows = [];
  let funbiSortKey = 'name';
  let funbiSortAsc = true;
  let funbiTimer = null;
  let standardNextFundingTime = null;
  let hyperliquidNextFundingTime = null;
  let krwPerUsd = 1350;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => el.querySelectorAll(sel);

  function formatNumber(n, decimals = 0) {
    if (n == null || isNaN(n)) return '-';
    return Number(n).toLocaleString('ko-KR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  }

  function formatPercent(n) {
    if (n == null || isNaN(n)) return '-';
    const s = Number(n).toFixed(2);
    return (Number(n) >= 0 ? '+' : '') + s + '%';
  }

  function fetchJson(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
    return fetch(url, { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error(r.status);
      clearTimeout(timeoutId);
      return r.json();
    }).catch(e => { console.error(`Failed to fetch JSON from ${url}:`, e); throw e; });
  }

  function getExchangeRate() {
    return fetchJson(EXCHANGE_RATE_URL).then(data => {
      const item = Array.isArray(data) ? data.find(d => d.name === 'USDKRW=X') : null;
      if (item && item.rate) {
        krwPerUsd = item.rate;
        return krwPerUsd;
      }
      return krwPerUsd;
    }).catch(() => krwPerUsd);
  }

  function getUpbitMarkets() {
    return fetchJson(UPBIT_MARKETS_URL).then(markets =>
      markets.filter(m => m.market.startsWith('KRW-')).map(m => m.market)
    );
  }

  /** 메인 코인 우선으로 정렬한 뒤 최대 MAX_MARKETS_PER_REQUEST개 시장 목록 반환 */
  function buildMarketBatch(allMarkets) {
    const mainSet = new Set(MAIN_SYMBOLS);
    const priority = [];
    const rest = [];
    for (const m of allMarkets) {
      const sym = m.replace('KRW-', '');
      if (mainSet.has(sym)) priority.push(m);
      else rest.push(m);
    }
    const order = [];
    for (const sym of MAIN_SYMBOLS) {
      const m = 'KRW-' + sym;
      if (priority.includes(m)) order.push(m);
    }
    for (const m of rest) {
      if (!order.includes(m)) order.push(m);
    }
    return order.slice(0, MAX_MARKETS_PER_REQUEST);
  }

  function getUpbitTickers(markets) {
    if (!markets.length) return Promise.resolve([]);
    const url = UPBIT_TICKER_URL + markets.join(',');
    return fetchJson(url);
  }

  function getBithumbTickers() {
    return fetchJson(BITHUMB_TICKER_URL).then(res => {
      const data = res.data || {};
      return Object.keys(data).reduce((acc, key) => {
        if (key === 'date') return acc;
        const p = parseFloat(data[key].closing_price);
        if (!isNaN(p)) acc[key] = p;
        return acc;
      }, {});
    }).catch(() => ({}));
  }

  function getBinanceTickers() {
    return fetchJson(BINANCE_TICKER_URL).then(list =>
      list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
        acc[t.symbol.replace('USDT', '')] = {
          price: parseFloat(t.lastPrice),
          change: parseFloat(t.priceChangePercent),
          volume: parseFloat(t.quoteVolume)
        };
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  function getBybitTickers() {
    return fetchJson(BYBIT_TICKER_URL).then(res => {
      const list = (res.result && res.result.list) || [];
      return list.filter(t => (t.symbol || '').endsWith('USDT')).reduce((acc, t) => {
        const sym = (t.symbol || '').replace('USDT', '');
        const p = parseFloat(t.lastPrice);
        if (sym && !isNaN(p)) acc[sym] = p;
        return acc;
      }, {});
    }).catch(() => ({}));
  }

  function getOkxTickers() {
    const url = OKX_TICKER_URL + '&t=' + Date.now();
    return fetchProxy(url).then(res => {
      const list = res.data || [];
      return list.filter(t => (t.instId || '').includes('-USDT')).reduce((acc, t) => {
        const sym = (t.instId || '').replace('-USDT', '');
        const p = parseFloat(t.last);
        if (sym && !isNaN(p)) acc[sym] = p;
        return acc;
      }, {});
    }).catch(() => ({}));
  }

  async function getHyperliquidTickers() {
    const combined = {};
    try {
        // 1. 현물(지수) 가격 먼저 요청
        const spotRes = await fetchProxy(HYPERLIQUID_TICKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'metaAndAssetCtxs' })
        });
        let data = spotRes;

        // 데이터 구조 확인: [ {universe: [...]}, [...] ]
        if (Array.isArray(data) && data.length >= 2 && data[0] && Array.isArray(data[0].universe) && Array.isArray(data[1])) {
            const universe = data[0].universe;
            const ctxs = data[1];
            
            universe.forEach((u, i) => {
                const ctx = ctxs[i];
                if (u.name && ctx) {
                    if (!combined[u.name]) combined[u.name] = {};
                    // oraclePx를 현물(지수) 가격으로 사용
                    combined[u.name].spot = parseFloat(ctx.oraclePx);
                    combined[u.name].funding = parseFloat(ctx.funding);
                }
            });
        }
    } catch (e) {
        console.error('Hyperliquid 현물 가격 로딩 실패. 선물 가격은 계속 시도합니다.', e);
    }

    try {
        // 2. 선물(실거래) 가격 요청
        const perpRes = await fetchProxy(HYPERLIQUID_TICKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'allMids' })
        });
        if (perpRes) {
            for (const [key, val] of Object.entries(perpRes)) {
                if (!combined[key]) combined[key] = {};
                combined[key].perp = parseFloat(val);
            }
        }
    } catch (e) {
        console.error('Hyperliquid 선물 가격 로딩 실패.', e);
    }

    return combined;
  }

  async function getBinanceFuturesTickers() {
    const url = BINANCE_FUTURES_TICKER_URL + '?t=' + Date.now();
    return fetchJson(url).then(list =>
      list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
        acc[t.symbol.replace('USDT', '')] = { price: parseFloat(t.lastPrice) };
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  async function getBybitFuturesTickers() {
    const url = BYBIT_FUTURES_TICKER_URL + '&t=' + Date.now();
    return fetchJson(url).then(res => {
      const list = (res.result && res.result.list) || [];
      return list.filter(t => (t.symbol || '').endsWith('USDT')).reduce((acc, t) => {
        const sym = (t.symbol || '').replace('USDT', '');
        const p = parseFloat(t.lastPrice);
        if (sym && !isNaN(p)) acc[sym] = { price: p, funding: parseFloat(t.fundingRate), nextFundingTime: parseInt(t.nextFundingTime) };
        return acc;
      }, {});
    }).catch(() => ({}));
  }
  
  async function getOkxFuturesTickers() {
    const url = OKX_FUTURES_TICKER_URL + '&t=' + Date.now();
    return fetchProxy(url).then(res => {
      const list = res.data || [];
      return list.filter(t => (t.instId || '').endsWith('-USDT-SWAP')).reduce((acc, t) => {
        const sym = (t.instId || '').replace('-USDT-SWAP', '');
        const p = parseFloat(t.last);
        if (sym && !isNaN(p)) acc[sym] = { price: p };
        return acc;
      }, {})
    }).catch(() => ({}));
  }

  async function getBitgetFuturesTickers() {
    const url = 'https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES&t=' + Date.now();
    return fetchProxy(url).then(res => {
      const list = res.data || [];
      return list.reduce((acc, t) => {
        if (t.symbol.endsWith('USDT')) {
          acc[t.symbol.replace('USDT', '')] = { price: parseFloat(t.lastPr), funding: parseFloat(t.fundingRate), nextFundingTime: Number(t.nextFundingTime) };
        }
        return acc;
      }, {});
    }).catch(() => ({}));
  }

  async function getGateioFuturesTickers() {
    const url = 'https://api.gateio.ws/api/v4/futures/usdt/tickers?t=' + Date.now();
    return fetchProxy(url).then(list =>
      list.reduce((acc, t) => {
        if (t.contract.endsWith('_USDT')) {
          acc[t.contract.replace('_USDT', '')] = { price: parseFloat(t.last), funding: parseFloat(t.funding_rate), nextFundingTime: Number(t.funding_next_apply) * 1000 };
        }
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  function getBitgetTickers() {
    const url = 'https://api.bitget.com/api/v2/spot/market/tickers?t=' + Date.now();
    return fetchProxy(url).then(res => {
      const list = res.data || [];
      return list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
        acc[t.symbol.replace('USDT', '')] = parseFloat(t.lastPr);
        return acc;
      }, {});
    }).catch(() => ({}));
  }

  function getGateioTickers() {
    const url = GATEIO_TICKER_URL + '?t=' + Date.now();
    return fetchProxy(url).then(list =>
      list.filter(t => t.currency_pair.endsWith('_USDT')).reduce((acc, t) => {
        acc[t.currency_pair.replace('_USDT', '')] = parseFloat(t.last);
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  async function getBinanceFundingRates() {
    return fetchJson(BINANCE_FUNDING_URL).then(list =>
      list.filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
        acc[t.symbol.replace('USDT', '')] = {
            rate: parseFloat(t.lastFundingRate),
            time: parseInt(t.nextFundingTime)
        };
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  async function getOkxFundingRates() {
    let allRates = {};
    let after = '';
    let hasMore = true;
    let pages = 0;

    // OKX API는 한 번에 100개까지만 반환하므로, 모든 데이터를 가져오기 위해 반복 요청
    while (hasMore && pages < 5) { // 최대 5페이지(500개)까지만 조회하여 무한 루프 방지
        const url = OKX_FUNDING_URL + (after ? `&after=${after}` : '') + '&t=' + Date.now();
        try {
            const res = await fetchProxy(url);
            const list = res.data || [];
            if (list.length === 0) { hasMore = false; break; }

            list.forEach(t => {
                const sym = t.instId.replace('-USDT-SWAP', '');
                allRates[sym] = { rate: parseFloat(t.fundingRate), time: parseInt(t.fundingTime) };
                after = t.instId; // 다음 페이지 조회를 위한 커서
            });
            if (list.length < 100) hasMore = false;
            pages++;
        } catch (e) { hasMore = false; }
    }
    return allRates;
  }

  function buildRows(upbitTickers, bithumbMap, binanceMap, bybitMap, okxMap, bitgetMap, gateMap, hyperliquidMap, binanceFuturesMap, bybitFuturesMap, okxFuturesMap, bitgetFuturesMap, gateioFuturesMap) {
    return upbitTickers.map(t => {
      const symbol = t.market.replace('KRW-', '');
      const change = t.signed_change_rate != null ? t.signed_change_rate * 100 : null;
      return {
        name: symbol,
        upbit: t.trade_price,
        bithumb: bithumbMap[symbol] ?? null,
        binance: binanceMap[symbol]?.price ?? null,
        binance_perp: binanceFuturesMap[symbol]?.price ?? null,
        bybit: bybitMap[symbol] ?? null,
        bybit_perp: bybitFuturesMap[symbol]?.price ?? null,
        okx: okxMap[symbol] ?? null,
        okx_perp: okxFuturesMap[symbol]?.price ?? null,
        bitget: bitgetMap[symbol] ?? null,
        bitget_perp: bitgetFuturesMap[symbol]?.price ?? null,
        gate: gateMap[symbol] ?? null,
        gate_perp: gateioFuturesMap[symbol]?.price ?? null,
        hyperliquid_spot: hyperliquidMap[symbol]?.spot ?? null,
        hyperliquid_perp: hyperliquidMap[symbol]?.perp ?? null,
        change,
        volume: t.acc_trade_price_24h
      };
    }).filter(r => r.binance != null || r.bybit != null || r.okx != null || r.bitget != null || r.gate != null || (r.hyperliquid_spot != null || r.hyperliquid_perp != null));
  }

  function renderTable(rows) {
    const tbody = $('#table-body');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="17" class="loading">매칭되는 코인이 없습니다.</td></tr>';
      return;
    }

    const premiumBasePrice = premiumBase === 'bithumb' ? 'bithumb' : 'upbit';

    tbody.innerHTML = rows.map(r => {
      const basePrice = r[premiumBasePrice];
      const changeClass = r.change != null ? (r.change >= 0 ? 'positive' : 'negative') : '';
      const fmtKrw = v => v != null ? formatNumber(v, 0) : '-';
      
      const fmtOverseas = (price) => {
        if (price == null) return '-';
        const priceKrw = price * krwPerUsd;
        let premiumHtml = '';
        if (basePrice != null && basePrice > 0 && price > 0) {
          const premium = ((basePrice / priceKrw) - 1) * 100;
          const premiumClass = premium > 0 ? 'premium-high' : 'premium-low';
          premiumHtml = `<span class="premium-val ${premiumClass}">${formatPercent(premium)}</span>`;
        }
        return `${formatNumber(priceKrw, 0)}<span class="sub-price">$${formatNumber(price, 4)}</span>${premiumHtml}`;
      };

      const displayName = COIN_NAMES[r.name] ? COIN_NAMES[r.name] : r.name;
      const imgUrl = getCoinIconUrl(r.name);

      const premiums = [r.binance, r.binance_perp, r.bybit, r.bybit_perp, r.okx, r.okx_perp, r.bitget, r.bitget_perp, r.gate, r.gate_perp, r.hyperliquid_spot, r.hyperliquid_perp]
        .filter(p => p != null && basePrice != null && basePrice > 0 && p > 0)
        .map(p => ((basePrice / (p * krwPerUsd)) - 1) * 100);
      const maxPremium = premiums.length > 0 ? Math.max(...premiums) : 0;
      const rowClass = maxPremium >= 5 ? 'premium-alert' : '';

      return `
        <tr class="${rowClass}">
          <td class="name">
            <img class="coin-icon" src="${imgUrl}" alt="" referrerpolicy="no-referrer" onerror="this.src='${COIN_IMG_FALLBACK}'">
            <div><span class="coin-name">${r.name}</span><span class="coin-korean-name">${displayName}</span></div>
          </td>
          <td class="text-right col-upbit">${fmtKrw(r.upbit)}</td>
          <td class="text-right col-bithumb">${fmtKrw(r.bithumb)}</td>
          <td class="text-right col-binance">${fmtOverseas(r.binance)}</td>
          <td class="text-right col-binance_perp">${fmtOverseas(r.binance_perp)}</td>
          <td class="text-right col-bybit">${fmtOverseas(r.bybit)}</td>
          <td class="text-right col-bybit_perp">${fmtOverseas(r.bybit_perp)}</td>
          <td class="text-right col-okx">${fmtOverseas(r.okx)}</td>
          <td class="text-right col-okx_perp">${fmtOverseas(r.okx_perp)}</td>
          <td class="text-right col-bitget">${fmtOverseas(r.bitget)}</td>
          <td class="text-right col-bitget_perp">${fmtOverseas(r.bitget_perp)}</td>
          <td class="text-right col-gate">${fmtOverseas(r.gate)}</td>
          <td class="text-right col-gate_perp">${fmtOverseas(r.gate_perp)}</td>
          <td class="text-right col-hyperliquid_spot">${fmtOverseas(r.hyperliquid_spot)}</td>
          <td class="text-right col-hyperliquid_perp">${fmtOverseas(r.hyperliquid_perp)}</td>
          <td class="text-right ${changeClass}">${r.change != null ? formatPercent(r.change) : '-'}</td>
          <td class="text-right volume">${formatNumber((r.volume || 0) / 1e6, 0)}백만</td>
        </tr>
      `;
    }).join('');
  }

  // --- 펀비 비교 기능 ---
  function loadFunbi() {
    if (funbiTimer) clearInterval(funbiTimer);
    const tbody = $('#funbi-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #848e9c;">펀딩비 데이터를 불러오는 중...</td></tr>';

    Promise.all([
        getBinanceFundingRates(),
        getBybitFuturesTickers(), // Returns { price, funding }
        getOkxFundingRates(),
        getBitgetFuturesTickers(), // Returns { price, funding }
        getGateioFuturesTickers(), // Returns { price, funding }
        getHyperliquidTickers()    // Returns { spot, perp, funding }
    ]).then(([binanceMap, bybitMap, okxMap, bitgetMap, gateMap, hyperliquidMap]) => {
        // 김프 비교 목록(allRows)과 동일한 코인만 표시
        const targetList = allRows.length > 0 ? allRows : [];
        
        // 표준 시간(Binance 기준) 및 Hyperliquid 시간 설정
        // Binance 데이터 중 하나(예: BTC)를 사용하여 다음 펀딩 시간을 가져옴
        const btcBinance = binanceMap && binanceMap['BTC'];
        standardNextFundingTime = btcBinance ? btcBinance.time : null;
        hyperliquidNextFundingTime = Math.ceil(Date.now() / 3600000) * 3600000;
        
        funbiRows = targetList.map(row => {
            const sym = row.name;
            return {
                name: sym,
                binance: binanceMap[sym] ? binanceMap[sym].rate : null,
                bybit: bybitMap[sym] ? bybitMap[sym].funding : null,
                okx: okxMap[sym] ? okxMap[sym].rate : null,
                bitget: bitgetMap[sym] ? bitgetMap[sym].funding : null,
                gate: gateMap[sym] ? gateMap[sym].funding : null,
                hyperliquid: hyperliquidMap[sym] ? hyperliquidMap[sym].funding : null
            };
        }).filter(r => r.binance != null || r.bybit != null || r.okx != null || r.bitget != null || r.gate != null || r.hyperliquid != null);
        
        applyFunbiSortAndFilter();
        updateFunbiTimers(); // 즉시 갱신

        // 1초마다 카운트다운 갱신
        funbiTimer = setInterval(() => {
            if ($('#section-funbi').classList.contains('active')) {
                updateFunbiTimers();
            }
        }, 1000);
    });
  }

  function updateFunbiTimers() {
    const now = Date.now();
    
    const formatDiff = (target) => {
        if (!target) return '-';
        const diff = target - now;
        if (diff <= 0) return '갱신 중';
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const stdStr = formatDiff(standardNextFundingTime);
    const hlStr = formatDiff(hyperliquidNextFundingTime);

    // 헤더에 시간 표시 (Binance 시간 통일)
    const timeMap = {
        'binance': stdStr,
        'bybit': stdStr,
        'okx': stdStr,
        'bitget': stdStr,
        'gate': stdStr,
        'hyperliquid': hlStr
    };

    for (const [key, str] of Object.entries(timeMap)) {
        const th = document.querySelector(`.funbi-table th[data-sort="${key}"]`);
        if (th) {
            let timerEl = th.querySelector('.funding-timer');
            if (!timerEl) {
                timerEl = document.createElement('div');
                timerEl.className = 'funding-timer';
                th.appendChild(timerEl);
            }
            timerEl.textContent = str;
        }
    }
  }

  function renderFunbiTable(rows) {
    const tbody = $('#funbi-table-body');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #848e9c;">데이터가 없습니다.</td></tr>';
      return;
    }

    const fmtRate = (val) => {
        if (val == null || isNaN(val)) return '-';
        const pct = (val * 100).toFixed(4) + '%';
        const colorClass = val > 0 ? 'positive' : (val < 0 ? 'negative' : '');
        return `<span class="${colorClass}">${pct}</span>`;
    };

    tbody.innerHTML = rows.map(r => {
        const displayName = COIN_NAMES[r.name] ? COIN_NAMES[r.name] : r.name;
        const imgUrl = getCoinIconUrl(r.name);
        return `
            <tr>
                <td class="name">
                    <img class="coin-icon" src="${imgUrl}" alt="" referrerpolicy="no-referrer" onerror="this.src='${COIN_IMG_FALLBACK}'">
                    <div><span class="coin-name">${r.name}</span><span class="coin-korean-name">${displayName}</span></div>
                </td>
                <td class="text-right">${fmtRate(r.binance)}</td>
                <td class="text-right">${fmtRate(r.bybit)}</td>
                <td class="text-right">${fmtRate(r.okx)}</td>
                <td class="text-right">${fmtRate(r.bitget)}</td>
                <td class="text-right">${fmtRate(r.gate)}</td>
                <td class="text-right">${fmtRate(r.hyperliquid)}</td>
            </tr>
        `;
    }).join('');
  }

  function applyFunbiSortAndFilter() {
    const query = ($('#search-funbi') && $('#search-funbi').value || '').trim().toUpperCase();
    let list = query
      ? funbiRows.filter(r => r.name.toUpperCase().includes(query))
      : [...funbiRows];
    
    list.sort((a, b) => {
        let va, vb;
        if (funbiSortKey === 'name') {
            va = a.name;
            vb = b.name;
        } else {
            va = a[funbiSortKey] ? a[funbiSortKey].rate : null;
            vb = b[funbiSortKey] ? b[funbiSortKey].rate : null;
        }
        
        if (va == null) va = funbiSortKey === 'name' ? '' : -Infinity;
        if (vb == null) vb = funbiSortKey === 'name' ? '' : -Infinity;
        
        if (funbiSortKey === 'name') return funbiSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        return funbiSortAsc ? va - vb : vb - va;
    });
    renderFunbiTable(list);
  }

  // --- 고래 추적 기능 ---
  let whaleSocket = null;
  let whaleSocketXrp = null;
  let whaleSocketSol = null;
  let evmSockets = [];
  let whaleData = []; // 고래 데이터 저장소
  let whalePage = 1;
  let whaleItemsPerPage = 10;

  function updateStatus(chain, isConnected, msg) {
    let statusContainer = document.getElementById('whale-status-container');
    if (!statusContainer) {
      const table = document.getElementById('whale-table-body')?.closest('table');
      if (table) {
        statusContainer = document.createElement('div');
        statusContainer.id = 'whale-status-container';
        statusContainer.style.cssText = 'padding: 10px; margin-bottom: 10px; background-color: #1e2329; border-radius: 4px; font-size: 12px; color: #848e9c; display: flex; justify-content: space-between; align-items: center;';
        table.parentNode.insertBefore(statusContainer, table);
      }
    }

    // 전역 상태 객체 초기화
    if (!window.whaleStatus) window.whaleStatus = { BTC: false, ETH: false, ARB: false, SOL: false, msg: '초기화 중...' };
    
    // 상태 업데이트
    window.whaleStatus[chain.toUpperCase()] = isConnected;
    if (msg) window.whaleStatus.msg = msg;
    else if (isConnected) window.whaleStatus.msg = '정상 작동 중';

    // UI 렌더링
    if (statusContainer) {
      const statusHtml = ['BTC', 'ETH', 'ARB', 'SOL'].map(k => {
        const color = window.whaleStatus[k] ? '#14f195' : '#f6465d';
        return `<span style="margin-right: 12px; font-weight: bold;"><span style="color:${color}">●</span> ${k}</span>`;
      }).join('');
      
      statusContainer.innerHTML = `<div>${statusHtml}</div><div style="color:#f0b90b; max-width: 60%; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.whaleStatus.msg}</div>`;
    }
  }

  // RPC 목록 (장애 시 자동 전환)
  const RPC_LIST = {
    ETH: ['https://cloudflare-eth.com', 'https://rpc.flashbots.net', 'https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
    ARB: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum.llamarpc.com', 'https://rpc.ankr.com/arbitrum'],
    SOL: ['https://solana.publicnode.com', 'https://rpc.ankr.com/solana', 'https://api.mainnet-beta.solana.com'] // PublicNode 우선
  };
  const WSS_RPC_LIST = {
    ETH: ['wss://ethereum-rpc.publicnode.com', 'wss://mainnet.gateway.tenderly.co', 'wss://rpc.ankr.com/eth/ws'],
    ARB: ['wss://arbitrum-one-rpc.publicnode.com', 'wss://arbitrum.gateway.tenderly.co', 'wss://rpc.ankr.com/arbitrum/ws'],
    SOL: ['wss://solana.publicnode.com', 'wss://rpc.ankr.com/solana/ws', 'wss://api.mainnet-beta.solana.com'] // PublicNode 우선
  };
  // 1. BTC (비트코인)
  function startBtcTracker() {
    if (whaleSocket) return;
    whaleSocket = new WebSocket('wss://ws.blockchain.info/inv');
    
    whaleSocket.onopen = function() {
      whaleSocket.send(JSON.stringify({ "op": "unconfirmed_sub" }));
      updateStatus('btc', true);
    };

    whaleSocket.onclose = function() {
      updateStatus('btc', false);
      whaleSocket = null;
      setTimeout(startBtcTracker, 3000);
    };

    whaleSocket.onmessage = function(msg) {
      try {
        const data = JSON.parse(msg.data);
        if (data.op === 'utx') {
          const tx = data.x;
          let totalSatoshi = 0;
          for (const out of tx.out) {
            totalSatoshi += out.value;
          }
          const btcAmount = totalSatoshi / 100000000;
          
          const btcRow = allRows.find(r => r.name === 'BTC');
          const btcPrice = btcRow && btcRow.binance ? btcRow.binance : 60000;
          const valueUsd = btcAmount * btcPrice;

          if (valueUsd >= WHALE_THRESHOLD_USD) {
            const hashShort = tx.hash.substring(0, 8) + '...';
            const explorerUrl = 'https://www.blockchain.com/btc/tx/' + tx.hash;
            const infoHtml = `<a href="${explorerUrl}" target="_blank" style="color:#848e9c; text-decoration:underline;">${hashShort}</a>`;
            addWhaleRow('BTC', btcAmount, valueUsd, infoHtml);
          }
        }
      } catch (e) {
        console.error('Error processing BTC transaction message:', e);
      }
    };
  }

  function initWhaleTracker() {
    startBtcTracker();
    startEvmTracker();
    startSolTracker();
    
    // 필터 이벤트 연결
    const filterEl = $('#whale-filter');
    if (filterEl && !filterEl.dataset.bound) {
      filterEl.dataset.bound = true;
      filterEl.addEventListener('change', function() {
        whalePage = 1;
        renderWhaleTable();
      });
    }
  }

  // 2. EVM (ETH, ARB) - WebSocket 방식 (실시간성) with RPC rotation
  let ethRpcIndex = 0;
  let arbRpcIndex = 0;

  function startEvmTracker() {
    if (evmSockets.length > 0) return;
    
    // 이더리움 (ETH)
    evmSockets.push(trackEvmWs('ETH', WSS_RPC_LIST.ETH, ethRpcIndex, 18, [
      { symbol: 'USDT', addr: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
      { symbol: 'USDC', addr: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 }
    ]));
    // 아비트럼 (ARB)
    evmSockets.push(trackEvmWs('ARB', WSS_RPC_LIST.ARB, arbRpcIndex, 18, [
      { symbol: 'USDT', addr: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6 },
      { symbol: 'USDC', addr: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', decimals: 6 }
    ]));
  }

  function trackEvmWs(chainSymbol, rpcUrls, initialRpcIndex, nativeDecimals, tokens) {
    let currentRpcIndex = initialRpcIndex;
    let ws = new WebSocket(rpcUrls[currentRpcIndex]);

    ws.onopen = () => {
      updateStatus(chainSymbol.toLowerCase(), true);
      ws.send(JSON.stringify({"jsonrpc":"2.0","id": 1, "method": "eth_subscribe", "params": ["newHeads"]}));
    };
    ws.onclose = () => {
      updateStatus(chainSymbol.toLowerCase(), false);
      // Switch to next RPC on close
      const nextRpcIndex = (currentRpcIndex + 1) % rpcUrls.length;
      if (chainSymbol === 'ETH') ethRpcIndex = nextRpcIndex;
      else if (chainSymbol === 'ARB') arbRpcIndex = nextRpcIndex;
      
      console.warn(`EVM WS for ${chainSymbol} closed. Switching to next RPC: ${rpcUrls[nextRpcIndex]}`);
      setTimeout(() => trackEvmWs(chainSymbol, rpcUrls, nextRpcIndex, nativeDecimals, tokens), 3000);
    };
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.method === 'eth_subscription' && data.params && data.params.result) {
          const blockNumber = data.params.result.number;
          ws.send(JSON.stringify({"jsonrpc":"2.0","id": 2, "method": "eth_getBlockByNumber", "params": [blockNumber, true]}));
        }
        if (data.id === 2 && data.result) {
          processEvmBlock(data.result, chainSymbol, nativeDecimals, tokens);
        }
      } catch (e) {
        console.error(`EVM WS Error for ${chainSymbol} on ${rpcUrls[currentRpcIndex]}:`, e);
        ws.close(); // Force close to trigger reconnect with new RPC
      }
    };
    return ws;
  }

  function processEvmBlock(block, chainSymbol, nativeDecimals, tokens) {
    const coinRow = allRows.find(r => r.name === chainSymbol);
    let coinPrice = coinRow && coinRow.binance ? coinRow.binance : 0;
    if (coinPrice === 0) {
      if (chainSymbol === 'ETH') coinPrice = 2500;
      if (chainSymbol === 'ARB') coinPrice = 0.5;
    }

    if (!block.transactions) return;

    for (const tx of block.transactions) {
      if (!tx.to) continue;
      
      let symbol = chainSymbol;
      let amount = 0;
      let valueUsd = 0;

      if (tx.input && tx.input.startsWith('0xa9059cbb')) { // ERC20
        // For ERC20 transfer, tx.to is the token contract address.
        // The recipient address is in the input data (bytes 16-35).
        const tokenContractAddr = tx.to.toLowerCase();
        const recipientAddr = '0x' + tx.input.substring(34, 74).toLowerCase(); // Extract recipient from input
        const token = tokens.find(t => t.addr.toLowerCase() === tokenContractAddr);
        if (!token) continue;
        symbol = token.symbol;
        // The amount is a 32-byte (64 hex chars) value after the recipient address.
        // Incorrectly taking the rest of the string can lead to huge numbers if there's extra data.
        const hexAmount = tx.input.substring(74, 138);
        const rawAmount = BigInt('0x' + hexAmount);
        amount = Number(rawAmount) / Math.pow(10, token.decimals);
        valueUsd = amount; // Assuming stablecoin for now (USDT, USDC)
      } else { // Native
        if (tx.value === '0x0') continue;
        const rawValue = BigInt(tx.value);
        amount = Number(rawValue) / Math.pow(10, nativeDecimals);
        valueUsd = amount * coinPrice;
      }

      if (valueUsd >= WHALE_THRESHOLD_USD) {
        const hashShort = tx.hash.substring(0, 8) + '...';
        let explorerUrl = '';
        if (chainSymbol === 'ETH') explorerUrl = 'https://etherscan.io/tx/' + tx.hash;
        else if (chainSymbol === 'ARB') explorerUrl = 'https://arbiscan.io/tx/' + tx.hash;
        const infoHtml = `<a href="${explorerUrl}" target="_blank" style="color:#848e9c; text-decoration:underline;">${hashShort}</a>`;
        addWhaleRow(symbol, amount, valueUsd, infoHtml);
      }
    }
  }

  // 3. SOL (솔라나) - logsSubscribe + getTransaction 방식으로 변경
  let solHttpRpcIndex = 0; // HTTP RPC 인덱스
  let solWssRpcIndex = 0; // WebSocket RPC 인덱스
  const solTxQueue = [];     // 트랜잭션 서명 대기열
  let isProcessingSolTx = false; // 처리 중 플래그

  // [근본 해결책] 대기열 순차 처리: 한 번에 하나씩 트랜잭션을 처리하여 RPC 부하 및 IP 차단 방지
  async function solanaTransactionProcessor() {
    if (isProcessingSolTx || solTxQueue.length === 0) {
      setTimeout(solanaTransactionProcessor, 500); // 0.5초 후 다시 체크
      return;
    }

    isProcessingSolTx = true;
    const signature = solTxQueue.shift();
    updateStatus('sol', true, `트랜잭션 ${signature.substring(0,8)}... 처리 중`);
    
    await processSolTransaction(signature);

    isProcessingSolTx = false;
    setTimeout(solanaTransactionProcessor, 500); // 처리 완료 후 0.5초 대기 (RPC Rate Limit 준수)
  }

  async function processSolTransaction(signature) {
      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 전체 타임아웃 8초

          let txData = null;
          let lastError = null;

          // 데이터 동기화 지연을 해결하기 위한 동적 재시도 로직
          for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                  const rpcUrl = RPC_LIST.SOL[solHttpRpcIndex];
                  const response = await fetch(rpcUrl, {
                      signal: controller.signal,
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          jsonrpc: "2.0", id: 1, method: "getTransaction",
                          params: [signature, { "encoding": "jsonParsed", "maxSupportedTransactionVersion": 0 }]
                      })
                  });

                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                  const res = await response.json();
                  if (res.error) throw new Error(`RPC ${res.error.code}`);
                  
                  // 데이터가 아직 전파되지 않은 경우 'null'이 올 수 있음
                  if (!res.result) throw new Error("null result");

                  txData = res.result; // 성공 시 데이터 할당하고 루프 탈출
                  break;

              } catch (e) {
                  lastError = e;
                  if (e.message === "null result" && attempt < 3) {
                      updateStatus('sol', true, `데이터 동기화 대기... (${attempt}/3)`);
                      await new Promise(r => setTimeout(r, 1000 * attempt)); // 1초, 2초 대기
                  } else {
                      // 다른 종류의 에러는 즉시 중단
                      throw e;
                  }
              }
          }
          clearTimeout(timeoutId);

          if (!txData) {
              throw lastError || new Error("데이터 조회 최종 실패");
          }

          parseSolTransaction(txData);

      } catch (e) {
          const errorMessage = e.name === 'AbortError' ? '요청 시간 초과' : e.message;
          updateStatus('sol', true, `조회 실패: ${errorMessage}`);
          solHttpRpcIndex = (solHttpRpcIndex + 1) % RPC_LIST.SOL.length;
          console.warn(`Solana getTransaction failed for sig ${signature}. Error: ${e.message}. Switching to RPC index ${solHttpRpcIndex}`);
      } finally {
          // isProcessingSolTx is handled by the processor loop
      }
  }

  function parseSolTransaction(txData) {
       // 트랜잭션 성공 시에만 파싱 진행
       if (!txData || !txData.meta || txData.meta.err) return;
 
       const signature = txData.transaction.signatures[0];
       const solRow = allRows.find(r => r.name === 'SOL');
       const solPrice = solRow && solRow.binance ? solRow.binance : 150;
       let isWhale = false;
 
       const instructions = txData.transaction.message.instructions;
       if (instructions) {
           for (const inst of instructions) {
               if ((inst.program === 'system' || inst.programId === '11111111111111111111111111111111') && inst.parsed && inst.parsed.type === 'transfer') {
                   const lamports = inst.parsed.info.lamports;
                   const amount = lamports / 1000000000;
                   const valueUsd = amount * solPrice;
                   if (valueUsd >= WHALE_THRESHOLD_USD) {
                       const hashShort = signature.substring(0, 8) + '...';
                       const explorerUrl = 'https://solscan.io/tx/' + signature;
                       const infoHtml = `<a href="${explorerUrl}" target="_blank" style="color:#848e9c; text-decoration:underline;">${hashShort}</a>`;
                       addWhaleRow('SOL', amount, valueUsd, infoHtml);
                       isWhale = true;
                   }
               }
           }
           if (!isWhale && txData.meta && txData.meta.preTokenBalances && txData.meta.postTokenBalances) {
               const preBalances = {};
               txData.meta.preTokenBalances.forEach(b => { preBalances[b.accountIndex] = b.uiTokenAmount.uiAmount || 0; });
               txData.meta.postTokenBalances.forEach(post => {
                   const pre = preBalances[post.accountIndex] || 0;
                   const diff = (post.uiTokenAmount.uiAmount || 0) - pre;
                   if (diff > 0 && (post.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' || post.mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')) {
                       const symbol = post.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : 'USDT';
                       const valueUsd = diff;
                       if (valueUsd >= WHALE_THRESHOLD_USD) {
                           const hashShort = signature.substring(0, 8) + '...';
                           const explorerUrl = 'https://solscan.io/tx/' + signature;
                           const infoHtml = `<a href="${explorerUrl}" target="_blank" style="color:#848e9c; text-decoration:underline;">${hashShort}</a>`;
                           addWhaleRow(symbol, diff, valueUsd, infoHtml);
                           isWhale = true;
                       }
                   }
               });
           }
       }
  }

  function startSolTracker() {
    if (whaleSocketSol) return; // Prevent multiple connections

    // 트랜잭션 처리 루프 시작 (최초 1회)
    solanaTransactionProcessor();

    const wssUrl = WSS_RPC_LIST.SOL[solWssRpcIndex];
    whaleSocketSol = new WebSocket(wssUrl);

    whaleSocketSol.onopen = () => {
      console.log(`SOL WS connected to ${wssUrl}. Subscribing to logs...`);
      updateStatus('sol', true, 'SOL 연결됨. 데이터 수신 대기 중...');
      // 'logsSubscribe'를 사용하여 SOL, USDC, USDT 전송 관련 로그를 실시간으로 받습니다.
      whaleSocketSol.send(JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "logsSubscribe",
        "params": [
          { "mentions": [
              "11111111111111111111111111111111", // System Program (SOL)
              "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
              "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"  // USDT
            ] 
          }, 
          { "commitment": "confirmed" }
        ]
      }));
    };

    whaleSocketSol.onmessage = (msg) => {
      try {
          const data = JSON.parse(msg.data);
          if (data.result && data.id === 1) {
              updateStatus('sol', true, 'SOL 구독 성공. 모니터링 시작.');
              return;
          }
          if (data.method === 'logsNotification' && data.params && data.params.result) {
              const signature = data.params.result.value.signature;
              // 대기열이 너무 길면 추가하지 않음 (메모리 보호)
              if (solTxQueue.length < 100) {
                  solTxQueue.push(signature);
              } else {
                  updateStatus('sol', true, '트래픽 폭주: 일부 데이터 생략');
              }
          }
      } catch (e) {
        console.error('Error parsing SOL WS message:', e);
      }
    };

    whaleSocketSol.onclose = () => {
      updateStatus('sol', false, 'SOL 연결 끊김. 재연결 시도...');
      whaleSocketSol = null;
      solWssRpcIndex = (solWssRpcIndex + 1) % WSS_RPC_LIST.SOL.length;
      console.warn(`SOL WS closed. Switching to next WSS RPC: ${WSS_RPC_LIST.SOL[solWssRpcIndex]}`);
      setTimeout(startSolTracker, 3000);
    };

    whaleSocketSol.onerror = (err) => {
      updateStatus('sol', false, 'SOL 소켓 에러 발생');
      whaleSocketSol.close(); // 에러 발생 시 연결을 닫아 onclose 핸들러가 재연결을 시도하도록 합니다.
    };
  }

  function addWhaleRow(symbol, amount, valueUsd, infoHtml) {
    const time = new Date().toLocaleTimeString('ko-KR');
    
    const colorMap = {
      BTC: '#f0b90b',
      ETH: '#627eea',
      ARB: '#28a0f0',
      SOL: '#14f195',
      XRP: '#6fa8dc',
      DOGE: '#c2a633',
      USDC: '#2775ca'
    };
    const color = colorMap[symbol] || '#eaecef';

    // 데이터 저장
    whaleData.unshift({
      time,
      symbol,
      amount,
      valueUsd,
      infoHtml,
      color
    });

    // 메모리 보호: 데이터가 너무 많이 쌓이면 오래된 것 삭제 (테스트 시 데이터 폭증 방지)
    if (whaleData.length > 500) whaleData.pop();

    // 테이블 갱신 (현재 1페이지를 보고 있다면 즉시 반영)
    if (whalePage === 1) {
      renderWhaleTable();
    }
  }

  function renderWhaleTable() {
    const tbody = $('#whale-table-body');
    if (!tbody) return;

    const filterVal = ($('#whale-filter') && $('#whale-filter').value) || 'ALL';
    const filtered = whaleData.filter(r => filterVal === 'ALL' || r.symbol === filterVal);

    const totalPages = Math.ceil(filtered.length / whaleItemsPerPage) || 1;
    if (whalePage > totalPages) whalePage = totalPages;
    if (whalePage < 1) whalePage = 1;

    const start = (whalePage - 1) * whaleItemsPerPage;
    const end = start + whaleItemsPerPage;
    const pageData = filtered.slice(start, end);

    // 페이지 정보 업데이트
    const pageInfo = $('#page-info-whale');
    if (pageInfo) pageInfo.textContent = `${whalePage} / ${totalPages}`;

    if (pageData.length === 0) {
      if (whaleData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #848e9c;">실시간 데이터를 수신 대기 중... (잠시만 기다려주세요)</td></tr>';
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #848e9c;">해당 조건의 데이터가 없습니다.</td></tr>';
      }
      return;
    }

    tbody.innerHTML = pageData.map(r => {
      const valueKrw = r.valueUsd * krwPerUsd;
      return `
        <tr class="new-row">
          <td>${r.time}</td>
          <td><span style="font-weight:700; color:${r.color};">${r.symbol}</span></td>
          <td class="text-right">${formatNumber(r.amount, 2)}</td>
          <td class="text-right" style="color:#eaecef;">${formatNumber(valueKrw / 100000000, 1)}억원</td>
          <td class="text-right">${r.infoHtml}</td>
        </tr>
      `;
    }).join('');
  }

  function applySortAndFilter() {
    const query = ($('#search') && $('#search').value || '').trim().toUpperCase();
    let list = query
      ? allRows.filter(r => {
          const name = r.name.toUpperCase();
          const koName = (COIN_NAMES[r.name] || '').toUpperCase();
          return name.includes(query) || koName.includes(query);
        })
      : [...allRows];
    list.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (va == null) va = sortKey === 'name' ? '' : -Infinity;
      if (vb == null) vb = sortKey === 'name' ? '' : -Infinity;
      if (sortKey === 'name') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
    renderTable(list);
  }

  function setupSort() {
    const thead = $('.data-table thead');
    if (!thead) return;
    thead.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-sort]');
      if (!th) return;
      const key = th.dataset.sort;
      if (key === sortKey) sortAsc = !sortAsc;
      else { sortKey = key; sortAsc = key === 'name'; }
      $$('.data-table th[data-sort]').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
      th.classList.add(sortAsc ? 'sorted-asc' : 'sorted-desc');
      applySortAndFilter();
    });

    // 펀비 테이블 정렬
    const funbiThead = $('.funbi-table thead');
    if (funbiThead) {
        funbiThead.addEventListener('click', (e) => {
            const th = e.target.closest('th[data-sort]');
            if (!th) return;
            const key = th.dataset.sort;
            if (key === funbiSortKey) funbiSortAsc = !funbiSortAsc;
            else { funbiSortKey = key; funbiSortAsc = key === 'name'; }
            applyFunbiSortAndFilter();
        });
    }
  }

  function setMeta(rate, time) {
    const rateEl = $('#exchange-rate');
    const updateEl = $('#last-update');
    if (rateEl) rateEl.textContent = '환율: 1 USD ≈ ' + formatNumber(rate) + ' KRW';
    if (updateEl) updateEl.textContent = '마지막 갱신: ' + (time || '-');
  }

  function load() {
    const tbody = $('#table-body');

    Promise.all([
      getExchangeRate(),
      getUpbitMarkets(),
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
      getGateioFuturesTickers()
    ]).then(([rate, markets, bithumbMap, binanceMap, bybitMap, okxMap, bitgetMap, gateMap, hyperliquidMap, binanceFuturesMap, bybitFuturesMap, okxFuturesMap, bitgetFuturesMap, gateioFuturesMap]) => {
      krwPerUsd = rate;
      setMeta(rate, new Date().toLocaleTimeString('ko-KR'));
      const batch = buildMarketBatch(markets);
      return getUpbitTickers(batch).then(upbitTickers => {
        allRows = buildRows(upbitTickers, bithumbMap, binanceMap, bybitMap, okxMap, bitgetMap, gateMap, hyperliquidMap, binanceFuturesMap, bybitFuturesMap, okxFuturesMap, bitgetFuturesMap, gateioFuturesMap);
        $$('.data-table th[data-sort]').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
        const th = $(`.data-table th[data-sort="${sortKey}"]`);
        if (th) th.classList.add(sortAsc ? 'sorted-asc' : 'sorted-desc');
        applySortAndFilter();
      });
    }).catch(err => {
      if (tbody) tbody.innerHTML = '<tr><td colspan="17" class="loading">데이터를 불러오지 못했습니다. 새로고침해 주세요.</td></tr>';
      setMeta(krwPerUsd, null);
      console.error(err);
    });
  }

  function init() {
    const searchEl = $('#search');
    const refreshBtn = $('#btn-refresh');
    if (searchEl) searchEl.addEventListener('input', applySortAndFilter);
    if (refreshBtn) refreshBtn.addEventListener('click', load);

    const topBarContainer = $('.top-bar .container');
    if (topBarContainer) {
        const themeToggleBtn = document.createElement('button');
        themeToggleBtn.id = 'btn-theme-toggle';
        themeToggleBtn.type = 'button';
        themeToggleBtn.className = 'btn-refresh';
        themeToggleBtn.textContent = '☀️/🌙';
        topBarContainer.appendChild(themeToggleBtn);

        const applyTheme = (theme) => {
            document.documentElement.classList.toggle('light-theme', theme === 'light');
        };

        let currentTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(currentTheme);

        themeToggleBtn.addEventListener('click', () => {
            currentTheme = document.documentElement.classList.contains('light-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
            applyTheme(currentTheme);
        });
    }

    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.section');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        const section = document.getElementById('section-' + id);
        if (section) section.classList.add('active');

        if (id === 'whale') {
            initWhaleTracker();
        } else if (id === 'funbi') {
            loadFunbi();
        }
      });
    });

    // 김프 기준가 선택
    document.querySelectorAll('input[name="premium-base"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        premiumBase = e.target.value;
        applySortAndFilter(); 
      });
    });

    // 달러 가격 표시 토글
    const usdToggleCheckbox = $('#toggle-usd-price');
    if (usdToggleCheckbox) {
        const dataTable = $('.data-table');
        if (dataTable) {
            usdToggleCheckbox.addEventListener('change', (e) => {
                dataTable.classList.toggle('hide-usd', !e.target.checked);
            });
        }
    }

    // 펀비 검색 및 새로고침
    const searchFunbi = $('#search-funbi');
    const refreshFunbi = $('#btn-refresh-funbi');
    if (searchFunbi) searchFunbi.addEventListener('input', applyFunbiSortAndFilter);
    if (refreshFunbi) refreshFunbi.addEventListener('click', loadFunbi);

    // 거래소 필터
    const exchangeConfig = [
        { key: 'upbit', name: '업비트', default: true, group: '현물' },
        { key: 'bithumb', name: '빗썸', default: true, group: '현물' },
        { key: 'binance', name: '바이낸스', default: true, group: '현물' },
        { key: 'bybit', name: '바이비트', default: true, group: '현물' },
        { key: 'okx', name: 'OKX', default: true, group: '현물' },
        { key: 'bitget', name: 'Bitget', default: true, group: '현물' },
        { key: 'gate', name: 'Gate.io', default: true, group: '현물' },
        { key: 'hyperliquid_spot', name: 'Hyperliquid', default: true, group: '현물' },
        { key: 'binance_perp', name: '바이낸스', default: true, group: '선물' },
        { key: 'bybit_perp', name: '바이비트', default: true, group: '선물' },
        { key: 'okx_perp', name: 'OKX', default: true, group: '선물' },
        { key: 'bitget_perp', name: 'Bitget', default: true, group: '선물' },
        { key: 'gate_perp', name: 'Gate.io', default: true, group: '선물' },
        { key: 'hyperliquid_perp', name: 'Hyperliquid', default: true, group: '선물' },
    ];

    const filterContainer = $('#exchange-filter');
    const tableEl = $('.data-table');

    if (filterContainer && tableEl) {
        const groups = exchangeConfig.reduce((acc, ex) => {
            if (!acc[ex.group]) acc[ex.group] = [];
            acc[ex.group].push(ex);
            return acc;
        }, {});

        let filterHtml = '';
        const groupOrder = ['현물', '선물'];
        for (const groupName of groupOrder) {
            if (!groups[groupName]) continue;
            filterHtml += `
              <div class="exchange-filter-group">
                <strong>${groupName} 거래소</strong>
                <div class="checkbox-wrapper">
                  <label style="margin-right: 6px; font-weight:bold;">
                    <input type="checkbox" class="exchange-group-toggle" data-group="${groupName}" checked>
                    전체
                  </label>
                  ${groups[groupName].map(ex => `
                    <label>
                      <input type="checkbox" class="exchange-toggle" value="${ex.key}" data-group="${groupName}" ${ex.default ? 'checked' : ''}>
                      ${ex.name}
                    </label>
                  `).join('')}
                </div>
              </div>
            `;
        }
        filterContainer.innerHTML = filterHtml;

        exchangeConfig.forEach(ex => {
          if (!ex.default) tableEl.classList.add(`hide-${ex.key}`);
        });

        filterContainer.addEventListener('change', e => {
          if (e.target.classList.contains('exchange-toggle')) {
            tableEl.classList.toggle(`hide-${e.target.value}`, !e.target.checked);
            
            // 개별 선택 시 전체 선택 체크박스 상태 업데이트
            const group = e.target.dataset.group;
            const groupToggle = filterContainer.querySelector(`.exchange-group-toggle[data-group="${group}"]`);
            const allInGroup = filterContainer.querySelectorAll(`.exchange-toggle[data-group="${group}"]`);
            if (groupToggle && allInGroup.length > 0) {
                groupToggle.checked = Array.from(allInGroup).every(cb => cb.checked);
            }

          } else if (e.target.classList.contains('exchange-group-toggle')) {
            const group = e.target.dataset.group;
            const isChecked = e.target.checked;
            const toggles = filterContainer.querySelectorAll(`.exchange-toggle[data-group="${group}"]`);
            toggles.forEach(t => {
                t.checked = isChecked;
                tableEl.classList.toggle(`hide-${t.value}`, !isChecked);
            });
          }
        });
    }

    // 거래소 아이콘
    const EXCHANGE_ICONS = {
        upbit: 'https://www.google.com/s2/favicons?domain=upbit.com&sz=32',
        bithumb: 'https://www.google.com/s2/favicons?domain=bithumb.com&sz=32',
        binance: 'https://www.google.com/s2/favicons?domain=binance.com&sz=32',
        bybit: 'https://www.google.com/s2/favicons?domain=bybit.com&sz=32',
        okx: 'https://www.google.com/s2/favicons?domain=okx.com&sz=32',
        hyperliquid: 'https://www.google.com/s2/favicons?domain=hyperliquid.xyz&sz=32',
        bitget: 'https://www.google.com/s2/favicons?domain=bitget.com&sz=32',
        gate: 'https://www.google.com/s2/favicons?domain=gate.io&sz=32'
    };

    $$('.data-table th[data-sort]').forEach(th => {
        const key = th.dataset.sort.replace('_perp', '').replace('_spot', '');
        if (EXCHANGE_ICONS[key] && !th.querySelector('.exchange-icon')) {
            th.innerHTML = `<img src="${EXCHANGE_ICONS[key]}" class="exchange-icon" alt="${key} logo" referrerpolicy="no-referrer">` + th.innerHTML;
        }
      });

    // 고래 추적 페이지네이션 버튼
    const btnPrev = $('#btn-prev-whale');
    const btnNext = $('#btn-next-whale');
    const perPageSelect = $('#whale-per-page');

    if (perPageSelect) {
      perPageSelect.addEventListener('change', function() {
        whaleItemsPerPage = parseInt(this.value);
        whalePage = 1;
        renderWhaleTable();
      });
    }

    if (btnPrev) btnPrev.addEventListener('click', () => {
      if (whalePage > 1) { whalePage--; renderWhaleTable(); }
    });
    if (btnNext) btnNext.addEventListener('click', () => {
      const filterVal = ($('#whale-filter') && $('#whale-filter').value) || 'ALL';
      const filtered = whaleData.filter(r => filterVal === 'ALL' || r.symbol === filterVal);
      const totalPages = Math.ceil(filtered.length / whaleItemsPerPage) || 1;
      if (whalePage < totalPages) { whalePage++; renderWhaleTable(); }
    });

    setupSort();
    load();
    initWhaleTracker(); // 고래 추적 시작
    setInterval(load, 30000); // 30초 간격으로 갱신
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

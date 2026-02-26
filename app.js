(function () {
  'use strict';

  // URL 상수 (직접 호출 방식으로 변경)
  const UPBIT_MARKETS_URL = 'https://api.upbit.com/v1/market/all?isDetails=false';
  const UPBIT_TICKER_URL = 'https://api.upbit.com/v1/ticker?markets=';
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

  // 고래 추적 설정
  const WHALE_THRESHOLD_USD = 1000; // 100만 달러 이상 감지

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
  let funbiSocketsConnected = false;
  let standardNextFundingTime = null;
  let hyperliquidNextFundingTime = null;
  let krwPerUsd = 1350;
  let sockets = {}; // 웹소켓 인스턴스 관리

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => el.querySelectorAll(sel);

  function formatNumber(n, decimals = 0) {
    if (n == null || isNaN(n)) return '-';
    return Number(n).toLocaleString('ko-KR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  }

  function formatPercent(n) {
    if (n == null || isNaN(n)) return '-';
    const s = Number(n).toFixed(4);
    return (Number(n) >= 0 ? '+' : '') + s + '%';
  }

  // --- 데이터 요청 함수 (클라이언트 사이드) ---
  async function fetchJson(url, options = {}) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`Fetch failed for ${url}:`, e);
      // CORS 에러가 발생하면 사용자에게 안내
      if (e instanceof TypeError) {
        const tbody = $('#table-body');
        if (tbody) tbody.innerHTML = `<tr><td colspan="17" class="loading" style="color: #f6465d;">CORS 오류 발생! 브라우저 확장 프로그램(CORS Unblock 등)을 설치하고 활성화해주세요.</td></tr>`;
      }
      throw e;
    }
  }

  function getExchangeRate() {
    return fetchJson(EXCHANGE_RATE_URL).then(data => {
      const item = Array.isArray(data) ? data.find(d => d.name === 'USDKRW=X') : null;
      return (item && item.rate) ? item.rate : 1350;
    }).catch(() => 1350);
  }

  function getUpbitTickers(markets) {
    if (!markets.length) return Promise.resolve([]);
    return fetchJson(UPBIT_TICKER_URL + markets.join(','));
  }

  function getBithumbTickers() {
    return fetchJson(BITHUMB_TICKER_URL).then(res => {
      const data = res.data || {};
      return Object.keys(data).reduce((acc, key) => {
        if (key !== 'date') acc[key] = parseFloat(data[key].closing_price);
        return acc;
      }, {});
    }).catch(() => ({}));
  }

  function getOkxTickers() {
    return fetchJson(OKX_TICKER_URL).then(res =>
      (res.data || []).filter(t => t.instId.endsWith('-USDT')).reduce((acc, t) => {
        acc[t.instId.replace('-USDT', '')] = parseFloat(t.last);
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  async function getHyperliquidTickers() {
    const combined = {};
    try {
      const data = await fetchJson(HYPERLIQUID_TICKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'metaAndAssetCtxs' }) });
      if (Array.isArray(data) && data.length >= 2 && data[0] && Array.isArray(data[0].universe)) {
        data[0].universe.forEach((u, i) => {
          const ctx = data[1][i];
          if (u.name && ctx) {
            if (!combined[u.name]) combined[u.name] = {};
            combined[u.name].spot = parseFloat(ctx.oraclePx);
            combined[u.name].funding = parseFloat(ctx.funding);
          }
        });
      }
    } catch (e) { /* ignore */ }
    try {
      const perpRes = await fetchJson(HYPERLIQUID_TICKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'allMids' }) });
      if (perpRes) {
        for (const [key, val] of Object.entries(perpRes)) {
          if (!combined[key]) combined[key] = {};
          combined[key].perp = parseFloat(val);
        }
      }
    } catch (e) { /* ignore */ }
    return combined;
  }

  function getGateioTickers() {
    return fetchJson(GATEIO_TICKER_URL).then(list =>
      list.filter(t => t.currency_pair.endsWith('_USDT')).reduce((acc, t) => {
        acc[t.currency_pair.replace('_USDT', '')] = parseFloat(t.last);
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  function getBitgetTickers() {
    return fetchJson('https://api.bitget.com/api/v2/spot/market/tickers').then(res =>
      (res.data || []).filter(t => t.symbol.endsWith('USDT')).reduce((acc, t) => {
        acc[t.symbol.replace('USDT', '')] = parseFloat(t.lastPr);
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  // --- 선물 데이터 ---
  function getOkxFuturesTickers() {
    return fetchJson(OKX_FUTURES_TICKER_URL).then(res =>
      (res.data || []).filter(t => t.instId.endsWith('-USDT-SWAP')).reduce((acc, t) => {
        acc[t.instId.replace('-USDT-SWAP', '')] = { price: parseFloat(t.last) };
        return acc;
      }, {})
    ).catch(() => ({}));
  }

  async function getUpbitMarkets() {
    const res = await fetch(UPBIT_MARKETS_URL);
    if (!res.ok) throw new Error('업비트 마켓 목록을 가져올 수 없습니다.');
    const markets = await res.json();
    return markets.filter(m => m.market.startsWith('KRW-')).map(m => m.market);
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

  // [추가] Hyperliquid 현물 가격 주기적 폴링 함수
  async function pollHyperliquidSpot() {
    try {
      const data = await fetchJson(HYPERLIQUID_TICKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
      });
      if (Array.isArray(data) && data.length >= 2 && data[0] && Array.isArray(data[0].universe)) {
        const universe = data[0].universe;
        const ctxs = data[1];
        universe.forEach((u, i) => {
          const ctx = ctxs[i];
          // 해당 코인이 테이블에 존재하고, 유효한 오라클 가격이 있을 때만 업데이트
          if (u.name && ctx && ctx.oraclePx && allRows.some(row => row.name === u.name)) {
            updateRowData(u.name, { hyperliquid_spot: parseFloat(ctx.oraclePx) });
          }
        });
      }
    } catch (e) { /* 오류는 fetchJson 내부에서 로깅되므로 여기서는 무시 */ }
  }

  // [추가] Bitget 현물/선물 가격 주기적 폴링 함수 (WebSocket 불안정으로 인한 대체)
  async function pollBitgetPrices() {
    try {
      const spotRes = await fetchJson('https://api.bitget.com/api/v2/spot/market/tickers');
      if (spotRes && spotRes.data) {
        spotRes.data.forEach(t => {
          if (t.symbol.endsWith('USDT') && allRows.some(row => row.name === t.symbol.replace('USDT', ''))) {
            updateRowData(t.symbol.replace('USDT', ''), { bitget: parseFloat(t.lastPr) });
          }
        });
      }
    } catch (e) { /* 오류는 fetchJson 내부에서 로깅되므로 여기서는 무시 */ }

    try {
      const perpRes = await fetchJson('https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES');
      if (perpRes && perpRes.data) {
        perpRes.data.forEach(t => {
          if (t.symbol.endsWith('USDT') && allRows.some(row => row.name === t.symbol.replace('USDT', ''))) {
            updateRowData(t.symbol.replace('USDT', ''), { bitget_perp: parseFloat(t.lastPr) });
          }
        });
      }
    } catch (e) { /* 오류는 fetchJson 내부에서 로깅되므로 여기서는 무시 */ }
  }

  // --- 실시간 데이터 처리 (웹소켓) ---
  function connectWebsockets(markets) {
    const symbols = markets.map(m => m.replace('KRW-', ''));
    connectUpbitSocket(markets);
    connectBithumbSocket(symbols);
    connectBinanceSocket(symbols);
    connectBybitSocket(symbols);
    connectBinanceFuturesSocket(symbols);
    connectBybitFuturesSocket(symbols);
    connectOkxSocket(symbols);
    connectOkxFuturesSocket(symbols);
    connectGateioSocket(symbols);
    connectGateioFuturesSocket(symbols);
    connectHyperliquidFuturesSocket(symbols); // Hyperliquid 현물은 실시간 스트림을 지원하지 않아 새로고침 시에만 업데이트됩니다.
  }

  function reconnect(name, connectFn) {
    console.log(`${name} 웹소켓 연결이 끊겼습니다. 3초 후 재연결합니다.`);
    if (sockets[name]) {
      sockets[name].close();
    }
    setTimeout(connectFn, 3000);
  }

  function connectUpbitSocket(markets) {
    const name = 'Upbit';
    if (sockets[name]) sockets[name].close();
    const ws = new WebSocket('wss://api.upbit.com/websocket/v1');
    sockets[name] = ws;
    ws.onopen = () => {
      console.log(`${name} 웹소켓 연결 성공`);
      ws.send(JSON.stringify([
        { ticket: 'kimchi-premium-monitor' },
        // 'ticker' 타입보다 'trade' 타입이 더 빠른 실시간 체결 데이터를 제공합니다.
        { type: 'trade', codes: markets }
      ]));
    };
    ws.onmessage = async (e) => {
      const data = await (e.data instanceof Blob ? e.data.text() : e.data);
      const t = JSON.parse(data);
      updateRowData(t.code.replace('KRW-', ''), { upbit: t.trade_price });
    };
    ws.onclose = () => reconnect(name, () => connectUpbitSocket(markets));
  }

  function connectBithumbSocket(symbols) {
    const name = 'Bithumb';
    if (sockets[name]) sockets[name].close();
    const ws = new WebSocket('wss://pubwss.bithumb.com/pub/ws');
    sockets[name] = ws;
    ws.onopen = () => {
      console.log(`${name} 웹소켓 연결 성공`);
      const krwSymbols = symbols.map(s => `${s}_KRW`);
      // 'ticker'의 'MID' 타입보다 'transaction' 타입이 더 빠른 실시간 체결 데이터를 제공합니다.
      ws.send(JSON.stringify({ type: 'transaction', symbols: krwSymbols }));
    };
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data);
      // 'transaction' 타입의 메시지를 처리합니다.
      if (t.type === 'transaction' && t.content && t.content.list) {
        t.content.list.forEach(tx => {
            updateRowData(tx.symbol.replace('_KRW', ''), { bithumb: parseFloat(tx.contPrice) });
        });
      }
    };
    ws.onclose = () => reconnect(name, () => connectBithumbSocket(symbols));
  }

  function connectBinanceSocket(symbols) {
    const name = 'Binance';
    if (sockets[name]) sockets[name].close();
    const streams = symbols.map(s => `${s.toLowerCase()}usdt@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    sockets[name] = ws;
    ws.onopen = () => console.log(`${name} 웹소켓 연결 성공`);
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data).data;
      if (t.e === '24hrTicker') {
        updateRowData(t.s.replace('USDT', ''), { binance: parseFloat(t.c) });
      }
    };
    ws.onclose = () => reconnect(name, () => connectBinanceSocket(symbols));
  }

  function connectBybitSocket(symbols) {
    const name = 'Bybit';
    if (sockets[name]) {
      sockets[name].onclose = null;
      sockets[name].close();
    }
    const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');
    sockets[name] = ws;
    let pingInterval = null;
    const cleanup = () => clearInterval(pingInterval);

    ws.onopen = () => {
      console.log(`${name} 웹소켓 연결 성공`);
      const args = symbols.map(s => `tickers.${s}USDT`);
      
      // [수정] 한 번에 너무 많은 심볼을 구독하면 연결이 끊길 수 있으므로, 청크로 나누어 순차적으로 보냅니다.
      const chunkSize = 10; // Bybit는 한 번에 10개씩 구독하는 것이 안정적입니다.
      for (let i = 0; i < args.length; i += chunkSize) {
          const chunk = args.slice(i, i + chunkSize);
          setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 'subscribe', args: chunk }));
              }
          }, (i / chunkSize) * 100); // 100ms 간격으로 전송
      }

      pingInterval = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send('{"op":"ping"}'); }, 20000);
    };
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data);
      if (t.topic && t.topic.startsWith('tickers') && t.data) {
        updateRowData(t.data.symbol.replace('USDT', ''), { bybit: parseFloat(t.data.lastPrice) });
      }
    };
    ws.onclose = () => {
        console.log(`${name} 웹소켓 연결이 끊겼습니다. 0.5초 후 재연결합니다.`);
        cleanup();
        setTimeout(() => connectBybitSocket(symbols), 500);
    };
    ws.onerror = (err) => {
        console.error(`${name} 웹소켓 오류 발생:`, err);
        ws.close();
    };
  }

  function connectBinanceFuturesSocket(symbols) {
    const name = 'BinanceFutures';
    if (sockets[name]) sockets[name].close();
    const streams = symbols.map(s => `${s.toLowerCase()}usdt@ticker`).join('/');
    const ws = new WebSocket(`wss://fstream.binance.com/stream?streams=${streams}`);
    sockets[name] = ws;
    ws.onopen = () => console.log(`${name} 웹소켓 연결 성공`);
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data).data;
      if (t.e === '24hrTicker') {
        // 선물 가격이므로 'binance_perp' 키로 업데이트합니다.
        updateRowData(t.s.replace('USDT', ''), { binance_perp: parseFloat(t.c) });
      }
    };
    ws.onclose = () => reconnect(name, () => connectBinanceFuturesSocket(symbols));
  }

  function connectBybitFuturesSocket(symbols) {
    const name = 'BybitFutures';
    if (sockets[name]) {
      sockets[name].onclose = null;
      sockets[name].close();
    }
    const ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');
    sockets[name] = ws;
    let pingInterval = null;
    const cleanup = () => clearInterval(pingInterval);

    ws.onopen = () => {
      console.log(`${name} 웹소켓 연결 성공`);
      const args = symbols.map(s => `tickers.${s}USDT`);

      // 현물과 동일하게, 선물도 안정성을 위해 순차적으로 구독 요청합니다.
      const chunkSize = 10;
      for (let i = 0; i < args.length; i += chunkSize) {
          const chunk = args.slice(i, i + chunkSize);
          setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 'subscribe', args: chunk }));
              }
          }, (i / chunkSize) * 100);
      }

      pingInterval = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send('{"op":"ping"}'); }, 20000);
    };
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data);
      // Bybit 웹소켓은 가격 변동이 없을 때 'lastPrice' 필드를 생략하고 보냅니다.
      // 이 경우 parseFloat(undefined)가 NaN이 되므로, lastPrice 필드가 실제로 존재할 때만 업데이트합니다.
      if (t.topic && t.topic.startsWith('tickers') && t.data && t.data.lastPrice) {
        updateRowData(t.data.symbol.replace('USDT', ''), { bybit_perp: parseFloat(t.data.lastPrice) });
      }
    };
    ws.onclose = () => {
        console.log(`${name} 웹소켓 연결이 끊겼습니다. 3초 후 재연결합니다.`);
        cleanup();
        setTimeout(() => connectBybitFuturesSocket(symbols), 3000);
    };
    ws.onerror = (err) => {
        console.error(`${name} 웹소켓 오류 발생:`, err);
        ws.close();
    };
  }

  function connectOkxSocket(symbols) {
    const name = 'OKX';
    if (sockets[name]) sockets[name].close();
    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
    sockets[name] = ws;
    ws.onopen = () => {
        console.log(`${name} 웹소켓 연결 성공`);
        const args = symbols.map(s => ({ channel: 'tickers', instId: `${s}-USDT` }));
        ws.send(JSON.stringify({ op: 'subscribe', args }));
    };
    ws.onmessage = (e) => {
        const res = JSON.parse(e.data);
        if (res.data) {
            res.data.forEach(t => {
                updateRowData(t.instId.replace('-USDT', ''), { okx: parseFloat(t.last) });
            });
        }
    };
    ws.onclose = () => reconnect(name, () => connectOkxSocket(symbols));
    setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 25000);
  }

  function connectOkxFuturesSocket(symbols) {
    const name = 'OKXFutures';
    if (sockets[name]) sockets[name].close();
    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
    sockets[name] = ws;
    ws.onopen = () => {
        console.log(`${name} 웹소켓 연결 성공`);
        const args = symbols.map(s => ({ channel: 'tickers', instId: `${s}-USDT-SWAP` }));
        ws.send(JSON.stringify({ op: 'subscribe', args }));
    };
    ws.onmessage = (e) => {
        const res = JSON.parse(e.data);
        if (res.data) {
            res.data.forEach(t => {
                updateRowData(t.instId.replace('-USDT-SWAP', ''), { okx_perp: parseFloat(t.last) });
            });
        }
    };
    ws.onclose = () => reconnect(name, () => connectOkxFuturesSocket(symbols));
    setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 25000);
  }

  function connectGateioSocket(symbols) {
    const name = 'Gateio';
    if (sockets[name]) {
      sockets[name].onclose = null; // 이전 핸들러 제거
      sockets[name].close();
    }

    const ws = new WebSocket('wss://api.gateio.ws/ws/v4/');
    sockets[name] = ws;
    let pingInterval = null;

    const cleanup = () => clearInterval(pingInterval);

    ws.onopen = () => {
        console.log(`${name} 웹소켓 연결 성공`);
        const payload = symbols.map(s => `${s}_USDT`);

        // [수정] 한 번에 모든 구독을 요청하면 서버가 연결을 끊으므로, 20개씩 순차적으로 요청합니다.
        const chunkSize = 20;
        let i = 0;
        function subscribeSequentially() {
            if (i >= payload.length || ws.readyState !== WebSocket.OPEN) return;
            const chunk = payload.slice(i, i + chunkSize);
            ws.send(JSON.stringify({ time: Math.floor(Date.now() / 1000), channel: 'spot.tickers', event: 'subscribe', payload: chunk }));
            i += chunkSize;
            setTimeout(subscribeSequentially, 100); // 100ms 간격으로 다음 청크 전송
        }
        subscribeSequentially();

        pingInterval = setInterval(() => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ time: Math.floor(Date.now() / 1000), channel: 'spot.ping' }));
        }, 9000);
    };

    ws.onmessage = (e) => {
        const res = JSON.parse(e.data);
        if (res.channel === 'spot.tickers' && res.event === 'update' && res.result) {
            const t = res.result;
            updateRowData(t.currency_pair.replace('_USDT', ''), { gate: parseFloat(t.last) });
        }
    };

    ws.onclose = () => {
        console.log(`${name} 웹소켓 연결이 끊겼습니다. 0.5초 후 재연결합니다.`);
        cleanup();
        setTimeout(() => connectGateioSocket(symbols), 500);
    };

    ws.onerror = () => ws.close();
  }

  function connectGateioFuturesSocket(symbols) {
    const name = 'GateioFutures';
    if (sockets[name]) {
      sockets[name].onclose = null; // 이전 핸들러 제거
      sockets[name].close();
    }

    const ws = new WebSocket('wss://fx-ws.gateio.ws/v4/ws/usdt');
    sockets[name] = ws;
    let pingInterval = null;

    const cleanup = () => clearInterval(pingInterval);

    ws.onopen = () => {
        console.log(`${name} 웹소켓 연결 성공`);
        const payload = symbols.map(s => `${s}_USDT`);
        // [수정] 현물과 동일하게, 선물도 안정성을 위해 순차적으로 구독 요청합니다.
        const chunkSize = 20;
        let i = 0;
        function subscribeSequentially() {
            if (i >= payload.length || ws.readyState !== WebSocket.OPEN) return;
            const chunk = payload.slice(i, i + chunkSize);
            ws.send(JSON.stringify({ time: Math.floor(Date.now() / 1000), channel: 'futures.tickers', event: 'subscribe', payload: chunk }));
            i += chunkSize;
            setTimeout(subscribeSequentially, 100); // 100ms 간격으로 다음 청크 전송
        }
        subscribeSequentially();

        pingInterval = setInterval(() => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ time: Math.floor(Date.now() / 1000), channel: 'futures.ping' }));
        }, 9000);
    };

    ws.onmessage = (e) => {
        const res = JSON.parse(e.data);
        if (res.channel === 'futures.tickers' && res.event === 'update' && Array.isArray(res.result)) {
            res.result.forEach(t => {
                updateRowData(t.contract.replace('_USDT', ''), { gate_perp: parseFloat(t.last) });
            });
        }
    };

    ws.onclose = () => {
        console.log(`${name} 웹소켓 연결이 끊겼습니다. 0.5초 후 재연결합니다.`);
        cleanup();
        setTimeout(() => connectGateioFuturesSocket(symbols), 500);
    };
    ws.onerror = () => ws.close();
  }

  function connectHyperliquidFuturesSocket(symbols) {
    const name = 'Hyperliquid';
    // 이전 연결이 있다면, 재연결 로직이 중복 실행되지 않도록 onclose 핸들러를 제거하고 닫습니다.
    if (sockets[name]) {
      sockets[name].onclose = null;
      sockets[name].close();
    }

    let ws;
    let pingInterval = null;
    let subscribeInterval = null;
    let inactivityTimeout = null;

    const connect = () => {
        ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
        sockets[name] = ws;

        const cleanup = () => {
            clearInterval(pingInterval);
            clearTimeout(inactivityTimeout);
            clearInterval(subscribeInterval);
        };

        const resetInactivityTimeout = () => {
            clearTimeout(inactivityTimeout);
            // 30초 동안 아무 메시지(데이터, pong 등)도 받지 못하면 연결이 끊긴 것으로 간주하고 재연결합니다.
            inactivityTimeout = setTimeout(() => {
                console.warn('Hyperliquid 연결이 응답하지 않아 강제로 재연결합니다.');
                ws.close();
            }, 30000);
        };

        ws.onopen = () => {
            console.log(`${name} 웹소켓 연결 성공`);

            // [수정] 1. 'allMids'를 먼저 구독하여 모든 코인의 초기 가격을 빠르게 가져옵니다.
            // 이 데이터는 거래가 없을 때도 가격을 표시해주는 역할을 합니다.
            ws.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'allMids' } }));

            // [수정] 2. 'trades' 채널을 추가로 구독하여 실제 거래 데이터를 실시간으로 수신합니다.
            // 이를 통해 OKX와 같이 1초에 여러 번 업데이트되는 빠른 실시간 효과를 제공합니다.
            const tradeSubscriptions = symbols
                .filter(s => s && s.length > 0)
                .map(coin => ({
                    method: 'subscribe',
                    subscription: { type: 'trades', coin }
                }));
            
            // 서버 부하를 줄이기 위해 구독 메시지를 순차적으로 보냅니다.
            let i = 0;
            subscribeInterval = setInterval(() => {
                if (i < tradeSubscriptions.length) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(tradeSubscriptions[i]));
                    }
                    i++;
                } else {
                    clearInterval(subscribeInterval);
                }
            }, 10); // 10ms 간격으로 구독하여 더 빠르게 구독 시작

            // 공식 문서에 따라, 클라이언트는 15초마다 ping을 보내 연결을 유지해야 합니다.
            pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ method: 'ping' }));
                }
            }, 15000);
            resetInactivityTimeout();
        };

        ws.onmessage = (e) => {
            resetInactivityTimeout(); // 메시지를 수신했으므로 연결이 활성 상태입니다.
            const res = JSON.parse(e.data);
            if (res.channel === 'allMids' && res.data) {
                // 'allMids'는 초기 가격 및 호가 중간가 스냅샷을 제공합니다.
                const { coin, mid } = res.data;
                updateRowData(coin, { hyperliquid_perp: parseFloat(mid) });
            } else if (res.channel === 'trades' && res.data) {
                // 'trades' 채널은 실제 체결 데이터를 제공하여 더 빠른 업데이트를 보장합니다.
                res.data.forEach(trade => {
                    updateRowData(trade.coin, { hyperliquid_perp: parseFloat(trade.px) });
                });
            } else if (res.channel === 'ping') {
                // 서버가 보낸 ping에 pong으로 응답합니다.
                ws.send(JSON.stringify({ method: 'pong' }));
            }
        };

        ws.onclose = () => {
            console.log(`${name} 웹소켓 연결이 끊겼습니다. 3초 후 재연결합니다.`);
            cleanup();
            setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
            console.error(`Hyperliquid 웹소켓 오류:`, error);
            ws.close(); // 오류 발생 시 onclose를 트리거하여 재연결 로직을 실행합니다.
        };
    };

    connect(); // 재귀적으로 재연결되는 함수를 최초 실행합니다.
  }

  function updateFunbiRowData(symbol, newData) {
    const row = funbiRows.find(r => r.name === symbol);
    if (!row) return;

    const oldValues = {};
    for (const key in newData) {
        oldValues[key] = row[key];
    }

    Object.assign(row, newData);

    const fmtRate = (val) => {
        if (val == null || isNaN(val)) return '-';
        const pct = (val * 100).toFixed(4) + '%';
        const colorClass = val > 0 ? 'positive' : (val < 0 ? 'negative' : '');
        return `<span class="${colorClass}">${pct}</span>`;
    };

    for (const [exchange, value] of Object.entries(newData)) {
        const cell = $(`#funbi-cell-${exchange}-${symbol}`);
        if (cell) {
            cell.innerHTML = fmtRate(value);
            
            const oldValue = oldValues[exchange];
            if (oldValue != null && value !== oldValue) {
                // 펀비 업데이트 시 깜빡임 효과 추가
                cell.classList.add('price-flash');
                setTimeout(() => cell.classList.remove('price-flash'), 700);
            }
        }
    }
  }

  function connectBinanceFundingSocket(symbols) {
    const name = 'BinanceFunding';
    if (sockets[name]) sockets[name].close();
    const streams = symbols.map(s => `${s.toLowerCase()}usdt@markPrice`).join('/');
    const ws = new WebSocket(`wss://fstream.binance.com/stream?streams=${streams}`);
    sockets[name] = ws;
    ws.onopen = () => console.log(`${name} 웹소켓 연결 성공`);
    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.data && msg.data.s) {
            const symbol = msg.data.s.replace('USDT', '');
            const fundingRate = parseFloat(msg.data.r);
            const nextTime = parseInt(msg.data.T, 10);

            updateFunbiRowData(symbol, { binance: fundingRate });

            // BTC 데이터로 대표 펀딩 시간을 업데이트합니다.
            if (symbol === 'BTC' && nextTime && standardNextFundingTime !== nextTime) {
                standardNextFundingTime = nextTime;
            }
        }
    };
    ws.onclose = () => reconnect(name, () => connectBinanceFundingSocket(symbols));
  }

  function connectBybitFundingSocket(symbols) {
    const name = 'BybitFunding';
    if (sockets[name]) { sockets[name].onclose = null; sockets[name].close(); }
    const ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');
    sockets[name] = ws;
    let pingInterval = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send('{"op":"ping"}'); }, 20000);
    ws.onopen = () => {
        console.log(`${name} 웹소켓 연결 성공`);
        const args = symbols.map(s => `tickers.${s}USDT`);

        // Bybit는 한 번에 많은 심볼을 구독하면 연결을 끊을 수 있으므로, 10개씩 나누어 순차적으로 요청합니다.
        const chunkSize = 10;
        for (let i = 0; i < args.length; i += chunkSize) {
            const chunk = args.slice(i, i + chunkSize);
            setTimeout(() => {
                // 재연결 도중 연결이 끊어지는 경우를 대비해 readyState를 다시 확인합니다.
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ op: 'subscribe', args: chunk }));
                }
            }, (i / chunkSize) * 100); // 100ms 간격으로 전송
        }
    };
    ws.onmessage = (e) => {
        const t = JSON.parse(e.data);
        if (t.topic && t.topic.startsWith('tickers') && t.data && typeof t.data.fundingRate !== 'undefined') {
            updateFunbiRowData(t.data.symbol.replace('USDT', ''), { bybit: parseFloat(t.data.fundingRate) });
        }
    };
    ws.onclose = () => { clearInterval(pingInterval); reconnect(name, () => connectBybitFundingSocket(symbols)); };
    ws.onerror = (err) => { console.error(`${name} 웹소켓 오류 발생:`, err); ws.close(); };
  }

  function connectOkxFundingSocket(symbols) {
    const name = 'OKXFunding';
    if (sockets[name]) sockets[name].close();
    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
    sockets[name] = ws;
    let pingInterval = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 25000);
    ws.onopen = () => {
        console.log(`${name} 웹소켓 연결 성공`);
        const args = symbols.map(s => ({ channel: 'funding-rate', instId: `${s}-USDT-SWAP` }));
        ws.send(JSON.stringify({ op: 'subscribe', args }));
    };
    ws.onmessage = (e) => {
        if (e.data === 'pong') return;
        const res = JSON.parse(e.data);
        if (res.data) {
            res.data.forEach(item => {
                updateFunbiRowData(item.instId.replace('-USDT-SWAP', ''), { okx: parseFloat(item.fundingRate) });
            });
        }
    };
    ws.onclose = () => { clearInterval(pingInterval); reconnect(name, () => connectOkxFundingSocket(symbols)); };
  }

  function updateRowData(symbol, newData) {
    const row = allRows.find(r => r.name === symbol);
    if (!row) return;

    const updatedExchange = Object.keys(newData)[0];
    const newPrice = newData[updatedExchange];
    const oldPrice = row[updatedExchange];

    Object.assign(row, newData);

    const premiumBasePrice = premiumBase === 'bithumb' ? row.bithumb : row.upbit;

    const updateCell = (exchange, price) => {
      const cell = $(`#cell-${exchange}-${symbol}`);
      if (!cell) return;

      let content;
      if (exchange === 'upbit' || exchange === 'bithumb') {
        content = price != null ? `<span class="price-main">${formatNumber(price, 0)}</span>` : '-';
      } else {
        if (price == null) {
          content = '-';
        } else {
          const priceKrw = price * krwPerUsd;
          let premiumHtml = '';
          if (premiumBasePrice != null && premiumBasePrice > 0 && price > 0) {
            const premium = ((premiumBasePrice / priceKrw) - 1) * 100;
            const premiumClass = premium > 0 ? 'premium-high' : 'premium-low';
            premiumHtml = `<span class="premium-val ${premiumClass}">${formatPercent(premium)}</span>`;
          }
          content = `<span class="price-main">${formatNumber(priceKrw, 0)}</span><span class="sub-price">$${formatNumber(price, 4)}</span>${premiumHtml}`;
        }
      }
      cell.innerHTML = content;

      const isPriceChanged = (exchange === updatedExchange && oldPrice != null && newPrice !== oldPrice);
      if (isPriceChanged) {
        const priceSpan = cell.querySelector('.price-main');
        if (priceSpan) {
          const animationClass = newPrice > oldPrice ? 'price-up-animation' : 'price-down-animation';
          priceSpan.classList.add(animationClass);
          setTimeout(() => {
            priceSpan.classList.remove(animationClass);
          }, 700);
        }
      }
    };

    // 방금 업데이트된 가격 셀 업데이트
    updateCell(updatedExchange, row[updatedExchange]);

    // 김프 기준가가 변경되었을 수 있으므로, 해당 코인의 모든 해외거래소 셀을 다시 계산하여 업데이트
    const exchangesToUpdate = ['binance', 'binance_perp', 'bybit', 'bybit_perp', 'okx', 'okx_perp', 'bitget', 'bitget_perp', 'gate', 'gate_perp', 'hyperliquid_spot', 'hyperliquid_perp'];
    if (updatedExchange === 'upbit' || updatedExchange === 'bithumb') {
        exchangesToUpdate.forEach(ex => {
            if (row[ex] != null) updateCell(ex, row[ex]);
        });
    }
  }

  // 초기 테이블 렌더링 (스켈레톤)
  function renderTable(rows) {
    const tbody = $('#table-body');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="17" class="loading">매칭되는 코인이 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(r => {      
      const basePrice = r[premiumBase];
      const changeClass = r.change != null ? (r.change >= 0 ? 'positive' : 'negative') : '';
      const fmtKrw = v => v != null ? `<span class="price-main">${formatNumber(v, 0)}</span>` : '-';
      
      const fmtOverseas = (price) => {
        if (price == null) return '-';
        const priceKrw = price * krwPerUsd;
        let premiumHtml = '';
        if (basePrice != null && basePrice > 0 && price > 0) {
          const premium = ((basePrice / priceKrw) - 1) * 100;
          const premiumClass = premium > 0 ? 'premium-high' : 'premium-low';
          premiumHtml = `<span class="premium-val ${premiumClass}">${formatPercent(premium)}</span>`;
        }
        return `<span class="price-main">${formatNumber(priceKrw, 0)}</span><span class="sub-price">$${formatNumber(price, 4)}</span>${premiumHtml}`;
      };

      const displayName = COIN_NAMES[r.name] ? COIN_NAMES[r.name] : r.name;
      const imgUrl = getCoinIconUrl(r.name);

      const premiums = [r.binance, r.binance_perp, r.bybit, r.bybit_perp, r.okx, r.okx_perp, r.bitget, r.bitget_perp, r.gate, r.gate_perp, r.hyperliquid_spot, r.hyperliquid_perp]
        .filter(p => p != null && basePrice != null && basePrice > 0 && p > 0).map(p => ((basePrice / (p * krwPerUsd)) - 1) * 100);
      const maxPremium = premiums.length > 0 ? Math.max(...premiums) : 0;
      const rowClass = maxPremium >= 5 ? 'premium-alert' : '';

      return `
        <tr class="${rowClass}">
          <td class="name">
            <img class="coin-icon" src="${imgUrl}" alt="" referrerpolicy="no-referrer" onerror="this.src='${COIN_IMG_FALLBACK}'">
            <div><span class="coin-name">${r.name}</span><span class="coin-korean-name">${displayName}</span></div>
          </td>
          <td id="cell-upbit-${r.name}" class="text-right col-upbit">${fmtKrw(r.upbit)}</td>
          <td id="cell-bithumb-${r.name}" class="text-right col-bithumb">${fmtKrw(r.bithumb)}</td>
          <td id="cell-binance-${r.name}" class="text-right col-binance">${fmtOverseas(r.binance)}</td>
          <td id="cell-binance_perp-${r.name}" class="text-right col-binance_perp">${fmtOverseas(r.binance_perp)}</td>
          <td id="cell-bybit-${r.name}" class="text-right col-bybit">${fmtOverseas(r.bybit)}</td>
          <td id="cell-bybit_perp-${r.name}" class="text-right col-bybit_perp">${fmtOverseas(r.bybit_perp)}</td>
          <td id="cell-okx-${r.name}" class="text-right col-okx">${fmtOverseas(r.okx)}</td>
          <td id="cell-okx_perp-${r.name}" class="text-right col-okx_perp">${fmtOverseas(r.okx_perp)}</td>
          <td id="cell-bitget-${r.name}" class="text-right col-bitget">${fmtOverseas(r.bitget)}</td>
          <td id="cell-bitget_perp-${r.name}" class="text-right col-bitget_perp">${fmtOverseas(r.bitget_perp)}</td>
          <td id="cell-gate-${r.name}" class="text-right col-gate">${fmtOverseas(r.gate)}</td>
          <td id="cell-gate_perp-${r.name}" class="text-right col-gate_perp">${fmtOverseas(r.gate_perp)}</td>
          <td id="cell-hyperliquid_spot-${r.name}" class="text-right col-hyperliquid_spot">${fmtOverseas(r.hyperliquid_spot)}</td>
          <td id="cell-hyperliquid_perp-${r.name}" class="text-right col-hyperliquid_perp">${fmtOverseas(r.hyperliquid_perp)}</td>
          <td class="text-right ${changeClass}">${r.change != null ? formatPercent(r.change) : '-'}</td>
          <td class="text-right volume">${formatNumber((r.volume || 0) / 1e6, 0)}백만</td>
        </tr>
      `;
    }).join('');
  }

  // --- 펀비 비교 기능 ---
  function loadFunbi() {
    const tbody = $('#funbi-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading">펀딩비 데이터를 불러오는 중...</td></tr>';
    
    // 1. 김프 비교 목록(allRows)을 기준으로 즉시 테이블 구조를 만듭니다.
    const targetList = allRows.length > 0 ? allRows : [];
    funbiRows = targetList.map(row => ({
        name: row.name,
        binance: null, bybit: null, okx: null,
        bitget: null, gate: null, hyperliquid: null
    }));
    applyFunbiSortAndFilter(); // 빈 테이블 구조를 먼저 렌더링합니다.

    // 2. 웹소켓을 즉시 연결하여 바이낸스, 바이빗, OKX 데이터를 실시간으로 받습니다.
    if (!funbiSocketsConnected) {
        const symbols = funbiRows.map(r => r.name);
        // 김프 데이터 로딩이 완료되어 심볼 목록이 있을 때만 소켓에 연결합니다.
        if (symbols.length > 0) {
            connectBinanceFundingSocket(symbols);
            connectBybitFundingSocket(symbols);
            connectOkxFundingSocket(symbols);
            funbiSocketsConnected = true;
        }
    }

    // 3. 백그라운드에서 나머지 거래소(Bitget, Gate, Hyperliquid) 데이터를 서버로부터 가져옵니다.
    fetch('/api/data').then(res => res.json()).then(data => {
      if (funbiTimer) clearInterval(funbiTimer);

      // 다음 펀딩 시간 설정 (바이낸스 시간을 기준으로 통일)
      // standardNextFundingTime은 이제 바이낸스 웹소켓에서 직접 수신하여 설정합니다.
      hyperliquidNextFundingTime = Math.ceil(Date.now() / 3600000) * 3600000;

      // 가져온 데이터로 funbiRows를 업데이트합니다.
      funbiRows.forEach(row => {
          const sym = row.name;
          row.bitget = data.bitgetFuturesMap[sym]?.funding ?? null;
          row.gate = data.gateioFuturesMap[sym]?.funding ?? null;
          row.hyperliquid = data.hyperliquidMap[sym]?.funding ?? null;
      });
      
      applyFunbiSortAndFilter(); // 업데이트된 데이터로 테이블을 다시 렌더링하고 정렬을 적용합니다.
      updateFunbiTimers();

      funbiTimer = setInterval(() => {
        if ($('#section-funbi').classList.contains('active')) {
          updateFunbiTimers();
        }
      }, 1000);
    }).catch(e => {
      // fetch가 실패해도 웹소켓 데이터는 계속 표시되도록, 전체 테이블을 덮어쓰지 않고 콘솔에만 오류를 기록합니다.
      console.error("펀딩비 일부 데이터(Bitget, Gate, HL) 로딩 실패:", e.message);
      // 타이머는 계속 돌도록 설정해줍니다.
      if (funbiTimer) clearInterval(funbiTimer);
      hyperliquidNextFundingTime = Math.ceil(Date.now() / 3600000) * 3600000;
      updateFunbiTimers();
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
            <tr data-symbol="${r.name}">
                <td class="name">
                    <img class="coin-icon" src="${imgUrl}" alt="" referrerpolicy="no-referrer" onerror="this.src='${COIN_IMG_FALLBACK}'">
                    <div><span class="coin-name">${r.name}</span><span class="coin-korean-name">${displayName}</span></div>
                </td>
                <td id="funbi-cell-binance-${r.name}" class="text-right">${fmtRate(r.binance)}</td>
                <td id="funbi-cell-bybit-${r.name}" class="text-right">${fmtRate(r.bybit)}</td>
                <td id="funbi-cell-okx-${r.name}" class="text-right">${fmtRate(r.okx)}</td>
                <td id="funbi-cell-bitget-${r.name}" class="text-right">${fmtRate(r.bitget)}</td>
                <td id="funbi-cell-gate-${r.name}" class="text-right">${fmtRate(r.gate)}</td>
                <td id="funbi-cell-hyperliquid-${r.name}" class="text-right">${fmtRate(r.hyperliquid)}</td>
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
  let evmSockets = [];
  let whaleData = []; // 고래 데이터 저장소
  let whalePage = 1;
  let whaleItemsPerPage = 10;

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
      console.log('BTC WS connected.');
    };

    whaleSocket.onclose = function() {
      console.warn('BTC WS closed. Reconnecting...');
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
      console.log(`EVM WS for ${chainSymbol} connected.`);
      ws.send(JSON.stringify({"jsonrpc":"2.0","id": 1, "method": "eth_subscribe", "params": ["newHeads"]}));
    };
    ws.onclose = () => {
      console.warn(`EVM WS for ${chainSymbol} closed.`);
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

  // 3. SOL (솔라나) - 최근 블록 스캔 (HTTP RPC) 방식으로 변경
  let solHttpRpcIndex = 0; // HTTP RPC 인덱스
  let lastProcessedSolSlot = 0;
  const processedSolSignatures = new Set(); // 중복 처리 방지

  async function fetchSolanaRpc(body) {
      const rpcUrl = RPC_LIST.SOL[solHttpRpcIndex];
      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(rpcUrl, {
              signal: controller.signal,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const res = await response.json();
          if (res.error) throw new Error(`RPC Error: ${res.error.message}`);
          return res.result;
      } catch (e) {
          solHttpRpcIndex = (solHttpRpcIndex + 1) % RPC_LIST.SOL.length;
          console.warn(`Solana RPC ${rpcUrl} failed, switching to index ${solHttpRpcIndex}. Error: ${e.message}`);
          throw e;
      }
  }

  function parseSolTransaction(txData) {
      // 트랜잭션 성공 시에만 파싱 진행
      if (!txData || !txData.meta || !txData.meta.err) return;
  
      const signature = txData.transaction.signatures[0];
      const solRow = allRows.find(r => r.name === 'SOL');
      const solPrice = solRow?.binance || 150;
  
      // 방법 1: 네이티브 SOL 이체 감지 (가장 간단하고 확실)
      txData.transaction.message.instructions.forEach(inst => {
          if (inst.program === 'system' && inst.parsed && inst.parsed.type === 'transfer') {
              const lamports = inst.parsed.info.lamports;
              const amount = lamports / 1e9;
              const valueUsd = amount * solPrice;
              if (valueUsd >= WHALE_THRESHOLD_USD) {
                  const hashShort = signature.substring(0, 8) + '...';
                  const explorerUrl = 'https://solscan.io/tx/' + signature;
                  const infoHtml = `<a href="${explorerUrl}" target="_blank" style="color:#848e9c; text-decoration:underline;">${hashShort}</a>`;
                  addWhaleRow('SOL', amount, valueUsd, infoHtml);
              }
          }
      });

      // 방법 2: SPL 토큰(USDC, USDT) 이체 감지 (pre/post 잔액 비교로 복잡한 트랜잭션도 감지)
      // 이것이 test.html에서 사용된 핵심 로직입니다.
      const preBalances = new Map(
          txData.meta.preTokenBalances.map(b => [b.accountIndex, b.uiTokenAmount?.uiAmount || 0])
      );

      txData.meta.postTokenBalances.forEach(post => {
          const preAmount = preBalances.get(post.accountIndex) || 0;
          const postAmount = post.uiTokenAmount?.uiAmount || 0;
          const diff = postAmount - preAmount;

          if (diff > 0) { // 토큰을 받은 계정만 확인
              let symbol = null;
              if (post.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') symbol = 'USDC';
              else if (post.mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') symbol = 'USDT';

              if (symbol && diff >= WHALE_THRESHOLD_USD) {
                  const valueUsd = diff; // 스테이블코인은 수량이 곧 가치
                  const hashShort = signature.substring(0, 8) + '...';
                  const explorerUrl = 'https://solscan.io/tx/' + signature;
                  const infoHtml = `<a href="${explorerUrl}" target="_blank" style="color:#848e9c; text-decoration:underline;">${hashShort}</a>`;
                  addWhaleRow(symbol, diff, valueUsd, infoHtml);
              }
          }
      });
  }

  async function scanLatestSolanaBlock() {
      try {
          const currentSlot = await fetchSolanaRpc({ jsonrpc: "2.0", id: 1, method: "getSlot" });
          if (currentSlot <= lastProcessedSolSlot) {
              return; // 이미 처리된 블록이므로 건너뜁니다.
          }
  
          const block = await fetchSolanaRpc({
              jsonrpc: "2.0", id: 1, method: "getBlock",
              params: [currentSlot, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, transactionDetails: "full" }]
          });
  
          if (block && block.transactions) {
              for (const tx of block.transactions) {
                  const signature = tx.transaction.signatures[0];
                  if (processedSolSignatures.has(signature)) continue;
                  
                  parseSolTransaction(tx);
                  
                  processedSolSignatures.add(signature);
                  // 메모리 관리를 위해 오래된 서명 제거
                  if (processedSolSignatures.size > 1000) {
                      const oldest = processedSolSignatures.values().next().value;
                      processedSolSignatures.delete(oldest);
                  }
              }
          }
          lastProcessedSolSlot = currentSlot;
  
      } catch (e) {
          console.error("솔라나 블록 스캔 실패:", e.message);
      }
  }

  function startSolTracker() {
      // 중복 실행 방지
      if (startSolTracker.started) return;
      startSolTracker.started = true;
      
      scanLatestSolanaBlock(); // 즉시 한 번 실행
      setInterval(scanLatestSolanaBlock, 15000); // 15초마다 반복 실행
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

  async function initKimchiPremium() {
    const tbody = $('#table-body');
    tbody.innerHTML = '<tr><td colspan="17" class="loading">서버에서 데이터를 가져오는 중...</td></tr>';
    try {
      // 모든 거래소의 초기 데이터는 서버에서 안정적으로 한 번에 가져옵니다.
      // 이 방식은 클라이언트(사용자 PC)의 네트워크나 설정에 영향을 받지 않아 더 안정적입니다.
      const data = await fetch('/api/data').then(res => {
        if (!res.ok) throw new Error(`서버 데이터 로딩 실패 (HTTP ${res.status})`);
        return res.json();
      });

      // 2. 스냅샷 데이터로 테이블 채우기
      krwPerUsd = data.rate;
      setMeta(data.rate, new Date().toLocaleTimeString('ko-KR'));

      if (!data.upbitTickers) throw new Error("서버 데이터 형식 오류 (upbitTickers missing)");

      const upbitMap = data.upbitTickers.reduce((acc, t) => {
        acc[t.market.replace('KRW-', '')] = t;
        return acc;
      }, {});

      const marketBatch = data.upbitTickers.map(t => t.market);
      const matchedRows = [];

      marketBatch.forEach(market => {
        const symbol = market.replace('KRW-', '');
        const upbitData = upbitMap[symbol];
        const hasOverseasPrice = data.binanceMap[symbol] || data.bybitMap[symbol] || data.okxMap[symbol] || data.bitgetMap[symbol] || data.gateMap[symbol] || data.hyperliquidMap[symbol];

        if (hasOverseasPrice && upbitData) {
          matchedRows.push({
            name: symbol,
            change: upbitData.signed_change_rate != null ? upbitData.signed_change_rate * 100 : null,
            volume: upbitData.acc_trade_price_24h,
            upbit: upbitData.trade_price,
            bithumb: data.bithumbMap[symbol] ?? null,
            binance: data.binanceMap[symbol]?.price ?? null,
            bybit: data.bybitMap[symbol] ?? null,
            okx: data.okxMap[symbol] ?? null,
            bitget: data.bitgetMap[symbol] ?? null,
            gate: data.gateMap[symbol] ?? null,
            hyperliquid_spot: data.hyperliquidMap[symbol]?.spot ?? null,
            binance_perp: data.binanceFuturesMap[symbol]?.price ?? null,
            bybit_perp: data.bybitFuturesMap[symbol]?.price ?? null,
            okx_perp: data.okxFuturesMap[symbol]?.price ?? null,
            bitget_perp: data.bitgetFuturesMap[symbol]?.price ?? null,
            gate_perp: data.gateioFuturesMap[symbol]?.price ?? null,
            hyperliquid_perp: data.hyperliquidMap[symbol]?.perp ?? null,
          });
        }
      });

      allRows = matchedRows;
      applySortAndFilter(); // 전체 데이터로 다시 렌더링

      // 3. 웹소켓을 연결하여 실시간 업데이트를 시작합니다.
      const upbitMarkets = allRows.map(r => `KRW-${r.name}`);
      connectWebsockets(upbitMarkets);

      // 2초마다 Hyperliquid 현물 가격을 폴링하여 업데이트합니다.
      setInterval(pollHyperliquidSpot, 1000);

      // 0.5초마다 Bitget 현물/선물 가격을 폴링하여 업데이트합니다.
      setInterval(pollBitgetPrices, 500);

      // 김프 데이터 로딩 후, 펀비 탭이 활성화 상태였다면 데이터를 다시 로드하여 race condition을 해결합니다.
      if ($('#section-funbi').classList.contains('active')) {
        loadFunbi();
      }

    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="17" class="loading" style="color: #f6465d;">데이터 로딩 실패: ${err.message}</td></tr>`;
      setMeta(krwPerUsd, null);
      console.error('Failed to initialize kimchi premium data:', err);
    }
  }

  function injectAnimationStyles() {
    const style = document.createElement('style');
    style.id = 'price-animation-styles';
    if (document.getElementById(style.id)) return;

    style.textContent = `
      .price-main.price-up-animation {
        animation: price-up 0.7s ease-out;
      }
      .price-main.price-down-animation {
        animation: price-down 0.7s ease-out;
      }
      @keyframes price-up {
        from { background-color: rgba(20, 241, 149, 0.3); }
        to { background-color: transparent; }
      }
      @keyframes price-down {
        from { background-color: rgba(246, 70, 93, 0.3); }
        to { background-color: transparent; }
      }
      /* Light Theme Overrides */
      .light-theme .price-main.price-up-animation {
        animation-name: price-up-light;
      }
      .light-theme .price-main.price-down-animation {
        animation-name: price-down-light;
      }
      @keyframes price-up-light { from { background-color: rgba(20, 241, 149, 0.4); } to { background-color: transparent; } }
      @keyframes price-down-light { from { background-color: rgba(246, 70, 93, 0.4); } to { background-color: transparent; } }
    `;
    document.head.appendChild(style);
  }

  function init() {
    const searchEl = $('#search');
    const refreshBtn = $('#btn-refresh');
    if (searchEl) searchEl.addEventListener('input', applySortAndFilter);
    if (refreshBtn) refreshBtn.addEventListener('click', initKimchiPremium);

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
    injectAnimationStyles();
    initKimchiPremium();
    initWhaleTracker(); // 고래 추적 시작
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
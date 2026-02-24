(function () {
    'use strict';

    const statusEl = document.getElementById('status');
    const resultEl = document.getElementById('result');
    
    // APIs
    // OKX: 도메인 다중 시도 (차단 우회)
    // 전략: 전체 목록 조회는 무거워서 실패할 수 있으므로, BTC 단일 조회를 먼저 시도합니다.
    const OKX_URLS = [
        'https://www.okx.com/api/v5/public/funding-rate-current?instId=BTC-USDT-SWAP', // 가벼운 요청 (BTC 전용)
        'https://www.okx.com/api/v5/public/funding-rate-current?instType=SWAP',
        'https://aws.okx.com/api/v5/public/funding-rate-current?instType=SWAP'
    ];
    const BITGET_BASE = 'https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES';
    
    // 프록시 후보군 (순차적 시도)
    const PROXY_CANDIDATES = [
        url => 'https://corsproxy.io/?' + encodeURIComponent(url),
        url => 'https://api.allorigins.win/get?url=' + encodeURIComponent(url), // get 방식이 raw보다 차단 우회에 유리함
        url => 'https://thingproxy.freeboard.io/fetch/' + url,
        url => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url)
    ];

    function log(msg) {
        const line = `[${new Date().toLocaleTimeString()}] ${msg}\n`;
        statusEl.textContent += line;
        statusEl.scrollTop = statusEl.scrollHeight;
        console.log(msg);
    }

    async function fetchUrl(url) {
        // URL에 이미 ?가 있으면 &t=, 없으면 ?t=
        const separator = url.includes('?') ? '&' : '?';
        const targetUrl = `${url}${separator}t=${Date.now()}`;
        
        log(`요청: ${url}`);
        
        for (const proxyFn of PROXY_CANDIDATES) {
            const target = proxyFn(targetUrl);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃

                const res = await fetch(target, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                
                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // log(`JSON 파싱 실패: ${text.substring(0, 50)}...`);
                    continue;
                }
                
                // Proxy wrapping check (일부 프록시가 contents로 감싸서 보냄)
                if (data && data.contents && typeof data.contents === 'string') {
                    try { data = JSON.parse(data.contents); } catch(e) {}
                }

                // [디버깅] 데이터 구조 출력
                // 성공 기준: data 필드가 있고 배열이어야 함
                if (data && data.data && Array.isArray(data.data)) {
                    return data;
                }
            } catch (e) {
                // log(`프록시 실패 (${e.message}), 다음 시도...`);
            }
        }
        log(`모든 프록시 시도 실패`);
        return null;
    }

    async function runTest() {
        log('테스트 시작...');
        resultEl.innerHTML = '로딩 중...';

        // 1. OKX
        let okxRate = '-';
        let okxData = null;
        for (const domain of OKX_URLS) {
            okxData = await fetchUrl(domain);
            if (okxData && okxData.data && Array.isArray(okxData.data)) break;
            log(`OKX 도메인(${domain}) 실패, 다음 도메인 시도...`);
        }

        if (okxData && okxData.data) {
            const btc = okxData.data.find(i => i.instId === 'BTC-USDT-SWAP');
            if (btc) {
                okxRate = (parseFloat(btc.fundingRate) * 100).toFixed(4) + '%';
                log(`OKX BTC 찾음: ${JSON.stringify(btc)}`);
            } else {
                log('OKX BTC 데이터 없음');
            }
        } else {
            log('OKX 데이터 수신 실패');
        }

        // 2. Bitget
        let bitgetRate = '-';
        const bitgetData = await fetchUrl(BITGET_BASE);
        if (bitgetData && bitgetData.data) {
            const btc = bitgetData.data.find(i => i.symbol === 'BTCUSDT');
            if (btc) {
                bitgetRate = (parseFloat(btc.fundingRate) * 100).toFixed(4) + '%';
                log(`Bitget BTC 찾음: ${JSON.stringify(btc)}`);
            } else {
                log('Bitget BTC 데이터 없음');
            }
        } else {
            log('Bitget 데이터 수신 실패');
        }

        // 결과 출력
        let html = '<table border="1" style="border-collapse:collapse; width:100%; color:white;">';
        html += '<tr><th>거래소</th><th>BTC 펀딩비</th></tr>';
        html += `<tr><td>OKX</td><td>${okxRate}</td></tr>`;
        html += `<tr><td>Bitget</td><td>${bitgetRate}</td></tr>`;
        html += '</table>';
        
        resultEl.innerHTML = html;
        log('테스트 완료');
    }

    runTest();
})();
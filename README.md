# 김치프리미엄 · 펀비 비교 사이트

더따리(theddari.com)처럼 **국내(업비트 KRW)** 와 **해외(바이낸스 USDT)** 거래소 가격 차이(김치 프리미엄)를 비교하는 웹 페이지입니다.

## 기능

- **김치 프리미엄**: 업비트 현재가(KRW) vs 바이낸스 현재가(USDT), 환율 반영 후 김프(%) 표시
- **코인 검색**: 이름으로 필터
- **정렬**: 이름·현재가·김프·전일대비·거래대금 컬럼 클릭으로 정렬
- **새로고침**: 최신 시세 다시 불러오기
- **펀비 비교**: 탭만 준비됨. 펀비 API/스크래핑 연동 시 여기에 추가 가능

## 실행 방법

1. `kimchi-premium` 폴더에서 **index.html** 을 브라우저로 열기  
   (파일 탐색기에서 `index.html` 더블클릭 또는 브라우저 주소창에 `file:///.../kimchi-premium/index.html` 입력)

2. 또는 로컬 서버로 띄우기:
   ```bash
   cd kimchi-premium
   npx serve .
   ```
   브라우저에서 `http://localhost:3000` 접속

## 데이터 출처

- **업비트**: [Upbit Quotation API](https://docs.upbit.com/docs/upbit-quotation-restful-api) (공개)
- **바이낸스**: [Binance Market Data API](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints) (공개)
- **환율**: [Manana Exchange API](https://api.manana.kr/exchange/rate) (무료)

## 펀비 연동

"펀비 비교" 탭은 UI만 있는 상태입니다.  
펀비에서 제공하는 공개 API나 스크래핑 가능한 주소/규격을 알려주시면, 그에 맞춰 `app.js`에 데이터 연동 코드를 추가하는 방법을 안내해 드릴 수 있습니다.

---

참고용이며 투자 권유가 아닙니다.

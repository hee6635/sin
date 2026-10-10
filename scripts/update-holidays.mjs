// 한국천문연구원 특일 정보(공공데이터포털)에서 공휴일을 받아 data/holidays.json 을 갱신합니다.
// GitHub Actions 가 매일 실행합니다. 인증키는 저장소 Secrets 의 KASI_KEY 에 넣어 주세요.
// (앱은 이 파일을 하루 한 번 받아 임시공휴일·대체공휴일을 달력에 반영합니다)
import fs from 'node:fs';

const KEY = process.env.KASI_KEY;
if (!KEY) {
  console.log('KASI_KEY 가 없어서 건너뜁니다. (Settings › Secrets › Actions 에 KASI_KEY 추가)');
  process.exit(0);
}
const FILE = 'data/holidays.json';
const API = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

const now = new Date();
const years = [now.getFullYear(), now.getFullYear() + 1];
const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { years: {} };
const before = JSON.stringify(data.years);

for (const y of years) {
  const map = {};
  for (let m = 1; m <= 12; m++) {
    const url = `${API}?serviceKey=${encodeURIComponent(KEY)}&solYear=${y}&solMonth=${String(m).padStart(2, '0')}&_type=json&numOfRows=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${y}-${m} ${res.status}`);
    const j = await res.json();
    let items = j?.response?.body?.items?.item ?? [];
    if (!Array.isArray(items)) items = [items];
    for (const it of items) {
      if (it.isHoliday !== 'Y') continue;
      const d = String(it.locdate);
      const k = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      map[k] = map[k] ? `${map[k]}·${it.dateName}` : it.dateName;
    }
  }
  // 아직 발표 전인 해(빈 목록)는 덮어쓰지 않음 → 앱이 내장 규칙으로 계산
  if (Object.keys(map).length) data.years[y] = map;
}

if (JSON.stringify(data.years) !== before) {
  data.updated = new Date().toISOString();
  data.source = '한국천문연구원 특일 정보';
  fs.writeFileSync(FILE, JSON.stringify(data, null, 1));
  console.log('공휴일이 바뀌어서 갱신했어요');
} else {
  console.log('바뀐 공휴일 없음');
}

# 출퇴근 날씨 · 오류 보고 켜기 (v0.100, 한 번만)

앱(APK)만 올려서는 날씨가 안 나와요. 서버에 **키 넣기 → 배포**를 한 번 해야 해요.
오류 보고는 Firebase 콘솔에서 한 번 켜면 돼요.

## 1. 공공데이터포털 신청 (끝남)
- 기상청_단기예보 조회서비스 · 기상청_중기예보 조회서비스 · 한국환경공단_에어코리아_대기오염정보 → 모두 **승인**
- 키는 공휴일 때 받은 것과 같은 **일반 인증키(Decoding)** (마이페이지 › 데이터 활용 › Open API › 인증키)

## 2. Cloud Shell 에서 (복사해서 붙여 넣기)
```bash
cd sin && git pull
cd firebase && npm --prefix functions install
npx firebase-tools functions:secrets:set DATA_KEY --project eonjeswieo-d85e2
```
- "Enter a value for DATA_KEY" 가 나오면 **일반 인증키(Decoding)** 를 붙여 넣고 Enter (화면에 안 보여도 들어가요)
- "Secret Manager API 를 켤까요?" 같은 질문이 나오면 `Y`

```bash
npx firebase-tools deploy --only firestore:rules,functions,hosting --project eonjeswieo-d85e2
```
- 서버 규칙(가족 근무표에 직장 지역 · 출퇴근 시각 허용) + 날씨 함수(wx) + 개인정보처리방침(날씨 · 오류 보고 추가)이 같이 올라가요
- 규칙을 아직 안 올렸어도 앱은 괜찮아요 (가족에게 날씨 정보만 빼고 보내요)

## 3. 잘 되는지 확인
브라우저 주소창에:
```
https://asia-northeast3-eonjeswieo-d85e2.cloudfunctions.net/wx?r=11110
```
- `"s":{"b":"2026…","h":{…` 처럼 숫자가 길게 나오면 성공 (11110 = 서울 종로구)
- `"e":{"s":"KEY 등록 안 됨"…` → 키가 아직 안 퍼졌어요. 1~2시간 뒤 다시
- `"e":{"q":…}` 만 있으면 미세먼지 지금 값만 안 된 것 (예보는 나옴)

## 4. 오류 보고 (Crashlytics)
- Firebase 콘솔 › 프로젝트 eonjeswieo-d85e2 › **Crashlytics** 메뉴를 한 번 열어서 "사용 설정"
- 새 APK 를 깔고 앱을 한 번 열면 몇 분 뒤 "앱이 연결됨"으로 바뀌어요
- 플레이 콘솔 › 데이터 보안: "앱 활동 · 비정상 종료 로그 · 진단" 수집(선택 · 끌 수 있음)에 체크

## 앱에서
설정 › 부가 기능 › **☔ 출퇴근 날씨** 켜기 → 집 · 직장 고르기 → 근무 시간 확인 → 맞아요
- 알람마다: 알람 설정 › ☔ 날씨 = 끈 뒤 보기(기본) / 날씨만 / 안 함
- 날짜 창 맨 위 한 줄 (3일 안 = 출퇴근 · 4~10일 = 하루 요약) → 누르면 수치
- 가족 탭 카드: 출퇴근 앞뒤 2시간 = "☔ 퇴근 12° 비" · 그 밖 = 아이콘만 → 누르면 수치 · 같이 쉬는 날 칩에 ☀️/☔

## 서버가 하는 일 (참고)
- 앱은 지역 번호(시 · 군 · 구 5자리)만 보냄 — GPS · 사람 정보 없음
- 지역 → 기상청 격자 · 중기예보 구역 · 미세먼지 예보 구역: `firebase/functions/lib/wxRegions.json` (행정동 경계 2026-10 판으로 `scripts/wx/make-regions.py` 가 만듦)
- 같은 지역은 발표 시각(단기 하루 8번 · 중기 2번 · 미세먼지 예보 4번 · 지금 값 매시)이 바뀔 때만 다시 받아서 `wxCache` 에 저장 (앱에서는 못 읽음)
- 기상청이 멈추면 저장해 둔 옛 예보(이틀 안)를 줌 · 알람은 앱이 미리 만든 예비 문구를 씀

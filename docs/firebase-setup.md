# Firebase 켜기 (사용자가 할 일 · 약 15분 · 무료)

가족 연결(서버)을 만들기 위한 준비예요. 앱 쪽은 이미 들어 있고, **Firebase 콘솔에서 아래만 하시면** 켜져요.
설정을 안 넣으면 Firebase 는 꺼진 채로 앱이 평소처럼 동작해요 (달력 · 알람은 원래 Firebase 없이 동작).

## 1. 프로젝트 만들기
1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 이름은 자유(예: `eonjeswieo`). Google 애널리틱스는 **꺼도 돼요**.

## 2. 익명 로그인 켜기
- 왼쪽 **빌드 › Authentication › 시작하기 › 로그인 방법 › 익명 › 사용 설정 › 저장**

## 3. Firestore 만들기 (서울)
1. **빌드 › Firestore Database › 데이터베이스 만들기**
2. 위치: **asia-northeast3 (서울)** — 한 번 정하면 못 바꿔요.
3. 모드: **프로덕션 모드**로 시작.

## 4. 보안 규칙 붙여 넣기
- Firestore Database › **규칙** 탭 → 안의 글을 모두 지우고 `firebase/firestore.rules` 파일 내용을 그대로 붙여 넣기 → **게시**
- (지금은 연결 시험용 `ping` 만 열려 있고 나머지는 모두 막혀 있어요. 가족 기능을 만들 때 하나씩 열어요.)

## 5. 웹 앱 등록하고 설정 복사
1. 프로젝트 설정(톱니바퀴) › **내 앱 › 웹(</>) 앱 추가** → 이름 아무거나, Hosting 은 **체크 안 함**
2. 나오는 `firebaseConfig = { apiKey: "...", ... }` 를 복사해서 **`app/src/main/assets/firebase/config.js`** 의 `window.FIREBASE_CONFIG = null;` 자리에 붙여 넣기:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "...firebaseapp.com",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   (이 값들은 공개돼도 되는 값이에요. 실제 접근은 4번 보안 규칙이 막아요.)
3. 저장소에 올리면 새 APK 가 만들어져요. (Claude 에게 값을 붙여 주셔도 돼요.)

## 6. 안드로이드 앱도 등록 (나중에 구글 로그인 · 푸시 알림에 필요 — 지금 안 해도 연결 시험은 돼요)
- 프로젝트 설정 › 내 앱 › **Android 앱 추가**
  - 패키지 이름: `com.eonjeswieo.app`
  - 디버그 서명 인증서 SHA-1: `7D:CB:75:02:CD:EB:37:95:30:52:DB:FA:EB:F4:6B:80:C2:A3:9D:BD`
    (지금 쓰는 시험용 키 `keystore/test.keystore` 의 값이에요. 출시용 키를 새로 만들면 그 SHA-1 도 추가해야 해요.)
  - 내려받는 `google-services.json` 은 **푸시 알림 만들 때** 필요해요. 지금은 받아만 두세요.

## 7. 확인하기
1. 새 APK 설치 → 앱 열기 → **설정 › 맨 아래 "앱 정보"를 7번 누르기** → "Firebase 연결 시험" 화면이 열려요.
2. **연결 시험하기** → 이렇게 나오면 성공이에요.
   - 설정 파일: **있음**
   - 로그인(익명): 알파벳 몇 글자…
   - 서버 시험: **✓ 몇 ms**
3. 실패하면 빨간 글씨로 이유가 나와요.
   | 글 | 할 일 |
   |---|---|
   | 익명 로그인이 꺼져 있어요 | 2번 다시 |
   | 보안 규칙이 막고 있어요 | 4번 다시 (규칙을 붙여 넣고 **게시**까지) |
   | apiKey 가 올바르지 않아요 | 5번 값을 다시 복사 |
   | 서버에 연결하지 못했어요 | 인터넷 확인 |

## 개발자용 (컴퓨터에서 시험)
- 규칙 시험: `cd firebase && npm install && npm test` (에뮬레이터, Java 필요)
- SDK 묶음 다시 만들기(버전 올릴 때): `cd scripts/firebase-sdk && npm install && npm run build`
  → `app/src/main/assets/firebase/fb-sdk.js` (앱 안에 들어가는 파일, 인터넷에서 안 받아요)
- 앱 ↔ 에뮬레이터 시험: `config.js` 대신 페이지가 열리기 전에 `window.FIREBASE_CONFIG = {…, emulator: {auth: "http://127.0.0.1:9099", firestore: ["127.0.0.1", 8080]}}` 를 넣으면 돼요.

## 구조 메모
- 앱은 `https://appassets.androidplatform.net/assets/` 주소로 열려서(출처가 있어) Firebase 로그인 · 오프라인 저장(IndexedDB)이 동작해요.
- Firebase 웹 SDK 는 앱 안에 포함돼 있고, **설정이 있을 때 Firebase 화면을 쓸 때만** 불러와요. 안 쓰는 사람은 로딩도 용량 영향도 없어요.
- 알람 경로에는 Firebase 가 전혀 없어요 (로컬 우선).
- 다음 단계(가족 기능): `docs/firebase-design.md` 의 개발 순서 2번부터.

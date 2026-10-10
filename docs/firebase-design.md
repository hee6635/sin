# 가족 실시간 공유 (Firebase) 설계

> 사용자가 정리한 설계안(원칙 · Auth · 초대 코드 · 데이터 구조 · 동기화 · 요청 상태 기계 · 규칙 · 무료 한도 · 백업 · FCM · 쉘 연결 · 비용 · 출시 체크 · 개발 순서)을 기준으로 합니다.
> 아래는 그 설계안을 지금 앱 코드에 맞춰 검토하면서 **고치거나 보탤 점**입니다.

## 기본값 (확정)
- 앱 이름: 언제쉬어 / 패키지 이름: com.eonjeswieo.app (Firebase 안드로이드 앱 등록에 이 이름 사용)
- 게스트 상한: 호스트 제외 3명
- 호스트 구글 로그인 연결 권장(필수 아님), 게스트는 익명
- 리전: 서울 asia-northeast3
- 초대 코드: 8자리(헷갈리는 문자 제외), 7일, 재발급 시 이전 코드 삭제

## 원칙
- 로컬 우선. 알람 경로에 Firebase 없음. Firebase는 가족 간 동기화 계층.
- 권한은 Security Rules가 강제. apiKey 등 설정값은 공개돼도 됨.

## 검토 결과: 고칠 점
1. **WebView 출처 문제 (중요)**: 지금은 `file:///android_asset/index.html` 로 열어서 출처(origin)가 없음.
   이 상태로는 Firebase Auth(허용 도메인 검사)와 IndexedDB 오프라인 캐시가 제대로 동작하지 않을 수 있음.
   → `WebViewAssetLoader` 로 `https://appassets.androidplatform.net/assets/index.html` 로 열고,
     Firebase Auth 허용 도메인에 `appassets.androidplatform.net` 추가.
2. **SDK는 앱 안에 포함**: CDN에서 불러오면 인터넷 없을 때 앱이 안 뜸(로컬 우선 위반).
   Firebase JS SDK를 assets 에 같이 넣고, 로드 실패해도 앱은 로컬로 동작하게.
3. **근무타입이 사용자 정의**: 설계안의 `"night"` 같은 고정 코드 대신 지금 앱은 사용자가 만든 근무타입(글자·이름·색·쉬는 날 여부)을 씀.
   → `pattern/main` 에 `{anchorDate, cycle, types[]}` 를 같이 동기화. override 값은 근무타입 글자(k).
4. **메모가 하루 여러 개**: 설계안은 날짜당 메모 1개(`days.{date}: {text,by,updatedAt}`).
   → `days.{date}.{memoId}: {text, by, updatedAt}` 로. 가족 메모(게스트가 쓴 것)와 호스트 공유 메모를 같은 구조로 합치고 `by` 로 구분.
   → 규칙: 바뀐 필드가 하나뿐이고 그 메모의 `by == 내 uid` 일 때만 허용(남의 메모 수정 금지, 삭제는 쓴 사람 또는 호스트).
5. **사용량 규칙 문법**: 규칙 언어에는 `??` 가 없고, 새로 만들 때는 `resource` 가 null.
   → create: `count == 1`, update: `count == resource.data.count + 1` 로 나누기.
   → 요청 생성과 같은 batch 에서 `getAfter(usage).data.count <= 5 + bonus*5` 확인.
6. **게스트 참여 batch 가 규칙에 막힘**: households 수정은 호스트만 가능한데 게스트가 `guestCount +1` 을 써야 함.
   → 비호스트는 `guestCount` 만 +1, 같은 batch 에 내 members 문서가 생기고(`existsAfter`), 상한 이하일 때만 허용.
   → members 생성 규칙: 문서에 사용한 `inviteCode` 를 적고, `get(/invites/$(code)).data.hid == hid` 이고 만료 전일 때만.
7. **초대 코드 목록 조회 금지**: `invites` 는 `allow get` 만(로그인 사용자), `allow list` 는 막기 → 코드 훑어보기 방지.
8. **요청 id 재사용**: `{date}_{fromUid}` 로 고정하면 거절·취소된 뒤 같은 날 다시 요청할 수 없음.
   → 끝난 요청(rejected/cancelled/applied)이면 덮어쓰기 허용, 또는 `{date}_{fromUid}_{n}`.
9. **events 정리**: 클라이언트가 200건 넘는 것을 지우기 번거로움 → `expireAt` 필드 + Firestore TTL 정책(무료)으로 자동 삭제.
10. **로그인 상태 유지**: Auth 지속성은 IndexedDB 사용 → 1번(출처) 해결이 전제.

## 검토 결과: 출시 전에 먼저 정해야 할 것
- **패키지 이름**: `com.example.*` 은 Play 스토어에 올릴 수 없고, Firebase 앱 등록 뒤에는 못 바꿈.
  → Firebase 등록 전에 최종 이름으로 변경(예: `com.<이름>.shiftcal`).
- **서명 키 고정 (중요)**: 지금 GitHub Actions 빌드는 매번 새 디버그 키로 서명됨.
  → 새 APK가 기존 앱 위에 설치되지 않아 지우고 다시 깔아야 하고, 그러면 폰에 저장된 근무·메모가 지워짐.
  → 구글 로그인도 SHA-1 이 매번 바뀌어 동작 안 함.
  → 고정 키스토어를 만들어 GitHub Secrets 에 넣고 그 키로 서명. SHA-1 을 Firebase 에 등록.

## 개발 순서
0. 패키지 이름 확정 + 서명 키 고정 + WebViewAssetLoader 전환
1. Firebase 프로젝트(서울), 익명 로그인, 규칙 + 에뮬레이터 테스트
2. 웹 앱에 Firestore 연결: 패턴·근무타입·근무 변경·공유 메모·이번 달 메모 (로컬 캐시 유지)
3. 초대 코드·참여, 요청 트랜잭션(수락·거절·취소·되돌리기)
4. Blaze 전환 후 Cloud Functions: 사용량 검증, 광고 보상, 구독 검증, FCM, 가구 삭제
5. 네이티브: 구글 로그인(Credential Manager → ID 토큰 → JS linkWithCredential), FCM 토큰, 광고 SDK, 결제

## 변경: 백업은 Firestore 대신 사용자 구글 드라이브(appDataFolder)
- users/{uid}/backups 는 쓰지 않음. 백업은 최신 + 직전 2개만, 복원은 무료(광고 게이트 없음).

# 푸시 알림 · 구글 로그인 — 내가 해야 할 일 (v0.23~0.24)

앱 쪽은 다 만들어 두었어요. 아래는 **Firebase 콘솔에서 한 번씩만** 해 주면 되는 것들이에요.
순서대로 하나씩, 막히면 화면을 캡처해서 보여 주세요.

## 0. 먼저: 보안 규칙 다시 게시 (1분)
새 규칙(`devices` 알림 기기, `users` 가족방 쪽지, 여러 날 요청)이 들어 있어요.

1. Firebase 콘솔 › **Firestore Database** › **규칙** 탭
2. 안에 있는 글을 모두 지우고, 보내 드린 `firestore-rules.txt` 내용을 붙여 넣기
3. **게시**

## 1. 푸시 알림 켜기 (Cloud Shell 로, 10분쯤)
앱을 안 켜도 가족 메모 · 근무 요청 · 근무 변경 알림이 오게 하는 서버 함수예요.
(Blaze 요금제는 이미 켰죠? 우리 쓰임새로는 무료 범위 안이에요.)

### 1-1. 내 Firestore 위치 확인
Firebase 콘솔 › Firestore Database 맨 위(또는 프로젝트 설정 › 일반 › 기본 GCP 리소스 위치)에서 위치를 봐요.

| 콘솔에 보이는 위치 | 아래에 쓸 값 |
|---|---|
| asia-northeast3 (서울) | `asia-northeast3` |
| nam5 (미국 여러 곳) | `us-central1` |
| eur3 (유럽 여러 곳) | `europe-west1` |
| 그 밖 | 보이는 이름 그대로 |

### 1-2. 올리기
1. https://console.cloud.google.com 에서 프로젝트 **eonjeswieo-d85e2** 를 고르고, 오른쪽 위 **Cloud Shell 열기 (>_ 아이콘)**
2. Cloud Shell 오른쪽 위 점 세 개 › **업로드** › 보내 드린 `eonjeswieo-deploy.zip` 올리기
3. 아래를 한 줄씩 붙여 넣기 (위치 값은 1-1 에서 찾은 것으로 바꿔요)

```sh
rm -rf deploy && mkdir deploy && cd deploy && unzip ../eonjeswieo-deploy.zip
echo "FN_REGION=asia-northeast3" > functions/.env
npm --prefix functions install
npx firebase-tools login --no-localhost
npx firebase-tools deploy --only functions,firestore:rules --project eonjeswieo-d85e2
```

- 로그인 주소가 나오면 눌러서 허용하고, 나온 코드를 붙여 넣어요.
- 중간에 "API를 켤까요?(Y/n)" 가 나오면 **Y**.
- 끝에 `Deploy complete!` 가 보이면 성공이에요.
- 에러에 `location` 이야기가 나오면 `.env` 의 위치 값이 Firestore 위치와 달라서예요 → 1-1 을 다시 보고 고쳐서 마지막 줄만 다시.

### 1-3. 폰에서 확인
1. 새 APK 를 설치하고, 폰 설정에서 이 앱의 **알림이 켜져 있는지** 확인
2. 앱 › 설정 › 가족 연결 에 **"가족 알림 받기"** 스위치가 보여요 (켜져 있어야 해요)
3. 다른 가족 폰에서 가족 메모를 남기거나 근무 요청을 보내면, **앱을 닫은 상태에서도** 알림이 와요
4. 알림을 누르면 그 날짜의 달력이 열려요

알림 글에는 메모 · 요청 메시지 **내용이 들어가지 않아요** (이름 · 날짜 · 종류만).

## 2. 구글 로그인 켜기 (폰을 바꿔도 가족방 유지, 5분)
이 설정이 끝나기 전에는 앱에 구글 연결 버튼이 **아예 안 보여요** (안 쓰는 사람 화면엔 아무것도 안 늘어요).

1. Firebase 콘솔 › **Authentication** › **로그인 방법** › **새 제공업체 추가** › **Google** › 사용 설정 › 프로젝트 지원 이메일 고르기 › **저장**
2. 콘솔 › 프로젝트 설정(톱니) › **내 앱** › Android 앱(com.eonjeswieo.app) › **SHA 인증서 지문 추가** 에 아래 값 붙여 넣기
   - SHA-1: `7D:CB:75:02:CD:EB:37:95:30:52:DB:FA:EB:F4:6B:80:C2:A3:9D:BD`
   - (이미 들어 있으면 그대로 두세요)
3. 같은 화면에서 **google-services.json 다운로드** → 저한테 보내 주세요. (저장소의 `app/google-services.json` 을 새 것으로 바꾸고 APK 를 다시 빌드해요.)
   - 새 파일 안에 `oauth_client` 가 비어 있지 않아야 해요.

### 쓰는 법
- 가족방이 있는 폰: 설정 › 가족 연결 › **구글 계정으로 가족방 지키기** → 구글 계정 고르기. (이 폰의 가족방이 그 구글 계정에 묶여요)
- 새 폰(가족방이 없는 상태): 설정 › 가족 연결 › **전에 쓰던 폰의 가족방 불러오기** → 같은 구글 계정으로 로그인 → 가족방이 돌아와요.
- 내 근무표 · 메모는 가족방이 아니라 **구글 드라이브 백업**에서 불러와요. 새 폰에서는 가족방을 불러온 뒤 설정 › 백업에서 불러오면 돼요.

## 3. 잊지 말기
- **Blaze 무료 체험이 2027-01-11 에 끝나요.** 그 전에 콘솔에서 "업그레이드"를 눌러 두세요 (안 하면 푸시가 멈춰요). 쓰는 양이 적어서 요금은 사실상 0원이에요.
- 출시용 서명 키를 새로 만들면, 그 SHA-1 도 2번 화면에 추가하고 google-services.json 을 다시 받아야 해요.

## 4. v0.28 새 기능을 모두 쓰려면 (자는 시간엔 알림 소리 없이)
앱(APK)만 새로 깔면 대부분 바로 돼요. **"자는 시간엔 소리 없이"** 만 서버가 같이 바뀌어야 해서 아래 두 가지를 한 번 더 해 주세요. (안 해도 앱은 잘 돌아가고, 그 기능만 아직 안 켜진 상태예요.)

1. **보안 규칙 다시 게시** — 0번과 같은 방법 (새 `firestore-rules.txt` 로 통째로 바꿔 붙여 넣고 게시). `devices` 에 자는 시간 칸(`quiet`)이 늘었어요.
2. **함수 다시 올리기** — 1-2번과 같은 방법 (새 `eonjeswieo-deploy.zip` 올리고, `deploy` 폴더를 지운 뒤 아래를 다시):
```sh
rm -rf deploy && mkdir deploy && cd deploy && unzip ../eonjeswieo-deploy.zip
echo "FN_REGION=asia-northeast3" > functions/.env
npm --prefix functions install
npx firebase-tools deploy --only functions,firestore:rules --project eonjeswieo-d85e2
```
- 설정 › 가족 연결 › "가족 알림 받기" 아래에 **"자는 시간엔 소리 없이"** 스위치가 생겨요 (기본 켜짐). 야간 근무 뒤 자는 시간(근무 시간 설정, 기본 08:30~13:30)에는 알림이 소리 · 진동 없이 알림창에만 쌓여요.


# 서버에 올리기 (v0.63) — 보안 규칙 + 개인정보 방침 웹 페이지

앱 쪽은 다 만들어 두었어요. 아래는 **Cloud Shell 에서 한 번만** 하면 되는 일이에요 (5분쯤).
막히면 화면을 캡처해서 보여 주세요.

## 무엇이 올라가나요?
- **웹 페이지 3개**: 첫 화면 · 개인정보처리방침 · 계정/데이터 삭제 안내 → https://eonjeswieo.web.app
- **보안 규칙 한 줄 추가**: "보기만" 가족은 앱뿐 아니라 서버에서도 메모 · 근무 요청을 못 보내게 막음 (v0.63 앱이 아니어도 막혀요)
- 푸시 알림 함수(functions)는 이번에 바뀐 게 없어서 **다시 안 올려도 돼요**. (다만 "가족방을 지울 때 남은 메모까지 정리하는" 함수 `onHouseholdDeleted` 는 이미 올라가 있어야 해요 — Firebase 콘솔 › Functions 에 보이면 OK)

## 올리는 방법
1. https://console.cloud.google.com 에서 프로젝트 **eonjeswieo-d85e2** 를 고르고, 오른쪽 위 **Cloud Shell 열기 (>_ 아이콘)**
2. Cloud Shell 오른쪽 위 점 세 개 › **업로드** › 보내 드린 `eonjeswieo-deploy.zip` 올리기
3. 아래를 한 줄씩 붙여 넣기

```sh
rm -rf deploy && mkdir deploy && cd deploy && unzip ../eonjeswieo-deploy.zip
npx firebase-tools deploy --only hosting,firestore:rules --project eonjeswieo-d85e2
```

- 이미 `eonjeswieo.app@gmail.com` 으로 로그인돼 있어서 로그인 줄은 필요 없어요. (로그인 안내가 나오면 `npx firebase-tools login --no-localhost` 를 먼저 하고 나온 주소를 눌러 허용 → 코드를 붙여 넣기)
- 중간에 "API를 켤까요?(Y/n)" 가 나오면 **Y**.
- 끝에 `Deploy complete!` 와 `Hosting URL: https://eonjeswieo.web.app` 가 보이면 성공이에요.

## 올린 뒤 확인 (1분)
브라우저(폰도 좋아요)에서 아래 주소가 **로그인 없이** 열리는지 봐요.
- https://eonjeswieo.web.app/privacy — 개인정보처리방침
- https://eonjeswieo.web.app/delete — 계정 · 데이터 삭제 안내

## Play Console 에 넣을 주소 (출시 준비할 때)
| 칸 | 넣을 주소 |
|---|---|
| 개인정보처리방침 URL (스토어 등록정보 · 앱 콘텐츠) | `https://eonjeswieo.web.app/privacy` |
| 데이터 보안 › 계정 삭제 URL | `https://eonjeswieo.web.app/delete` |
| 문의 이메일 | `eonjeswieo.app@gmail.com` |

앱 안(설정 › 개인정보처리방침)에도 같은 글이 있고, 맨 아래 버튼으로 이 웹 주소가 열려요.

## 앞으로 글을 고칠 때
`firebase/hosting/` 안의 `privacy.html` · `delete.html` 을 고친 뒤, 위 방법으로 다시 올리면 돼요 (제가 zip 을 새로 만들어 드려요). 앱 안 방침 글(`index.html` 의 `openPrivacyPage`)과 시행일 · 메일 주소가 같은지는 시험(`tests/phone/s46.js`)이 확인해 줘요.

## 알아 둘 것 (삭제 요청이 메일로 올 때)
- 삭제 요청 메일에는 앱의 "문의하기"로 보낸 경우 **가족 연결 번호**가 자동으로 들어 있어요. 이 번호로 Firebase 콘솔 › Firestore 에서 `households/번호` · `devices/번호` · `users/번호` 를 지우고, Authentication › 사용자에서 같은 번호(UID)의 계정을 지우면 돼요.
- 앱을 이미 지운 사람이 보낸 메일에는 번호가 없어서, 구글 이메일(구글 연결을 한 경우) 로 Authentication 에서 찾아요. 찾을 단서가 없으면 지울 수 없다고 답해 주세요 (방침 · 삭제 안내 페이지에 그렇게 써 두었어요).
- 약속한 처리 기한은 **지체 없이, 늦어도 10일 안**이에요.

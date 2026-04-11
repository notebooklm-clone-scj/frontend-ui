# frontend-ui

Next.js 기반 NotebookLM 스타일 프론트엔드입니다.

브라우저는 Spring API를 직접 호출하지 않고, Next.js의 `app/api/*` 라우트를 통해 요청합니다.
로그인 시 Spring이 반환하는 JSON 응답의 `token` 값을 읽고, Next 서버가 이를 `httpOnly` 쿠키로 저장합니다.

## 개요

이 프론트는 아래 흐름을 기준으로 동작합니다.

```txt
Browser
  -> Next.js App Router
  -> Next Route Handler (/app/api/*)
  -> Spring API
  -> FastAPI (Spring 내부 연동)
```

핵심 목적은 다음과 같습니다.

| 항목 | 설명 |
| --- | --- |
| 인증 | 로그인 후 JWT를 서버 쿠키에 저장 |
| 노트북 | 목록 조회, 생성 |
| 문서 | PDF 업로드, 문서 목록 조회, 선택 문서 요약 확인 |
| 채팅 | 노트북 단위 채팅 이력 조회, 질문 전송 |

## 현재 화면 구조

화면은 크게 두 종류로 나뉩니다.

| 화면 | 역할 |
| --- | --- |
| 홈 화면 | 노트북 시작 화면. 새 노트북 생성과 기존 노트북 진입 |
| 노트북 상세 화면 | 문서 업로드, 문서 선택, 요약 확인, 채팅 작업 |

노트북 상세 화면은 다음과 같이 구성됩니다.

| 영역 | 역할 |
| --- | --- |
| 좌측 사이드바 | 노트북 이동, 새 노트북 생성 |
| 상단 헤더 | 현재 노트북 제목, 문서 수, 요약 완료 수 |
| 중앙 메인 | 채팅 영역 |
| 우측 패널 | 파일 업로드, 문서 목록, 선택 문서 요약 |

문서 목록은 목록과 요약을 한 번에 보여주지 않습니다.
문서를 클릭했을 때만 아래 요약 패널에 선택 문서의 요약이 표시됩니다.

## 문서 동작 방식

문서 업로드는 동기 요약 응답 방식이 아니라 비동기 분석 방식입니다.

```txt
1. 사용자가 PDF 업로드
2. Spring이 문서 레코드를 먼저 생성
3. Spring이 FastAPI 분석 작업을 백그라운드로 전달
4. 프론트가 문서 목록을 다시 조회
5. 분석 완료 후 summary가 채워지면 선택 문서 패널에서 확인
```

문서 상태 해석은 다음과 같습니다.

| 상태 | 의미 |
| --- | --- |
| PROCESSING | 문서는 등록되었지만 요약이 아직 없음 |
| COMPLETED | 요약이 채워짐 |

## 채팅 동작 방식

채팅은 선택 문서 하나에만 한정되는 구조가 아니라, 노트북 단위 문서 집합을 기준으로 동작합니다.
따라서 우측에서 문서 요약을 읽고 질문을 정리한 뒤, 중앙 채팅에서 질문하는 흐름을 권장합니다.

홈 화면은 소개용 통계 대시보드라기보다, 작업할 노트북으로 바로 들어가기 위한 런처 역할에 가깝습니다.

## 폴더 구조

```txt
app/
  (public)/
  (workspace)/
  api/
components/
lib/
Dockerfile
docker-compose.yml
```

## 환경 변수

`.env.example`를 복사해 `.env`를 만들어도 되고, 기본값으로 바로 실행해도 됩니다.

```bash
cp .env.example .env
```

기본값:

```env
CORE_API_BASE_URL=http://host.docker.internal:8080
```

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `CORE_API_BASE_URL` | `http://host.docker.internal:8080` | Docker 내부 Next.js가 접근할 Spring API 주소 |

## Docker로 실행하기

개발 모드는 Docker 기준으로 구성되어 있습니다.

```bash
cd /Users/seochanjin/workspace/notebooklm/frontend-ui
docker compose up --build
```

다음 명령도 자주 사용합니다.

| 명령 | 설명 |
| --- | --- |
| `docker compose up --build` | 이미지 빌드 후 실행 |
| `docker compose up -d` | 백그라운드 실행 |
| `docker compose restart` | 컨테이너 재시작 |
| `docker compose down` | 컨테이너 종료 |
| `docker compose logs -f` | 로그 추적 |

실행 후 주소:

| 대상 | 주소 |
| --- | --- |
| 프론트 | `http://localhost:3000` |
| Spring API | `.env`의 `CORE_API_BASE_URL` 값 |

개발 편의 설정:

| 설정 | 설명 |
| --- | --- |
| `.:/app` 바인드 마운트 | 로컬 코드 변경을 컨테이너에 즉시 반영 |
| `/app/node_modules` 볼륨 | 의존성 폴더 분리 |
| `/app/.next` 볼륨 | 빌드 산출물 분리 |
| `next dev` 실행 | 코드 수정 시 개발 서버 재컴파일 |
| `CHOKIDAR_USEPOLLING=true` | Docker 환경 파일 변경 감지 안정화 |

## 로컬 실행

Node.js가 설치된 환경에서는 아래처럼도 실행할 수 있습니다.

```bash
npm install
npm run dev
```

## API 사용 범위

브라우저는 아래 Next API만 호출합니다.

### 인증

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `POST` | `/api/auth/login` | 로그인 |
| `POST` | `/api/auth/signup` | 회원가입 |
| `POST` | `/api/auth/logout` | 로그아웃 |

로그인 성공 시 JWT의 `sub` 값을 읽어 `userId`로 사용합니다.

### 노트북 및 문서

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/notebooks` | 노트북 목록 |
| `POST` | `/api/notebooks` | 노트북 생성 |
| `POST` | `/api/notebooks/:id/documents` | PDF 업로드 |
| `GET` | `/api/notebooks/:id/documents` | 문서 목록 |
| `GET` | `/api/notebooks/:id/chat` | 채팅 이력 |
| `POST` | `/api/notebooks/:id/chat` | 질문 전송 |

## 참고

현재 환경에서는 `node`, `npm`이 로컬에 설치되어 있지 않아 `next build`나 `lint`는 직접 실행하지 못했습니다.
가장 빠른 확인 경로는 Docker 실행입니다.

## 관련 문서

- 프로젝트 개요: [/Users/seochanjin/workspace/notebooklm/infra-config/README.md](/Users/seochanjin/workspace/notebooklm/infra-config/README.md)
- 아키텍처 문서: [/Users/seochanjin/workspace/notebooklm/infra-config/docs/architecture.md](/Users/seochanjin/workspace/notebooklm/infra-config/docs/architecture.md)

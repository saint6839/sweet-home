# Sweet Home - 청년안심주택 크롤러

서울시 청년안심주택 단지 정보를 크롤링하여 제공하는 NestJS 기반 API 서버입니다.

## 기능

- 서울시 25개 지역구별 청년안심주택 단지 정보 크롤링
- Puppeteer를 사용한 동적 웹 크롤링
- PostgreSQL 데이터베이스를 통한 데이터 관리
- RESTful API 제공

## 기술 스택

- **Backend Framework**: NestJS 10.x
- **Language**: TypeScript
- **Web Crawler**: Puppeteer
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: class-validator, class-transformer

## 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력합니다:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/sweet_home?schema=public"
PORT=3000
```

### 3. 데이터베이스 설정

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate
```

### 4. 서버 실행

```bash
# 개발 모드
pnpm start:dev

# 프로덕션 모드
pnpm build
pnpm start:prod
```

## API 엔드포인트

### 1. 전체 단지 크롤링

모든 지역구의 청년안심주택 단지 정보를 크롤링합니다.

```http
GET /api/crawler/housing-complexes
```

**응답 예시:**

```json
{
  "success": true,
  "data": [
    {
      "name": "단지명",
      "district": "강남구",
      "address": "서울시 강남구...",
      "imageUrl": "https://...",
      "detailUrl": "https://...",
      "description": null
    }
  ],
  "totalCount": 150,
  "crawledAt": "2025-11-20T10:00:00.000Z"
}
```

### 2. 특정 지역구 단지 크롤링

특정 지역구의 단지 정보만 크롤링합니다.

```http
GET /api/crawler/housing-complexes/:district
```

**예시:**

```http
GET /api/crawler/housing-complexes/강남구
```

### 3. 데이터베이스 동기화

크롤링한 데이터를 데이터베이스에 저장합니다.

```http
POST /api/crawler/sync
```

**응답 예시:**

```json
{
  "success": true,
  "savedCount": 150,
  "message": "Successfully synced 150 housing complexes to database"
}
```

### 4. 지역구 목록 조회

사용 가능한 모든 지역구 목록을 조회합니다.

```http
GET /api/crawler/districts
```

**응답 예시:**

```json
{
  "districts": [
    "전체",
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구"
  ]
}
```

### 5. 헬스 체크

크롤러 모듈의 상태를 확인합니다.

```http
GET /api/crawler/health
```

**응답 예시:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-20T10:00:00.000Z"
}
```

## 프로젝트 구조

```
src/
├── crawler/                    # 크롤러 모듈
│   ├── dto/                   # Data Transfer Objects
│   │   ├── crawl-result.dto.ts
│   │   └── housing-complex.dto.ts
│   ├── interfaces/            # TypeScript 인터페이스
│   │   └── housing-complex.interface.ts
│   ├── crawler.controller.ts  # REST API 컨트롤러
│   ├── crawler.service.ts     # 크롤링 비즈니스 로직
│   └── crawler.module.ts      # NestJS 모듈
├── database/                  # 데이터베이스 모듈
│   ├── prisma.service.ts     # Prisma 서비스
│   └── prisma.module.ts      # Prisma 모듈
├── shared/                    # 공유 모듈
│   └── filters/
│       └── http-exception.filter.ts  # 글로벌 예외 필터
├── app.module.ts             # 루트 모듈
└── main.ts                   # 애플리케이션 진입점

prisma/
└── schema.prisma             # Prisma 스키마 정의
```

## 데이터베이스 스키마

```prisma
model HousingComplex {
  id          String   @id @default(uuid())
  name        String
  district    String
  address     String?
  imageUrl    String?
  detailUrl   String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("housing_complexes")
  @@index([district])
}
```

## 개발 가이드

### 코드 스타일

- TypeScript strict 모드 사용
- ESLint + Prettier를 통한 코드 포맷팅
- NestJS 및 SOLID 원칙 준수
- JSDoc을 통한 문서화

### 테스트

```bash
# 단위 테스트
pnpm test

# E2E 테스트
pnpm test:e2e

# 테스트 커버리지
pnpm test:cov
```

### 린팅

```bash
# ESLint 실행
pnpm lint

# 코드 포맷팅
pnpm format
```

## 주의사항

1. **크롤링 빈도**: 대상 웹사이트에 부하를 주지 않도록 적절한 간격으로 크롤링하세요.
2. **Puppeteer 설정**: 서버 환경에서는 headless 모드로 실행되며, 필요한 의존성이 설치되어 있어야 합니다.
3. **데이터베이스**: PostgreSQL이 실행 중이어야 하며, DATABASE_URL이 올바르게 설정되어야 합니다.

## 향후 개발 계획

- [ ] 스케줄러를 통한 자동 주기적 크롤링
- [ ] 변경 감지 및 알림 기능
- [ ] 캐싱 전략 적용
- [ ] 단지 상세 정보 크롤링
- [ ] 테스트 코드 작성

## 라이선스

UNLICENSED

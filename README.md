# commerce-perf-lab

쇼핑몰 상품 탐색 앱에서 프론트엔드 실무 기술을 연습하고, 개선 전후를 측정해 남기는 실험 레포입니다.

| 연습할 것       | 기능                             |
| --------------- | -------------------------------- |
| 가상 스크롤     | 상품 수천~만 개 목록             |
| 낙관적 업데이트 | 찜(하트) 토글, 장바구니 담기     |
| 폼 리렌더       | 필터 패널 + 주문서 폼            |
| 이미지 LCP      | 상품 상세 대표 이미지, 메인 배너 |

## 기술 스택

Next.js (App Router) · TypeScript · pnpm · TanStack Query v5 · React Hook Form · Vitest · @faker-js/faker

## 실행

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

| 스크립트         | 설명                                               |
| ---------------- | -------------------------------------------------- |
| `pnpm lint`      | ESLint                                             |
| `pnpm typecheck` | 라우트 타입 생성(`next typegen`) 후 `tsc --noEmit` |
| `pnpm test`      | Vitest                                             |
| `pnpm format`    | Prettier                                           |

## 더미 데이터와 API

별도 백엔드 없이 Faker와 Route Handler로 데이터를 만듭니다 (`src/server/data.ts`).

- 고정 시드(`faker.seed(42)`)를 써서 매번 같은 데이터가 나옵니다. 전후 측정을 같은 조건에서 비교하기 위해서입니다.
- 상품 개수는 기본 10,000개이고 `PRODUCT_COUNT` 환경 변수로 바꿀 수 있습니다.
- 찜 · 장바구니 상태는 서버 메모리에 저장하므로 dev 서버를 재시작하면 초기화됩니다.

| 메서드        | 경로                 | 설명                                                                                                                            |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| GET           | `/api/products`      | 목록. `category` `color` `size` `minPrice` `maxPrice` `sort`(`latest` · `price_asc` · `price_desc` · `rating`) `cursor` `limit` |
| GET           | `/api/products/[id]` | 상세                                                                                                                            |
| POST · DELETE | `/api/wishlist/[id]` | 찜하기 · 찜 해제                                                                                                                |
| GET · POST    | `/api/cart`          | 장바구니 조회 · 담기 (`{ productId, quantity }`)                                                                                |

### 지연 · 실패 흉내

낙관적 업데이트의 롤백을 재현하려고 모든 API에 지연과 실패를 줄 수 있습니다.

- 화면 왼쪽 아래 패널에서 지연(ms)과 실패율을 고르면 모든 요청에 헤더로 붙습니다.
- 직접 호출할 때는 헤더 `x-mock-delay` · `x-mock-fail` 또는 쿼리 `?delay=1000&fail=0.5`를 씁니다. `fail`은 실패 확률(0~1)이고 1이면 항상 실패합니다.

## 실험

각 실험은 개선 전 구현을 지우지 않고 남겨서 `?variant=` 쿼리 파라미터로 전환해 비교합니다.
실험별 섹션(문제 → 접근 → 트레이드오프 → 측정 결과)은 해당 단계를 진행하면서 추가합니다.

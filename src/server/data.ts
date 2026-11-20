import { faker } from '@faker-js/faker'

import { CATEGORIES, COLORS, SIZES, type Product } from '@/lib/types'

// 고정 시드 → 매번 같은 데이터 (전후 측정을 같은 조건에서 비교하기 위해)
faker.seed(42)

const PRODUCT_COUNT = Number(process.env.PRODUCT_COUNT) || 10_000

export const products: Product[] = Array.from(
  { length: PRODUCT_COUNT },
  (_, i) => {
    const id = String(i + 1)
    return {
      id,
      name: faker.commerce.productName(),
      price: faker.number.int({ min: 10, max: 500 }) * 1000,
      category: faker.helpers.arrayElement(CATEGORIES),
      options: {
        colors: faker.helpers.arrayElements(COLORS, { min: 1, max: 3 }),
        sizes: faker.helpers.arrayElements(SIZES, { min: 1, max: 4 }),
      },
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      wishCount: faker.number.int({ min: 0, max: 3000 }),
      isWished: false,
      imageUrl: `https://picsum.photos/seed/${id}/600/600`,
      // refDate를 고정해야 실행 시각이 달라도 같은 날짜가 나온다
      createdAt: faker.date
        .past({ years: 1, refDate: '2026-11-01' })
        .toISOString(),
    }
  },
)

// 찜 · 장바구니는 서버 메모리에 둔다 (재시작하면 초기화)
export const cart = new Map<string, number>()

/**
 * 지연 · 실패 흉내. 헤더(x-mock-delay, x-mock-fail) 또는 쿼리(?delay=1000&fail=0.5)로 준다.
 * fail은 실패 확률(0~1), 1이면 항상 실패. 실패하면 Response를, 아니면 null을 돌려준다
 */
export async function simulate(request: Request): Promise<Response | null> {
  const url = new URL(request.url)
  const delay = Number(
    request.headers.get('x-mock-delay') ?? url.searchParams.get('delay') ?? 0,
  )
  const fail = Number(
    request.headers.get('x-mock-fail') ?? url.searchParams.get('fail') ?? 0,
  )

  if (delay > 0) await new Promise((r) => setTimeout(r, delay))
  if (fail > 0 && Math.random() < fail) {
    return Response.json({ message: '일부러 실패시킨 요청' }, { status: 500 })
  }
  return null
}

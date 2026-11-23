import type { InfiniteData } from '@tanstack/react-query'

import type { Product, ProductListResponse } from '@/lib/types'

// 목록 캐시(useInfiniteQuery)를 바꾸는 순수 함수들.
// setQueriesData는 매칭된 쿼리마다 updater를 호출하므로, 여기서는 입력을 받아 새 값을 돌려주기만 한다

export type ProductPages = InfiniteData<ProductListResponse, number>

/**
 * 찜 상태를 바꾸고 wishCount를 함께 맞춘다.
 * 이미 같은 상태면 그대로 돌려준다 → 같은 변경이 두 번 적용돼도 개수가 두 번 바뀌지 않는다
 */
export function applyWish(product: Product, isWished: boolean): Product {
  if (product.isWished === isWished) return product
  return {
    ...product,
    isWished,
    wishCount: product.wishCount + (isWished ? 1 : -1),
  }
}

/** 목록의 모든 페이지에서 productId 상품 하나만 바꾼다 */
export function updateProduct(
  data: ProductPages | undefined,
  productId: string,
  update: (product: Product) => Product,
): ProductPages | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.id === productId ? update(item) : item,
      ),
    })),
  }
}

export function findProduct(
  data: ProductPages | undefined,
  productId: string,
): Product | undefined {
  for (const page of data?.pages ?? []) {
    const found = page.items.find((item) => item.id === productId)
    if (found) return found
  }
  return undefined
}

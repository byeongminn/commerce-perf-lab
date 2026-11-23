import { useMutation, useQueryClient } from '@tanstack/react-query'

import { setWish } from '@/lib/api'
import type { WishResponse } from '@/lib/types'

import {
  applyWish,
  findProduct,
  updateProduct,
  type ProductPages,
} from './updaters'

// 목록 쿼리 키는 ['products', 검색조건]. 앞부분만 맞추면 모든 목록 캐시에 적용된다
const PRODUCTS = { queryKey: ['products'] }

type Variables = { productId: string; isWished: boolean }

/** 서버 응답 값으로 해당 상품 하나만 덮어쓴다 */
function writeServerResult(res: WishResponse) {
  return (data: ProductPages | undefined) =>
    updateProduct(data, res.productId, (p) => ({
      ...p,
      isWished: res.isWished,
      wishCount: res.wishCount,
    }))
}

/** 개선 전: 서버가 성공을 응답한 뒤에 캐시를 갱신한다 (invalidate 없이 setQueriesData) */
export function useToggleWishServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, isWished }: Variables) =>
      setWish(productId, isWished),
    onSuccess: (res) => {
      queryClient.setQueriesData<ProductPages>(PRODUCTS, writeServerResult(res))
    },
  })
}

/** 개선 후: 누르는 즉시 캐시를 바꾸고, 실패하면 그 상품만 되돌린다 */
export function useToggleWishOptimistic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, isWished }: Variables) =>
      setWish(productId, isWished),

    onMutate: async ({ productId, isWished }) => {
      // 진행 중인 목록 요청이 끝나면서 낙관적 값을 덮어쓰지 않도록 먼저 취소한다
      await queryClient.cancelQueries(PRODUCTS)

      // 스냅샷은 캐시 전체가 아니라 이 상품 하나의 이전 상태만 저장한다.
      // 전체를 복원하면 그사이 성공한 다른 상품의 찜까지 되돌아가기 때문
      const previous = queryClient
        .getQueriesData<ProductPages>(PRODUCTS)
        .map(([, data]) => findProduct(data, productId))
        .find((product) => product !== undefined)

      queryClient.setQueriesData<ProductPages>(PRODUCTS, (data) =>
        updateProduct(data, productId, (p) => applyWish(p, isWished)),
      )
      return { previous }
    },

    onError: (_error, { productId }, context) => {
      const previous = context?.previous
      if (!previous) return
      queryClient.setQueriesData<ProductPages>(PRODUCTS, (data) =>
        updateProduct(data, productId, (p) => ({
          ...p,
          isWished: previous.isWished,
          wishCount: previous.wishCount,
        })),
      )
    },

    // 성공하면 서버 값으로 맞춘다. 더하기가 아니라 값 덮어쓰기라 개수가 두 번 늘지 않는다
    onSuccess: (res) => {
      queryClient.setQueriesData<ProductPages>(PRODUCTS, writeServerResult(res))
    },
  })
}

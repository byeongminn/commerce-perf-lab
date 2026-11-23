import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addToCart, getCart } from '@/lib/api'
import type { CartResponse } from '@/lib/types'

import { addQuantity } from './updaters'

export const CART_KEY = ['cart']

type Variables = { productId: string; quantity: number }

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: getCart })
}

/** 개선 전: 서버 응답(장바구니 전체)으로 캐시를 덮어쓴다 */
export function useAddToCartServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, quantity }: Variables) =>
      addToCart(productId, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData<CartResponse>(CART_KEY, cart)
    },
  })
}

/** 개선 후: 즉시 수량을 더하고, 실패하면 그 요청이 더한 만큼만 뺀다 */
export function useAddToCartOptimistic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, quantity }: Variables) =>
      addToCart(productId, quantity),

    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY })
      queryClient.setQueryData<CartResponse>(CART_KEY, (cart) =>
        addQuantity(cart, productId, quantity),
      )
    },

    // 장바구니 전체 스냅샷으로 되돌리면 그사이 성공한 다른 담기까지 사라진다.
    // 담기는 순서와 상관없이 더해지는 연산이라, 실패한 요청의 수량만 빼면 정확히 되돌아간다
    onError: (_error, { productId, quantity }) => {
      queryClient.setQueryData<CartResponse>(CART_KEY, (cart) =>
        addQuantity(cart, productId, -quantity),
      )
    },

    // 성공해도 서버 응답으로 덮어쓰지 않는다. 응답에는 아직 진행 중인 다른 담기가 빠져 있어서,
    // 덮어쓰면 그 수량이 잠깐 사라졌다가 돌아오고, 나중에 그 요청이 실패하면 수량을 두 번 빼게 된다
  })
}

import type { CartResponse } from '@/lib/types'

export const EMPTY_CART: CartResponse = { items: [], totalQuantity: 0 }

/**
 * productId 상품의 수량을 delta만큼 바꾼다. 0 이하가 되면 장바구니에서 뺀다.
 * totalQuantity는 따로 더하지 않고 items에서 다시 계산한다 → 개수가 이중으로 바뀔 수 없다.
 * 실패 롤백은 같은 함수에 -quantity를 넘겨서 한다
 */
export function addQuantity(
  cart: CartResponse | undefined,
  productId: string,
  delta: number,
): CartResponse {
  const items = cart?.items ?? []
  const exists = items.some((item) => item.productId === productId)

  const next = exists
    ? items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + delta }
          : item,
      )
    : [...items, { productId, quantity: delta }]

  const filtered = next.filter((item) => item.quantity > 0)
  return {
    items: filtered,
    totalQuantity: filtered.reduce((sum, item) => sum + item.quantity, 0),
  }
}

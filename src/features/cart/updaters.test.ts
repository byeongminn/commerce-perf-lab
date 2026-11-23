import { describe, expect, it } from 'vitest'

import { EMPTY_CART, addQuantity } from './updaters'

describe('addQuantity', () => {
  it('새 상품을 담는다', () => {
    expect(addQuantity(EMPTY_CART, '1', 2)).toEqual({
      items: [{ productId: '1', quantity: 2 }],
      totalQuantity: 2,
    })
  })

  it('이미 있는 상품은 수량을 더한다', () => {
    const cart = addQuantity(addQuantity(EMPTY_CART, '1', 2), '2', 1)
    expect(addQuantity(cart, '1', 3)).toEqual({
      items: [
        { productId: '1', quantity: 5 },
        { productId: '2', quantity: 1 },
      ],
      totalQuantity: 6,
    })
  })

  it('음수로 롤백하면 다른 상품은 그대로 두고 해당 수량만 뺀다', () => {
    const cart = addQuantity(addQuantity(EMPTY_CART, '1', 2), '2', 1)
    expect(addQuantity(cart, '1', -2)).toEqual({
      items: [{ productId: '2', quantity: 1 }],
      totalQuantity: 1,
    })
  })

  it('totalQuantity는 항상 items 합계와 같다', () => {
    let cart = EMPTY_CART
    for (const [id, delta] of [
      ['1', 2],
      ['2', 3],
      ['1', -1],
      ['3', 4],
      ['2', -3],
    ] as const) {
      cart = addQuantity(cart, id, delta)
      expect(cart.totalQuantity).toBe(
        cart.items.reduce((s, i) => s + i.quantity, 0),
      )
    }
  })

  it('캐시가 비어 있어도(undefined) 동작한다', () => {
    expect(addQuantity(undefined, '1', 1).totalQuantity).toBe(1)
  })

  it('원본을 바꾸지 않는다', () => {
    const cart = addQuantity(EMPTY_CART, '1', 1)
    addQuantity(cart, '1', 5)
    expect(cart.items[0].quantity).toBe(1)
  })
})

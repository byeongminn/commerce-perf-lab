import { describe, expect, it } from 'vitest'

import type { Product } from '@/lib/types'

import {
  applyWish,
  findProduct,
  updateProduct,
  type ProductPages,
} from './updaters'

function product(id: string, isWished = false, wishCount = 10): Product {
  return {
    id,
    name: id,
    price: 1000,
    category: 'top',
    options: { colors: [], sizes: [] },
    rating: 4,
    wishCount,
    isWished,
    imageUrl: '',
    createdAt: '',
  }
}

function pages(...groups: Product[][]): ProductPages {
  return {
    pages: groups.map((items) => ({ items, nextCursor: null, totalCount: 0 })),
    pageParams: groups.map((_, i) => i),
  }
}

describe('applyWish', () => {
  it('찜하면 개수가 1 늘고, 해제하면 1 준다', () => {
    expect(applyWish(product('1'), true)).toMatchObject({
      isWished: true,
      wishCount: 11,
    })
    expect(applyWish(product('1', true), false)).toMatchObject({
      isWished: false,
      wishCount: 9,
    })
  })

  it('이미 같은 상태면 개수를 바꾸지 않는다 (이중 적용 방지)', () => {
    const wished = product('1', true, 11)
    expect(applyWish(wished, true)).toBe(wished)
    expect(applyWish(applyWish(product('1'), true), true).wishCount).toBe(11)
  })

  it('원본을 바꾸지 않는다', () => {
    const original = product('1')
    applyWish(original, true)
    expect(original).toMatchObject({ isWished: false, wishCount: 10 })
  })
})

describe('updateProduct', () => {
  it('여러 페이지 중 해당 상품만 바꾼다', () => {
    const data = pages([product('1'), product('2')], [product('3')])
    const next = updateProduct(data, '3', (p) => applyWish(p, true))

    expect(findProduct(next, '3')).toMatchObject({
      isWished: true,
      wishCount: 11,
    })
    expect(findProduct(next, '1')).toEqual(product('1'))
    expect(findProduct(next, '2')).toEqual(product('2'))
  })

  it('목록에 없는 상품이면 내용이 그대로다', () => {
    const data = pages([product('1')])
    expect(updateProduct(data, '999', (p) => applyWish(p, true))).toEqual(data)
  })

  it('캐시가 비어 있으면 undefined를 그대로 돌려준다', () => {
    expect(updateProduct(undefined, '1', (p) => p)).toBeUndefined()
  })
})

// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Product } from '@/lib/types'
import {
  createTestClient,
  mockFetch,
  waitForIdle,
  waitForRequests,
} from '@/test/mock-fetch'

import { findProduct, type ProductPages } from './updaters'
import { useToggleWishOptimistic, useToggleWishServer } from './useToggleWish'

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

const LIST_KEY = ['products', '']

function setup<T>(useHook: () => T) {
  const requests = mockFetch()
  const { client, Wrapper } = createTestClient()
  // 목록 캐시: 1, 2는 찜 안 함(10개), 3은 이미 찜함(20개)
  client.setQueryData<ProductPages>(LIST_KEY, {
    pages: [
      { items: [product('1'), product('2')], nextCursor: 2, totalCount: 3 },
      { items: [product('3', true, 20)], nextCursor: null, totalCount: 3 },
    ],
    pageParams: [0, 2],
  })
  const { result } = renderHook(useHook, { wrapper: Wrapper })
  const item = (id: string) =>
    findProduct(client.getQueryData<ProductPages>(LIST_KEY), id)
  return { requests, client, result, item }
}

const ok = (productId: string, isWished: boolean, wishCount: number) => ({
  productId,
  isWished,
  wishCount,
})

beforeEach(() => {
  vi.unstubAllGlobals()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useToggleWishOptimistic', () => {
  it('누르는 즉시 반영되고, 성공 후에도 개수가 한 번만 바뀐다', async () => {
    const { requests, client, result, item } = setup(useToggleWishOptimistic)

    act(() => result.current.mutate({ productId: '1', isWished: true }))
    await waitForRequests(requests, 1)
    expect(requests[0]).toMatchObject({
      url: '/api/wishlist/1',
      method: 'POST',
    })
    expect(item('1')).toMatchObject({ isWished: true, wishCount: 11 })

    requests[0].respond(200, ok('1', true, 11))
    await waitForIdle(client)
    expect(item('1')).toMatchObject({ isWished: true, wishCount: 11 })
  })

  it('찜 해제도 개수가 한 번만 준다', async () => {
    const { requests, client, result, item } = setup(useToggleWishOptimistic)

    act(() => result.current.mutate({ productId: '3', isWished: false }))
    await waitForRequests(requests, 1)
    expect(item('3')).toMatchObject({ isWished: false, wishCount: 19 })

    requests[0].respond(200, ok('3', false, 19))
    await waitForIdle(client)
    expect(item('3')).toMatchObject({ isWished: false, wishCount: 19 })
  })

  it('실패하면 그 상품만 원래 상태로 돌아간다', async () => {
    const { requests, client, result, item } = setup(useToggleWishOptimistic)

    act(() => result.current.mutate({ productId: '1', isWished: true }))
    await waitForRequests(requests, 1)
    requests[0].respond(500, { message: 'fail' })
    await waitForIdle(client)

    expect(item('1')).toEqual(product('1'))
    expect(item('2')).toEqual(product('2'))
    expect(item('3')).toEqual(product('3', true, 20))
  })

  it('연속 클릭 중 앞의 요청이 나중에 실패해도, 먼저 성공한 상품은 유지된다', async () => {
    const { requests, client, result, item } = setup(useToggleWishOptimistic)

    act(() => result.current.mutate({ productId: '1', isWished: true }))
    act(() => result.current.mutate({ productId: '2', isWished: true }))
    await waitForRequests(requests, 2)
    expect(item('1')).toMatchObject({ isWished: true, wishCount: 11 })
    expect(item('2')).toMatchObject({ isWished: true, wishCount: 11 })

    // 2가 먼저 성공하고, 그 뒤에 1이 실패한다
    requests[1].respond(200, ok('2', true, 11))
    requests[0].respond(500, { message: 'fail' })
    await waitForIdle(client)

    expect(item('1')).toEqual(product('1'))
    expect(item('2')).toMatchObject({ isWished: true, wishCount: 11 })
  })

  it('연속 클릭 중 하나가 먼저 실패해도, 아직 진행 중인 다른 상품의 낙관적 값은 남는다', async () => {
    const { requests, client, result, item } = setup(useToggleWishOptimistic)

    act(() => result.current.mutate({ productId: '1', isWished: true }))
    act(() => result.current.mutate({ productId: '3', isWished: false }))
    await waitForRequests(requests, 2)

    // 1만 실패시키고, 3은 아직 응답하지 않은 상태
    requests[0].respond(500, { message: 'fail' })
    await waitFor(() => expect(item('1')).toEqual(product('1')))
    expect(item('3')).toMatchObject({ isWished: false, wishCount: 19 })

    requests[1].respond(200, ok('3', false, 19))
    await waitForIdle(client)
    expect(item('3')).toMatchObject({ isWished: false, wishCount: 19 })
  })
})

describe('useToggleWishServer', () => {
  it('응답 전에는 그대로이고, 성공하면 서버 값으로 바뀐다', async () => {
    const { requests, client, result, item } = setup(useToggleWishServer)

    act(() => result.current.mutate({ productId: '1', isWished: true }))
    await waitForRequests(requests, 1)
    expect(item('1')).toEqual(product('1'))

    requests[0].respond(200, ok('1', true, 11))
    await waitForIdle(client)
    expect(item('1')).toMatchObject({ isWished: true, wishCount: 11 })
  })

  it('실패하면 캐시를 바꾸지 않는다', async () => {
    const { requests, client, result, item } = setup(useToggleWishServer)

    act(() => result.current.mutate({ productId: '1', isWished: true }))
    await waitForRequests(requests, 1)
    requests[0].respond(500, { message: 'fail' })
    await waitForIdle(client)

    expect(item('1')).toEqual(product('1'))
  })
})

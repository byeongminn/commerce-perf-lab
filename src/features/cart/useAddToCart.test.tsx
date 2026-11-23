// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartResponse } from '@/lib/types'
import {
  createTestClient,
  mockFetch,
  waitForIdle,
  waitForRequests,
} from '@/test/mock-fetch'

import {
  CART_KEY,
  useAddToCartOptimistic,
  useAddToCartServer,
} from './useAddToCart'

const INITIAL: CartResponse = {
  items: [{ productId: 'a', quantity: 1 }],
  totalQuantity: 1,
}

function setup<T>(useHook: () => T) {
  const requests = mockFetch()
  const { client, Wrapper } = createTestClient()
  client.setQueryData(CART_KEY, INITIAL)
  const { result } = renderHook(useHook, { wrapper: Wrapper })
  const cart = () => client.getQueryData<CartResponse>(CART_KEY)
  return { requests, client, result, cart }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAddToCartOptimistic', () => {
  it('누르는 즉시 담기고, 성공 후에도 개수가 한 번만 늘어난다', async () => {
    const { requests, client, result, cart } = setup(useAddToCartOptimistic)

    act(() => result.current.mutate({ productId: 'b', quantity: 2 }))
    await waitForRequests(requests, 1)
    expect(cart()?.totalQuantity).toBe(3)

    requests[0].respond(200, {
      items: [...INITIAL.items, { productId: 'b', quantity: 2 }],
      totalQuantity: 3,
    })
    await waitForIdle(client)
    expect(cart()).toEqual({
      items: [
        { productId: 'a', quantity: 1 },
        { productId: 'b', quantity: 2 },
      ],
      totalQuantity: 3,
    })
  })

  it('실패하면 그 요청이 담은 수량만 빠진다', async () => {
    const { requests, client, result, cart } = setup(useAddToCartOptimistic)

    act(() => result.current.mutate({ productId: 'b', quantity: 2 }))
    await waitForRequests(requests, 1)
    requests[0].respond(500, { message: 'fail' })
    await waitForIdle(client)

    expect(cart()).toEqual(INITIAL)
  })

  it('같은 상품을 연속으로 담다가 하나만 실패하면, 성공한 수량은 남는다', async () => {
    const { requests, client, result, cart } = setup(useAddToCartOptimistic)

    act(() => result.current.mutate({ productId: 'a', quantity: 2 }))
    act(() => result.current.mutate({ productId: 'a', quantity: 3 }))
    await waitForRequests(requests, 2)
    expect(cart()?.totalQuantity).toBe(6)

    // 두 번째(3개)가 먼저 성공하고, 첫 번째(2개)가 나중에 실패한다
    requests[1].respond(200, {
      items: [{ productId: 'a', quantity: 4 }],
      totalQuantity: 4,
    })
    requests[0].respond(500, { message: 'fail' })
    await waitForIdle(client)

    expect(cart()).toEqual({
      items: [{ productId: 'a', quantity: 4 }],
      totalQuantity: 4,
    })
  })

  it('다른 상품을 연속으로 담다가 하나만 실패하면, 그 상품만 빠진다', async () => {
    const { requests, client, result, cart } = setup(useAddToCartOptimistic)

    act(() => result.current.mutate({ productId: 'b', quantity: 1 }))
    act(() => result.current.mutate({ productId: 'c', quantity: 1 }))
    await waitForRequests(requests, 2)

    requests[0].respond(500, { message: 'fail' })
    requests[1].respond(200, {
      items: [...INITIAL.items, { productId: 'c', quantity: 1 }],
      totalQuantity: 2,
    })
    await waitForIdle(client)

    expect(cart()).toEqual({
      items: [
        { productId: 'a', quantity: 1 },
        { productId: 'c', quantity: 1 },
      ],
      totalQuantity: 2,
    })
  })
})

describe('useAddToCartServer', () => {
  it('응답 전에는 그대로이고, 성공하면 서버 응답으로 바뀐다', async () => {
    const { requests, client, result, cart } = setup(useAddToCartServer)

    act(() => result.current.mutate({ productId: 'b', quantity: 2 }))
    await waitForRequests(requests, 1)
    expect(cart()).toEqual(INITIAL)

    const serverCart: CartResponse = {
      items: [...INITIAL.items, { productId: 'b', quantity: 2 }],
      totalQuantity: 3,
    }
    requests[0].respond(200, serverCart)
    await waitForIdle(client)
    expect(cart()).toEqual(serverCart)
  })

  it('실패하면 캐시를 바꾸지 않는다', async () => {
    const { requests, client, result, cart } = setup(useAddToCartServer)

    act(() => result.current.mutate({ productId: 'b', quantity: 2 }))
    await waitForRequests(requests, 1)
    requests[0].respond(500, { message: 'fail' })
    await waitForIdle(client)

    expect(cart()).toEqual(INITIAL)
  })
})

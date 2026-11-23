import type { CartResponse, ProductListResponse, WishResponse } from './types'

// 개발용 패널에서 바꾸는 지연 · 실패 설정. 모든 요청에 헤더로 붙는다
export const mockSettings = { delay: 0, fail: 0 }

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-mock-delay': String(mockSettings.delay),
      'x-mock-fail': String(mockSettings.fail),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(`요청 실패 (${res.status})`)
  return res.json()
}

export function getProducts(params: URLSearchParams, cursor: number) {
  const search = new URLSearchParams(params)
  search.set('cursor', String(cursor))
  return fetchJson<ProductListResponse>(`/api/products?${search}`)
}

export function setWish(productId: string, isWished: boolean) {
  return fetchJson<WishResponse>(`/api/wishlist/${productId}`, {
    method: isWished ? 'POST' : 'DELETE',
  })
}

export function getCart() {
  return fetchJson<CartResponse>('/api/cart')
}

export function addToCart(productId: string, quantity: number) {
  return fetchJson<CartResponse>('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })
}

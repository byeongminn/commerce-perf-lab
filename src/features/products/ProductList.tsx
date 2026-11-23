'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  useAddToCartOptimistic,
  useAddToCartServer,
  useCart,
} from '@/features/cart/useAddToCart'
import {
  useToggleWishOptimistic,
  useToggleWishServer,
} from '@/features/wishlist/useToggleWish'
import { getProducts } from '@/lib/api'
import type { Product } from '@/lib/types'

type Variant = 'server' | 'optimistic'

// 개선 전 기준: 불러온 상품을 전부 DOM에 그린다 (3단계에서 가상 스크롤과 비교)
export function ProductList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'latest'
  const variant: Variant =
    searchParams.get('variant') === 'optimistic' ? 'optimistic' : 'server'

  // variant는 화면 구현만 바꾸므로 목록 요청 · queryKey에서는 뺀다
  const filters = new URLSearchParams(searchParams)
  filters.delete('variant')

  const {
    data,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['products', filters.toString()],
    queryFn: ({ pageParam }) => getProducts(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  // 목록 끝의 sentinel이 화면에 들어오면 다음 페이지를 불러온다
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (status === 'pending') return <p className="p-8">불러오는 중...</p>
  if (status === 'error') {
    return (
      <div className="p-8">
        <p>상품을 불러오지 못했습니다.</p>
        <button
          className="mt-2 rounded border px-3 py-1"
          onClick={() => refetch()}
        >
          다시 시도
        </button>
      </div>
    )
  }

  const products = data.pages.flatMap((page) => page.items)

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    router.replace(`?${next}`)
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p>총 {data.pages[0].totalCount.toLocaleString()}개</p>
        <CartCount />
        <select
          className="rounded border px-2 py-1"
          value={variant}
          onChange={(e) => setParam('variant', e.target.value)}
        >
          <option value="server">찜 · 담기: 서버 응답 후 반영</option>
          <option value="optimistic">찜 · 담기: 낙관적 업데이트</option>
        </select>
        <select
          className="rounded border px-2 py-1"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          <option value="latest">최신순</option>
          <option value="price_asc">낮은 가격순</option>
          <option value="price_desc">높은 가격순</option>
          <option value="rating">평점순</option>
        </select>
      </div>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant={variant} />
        ))}
      </ul>

      <div ref={sentinelRef} className="h-10" />
      {isFetchingNextPage && <p className="text-center">더 불러오는 중...</p>}
      {!hasNextPage && (
        <p className="text-center text-gray-500">마지막 상품입니다</p>
      )}
    </div>
  )
}

function CartCount() {
  const { data } = useCart()
  return <p>장바구니 {data?.totalQuantity ?? 0}개</p>
}

function ProductCard({
  product,
  variant,
}: {
  product: Product
  variant: Variant
}) {
  // 훅은 조건부로 부를 수 없어서 두 구현을 모두 만들고 variant에 맞는 쪽을 쓴다
  const wishServer = useToggleWishServer()
  const wishOptimistic = useToggleWishOptimistic()
  const cartServer = useAddToCartServer()
  const cartOptimistic = useAddToCartOptimistic()
  const wish = variant === 'optimistic' ? wishOptimistic : wishServer
  const cart = variant === 'optimistic' ? cartOptimistic : cartServer

  return (
    <li className="rounded-lg border p-2">
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={300}
        height={300}
        sizes="(min-width: 768px) 25vw, 50vw"
        className="aspect-square w-full rounded object-cover"
      />
      <p className="mt-2 truncate text-sm">{product.name}</p>
      <p className="font-bold">{product.price.toLocaleString()}원</p>
      <p className="text-xs text-gray-500">★ {product.rating}</p>
      <div className="mt-2 flex items-center justify-between text-sm">
        {/* 같은 상품의 찜 요청은 한 번에 하나만 보낸다. 찜은 켜고 끄는 토글이라
            같은 상품에 요청이 겹치면 어느 응답이 최종인지 보장할 수 없기 때문 */}
        <button
          className="disabled:opacity-50"
          disabled={wish.isPending}
          onClick={() =>
            wish.mutate({ productId: product.id, isWished: !product.isWished })
          }
        >
          <span className="text-red-500">{product.isWished ? '♥' : '♡'}</span>{' '}
          {product.wishCount.toLocaleString()}
        </button>
        <button
          className="rounded border px-2"
          onClick={() => cart.mutate({ productId: product.id, quantity: 1 })}
        >
          담기
        </button>
      </div>
    </li>
  )
}

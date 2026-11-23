'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { useCart } from '@/features/cart/useAddToCart'
import { getProducts } from '@/lib/api'

import { ProductCard, type WishMode } from './ProductCard'
import { VirtualProductGrid } from './VirtualProductGrid'

// 실험별 전환 키. 화면 구현만 바꾸므로 목록 요청 · queryKey에서는 뺀다
const EXPERIMENT_KEYS = ['wish', 'list']

export function ProductList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'latest'
  // 실험 2: 찜 · 담기 반영 방식
  const wishMode: WishMode =
    searchParams.get('wish') === 'optimistic' ? 'optimistic' : 'server'
  // 실험 3: 목록 렌더링 방식
  const isVirtual = searchParams.get('list') === 'virtual'

  const filters = new URLSearchParams(searchParams)
  EXPERIMENT_KEYS.forEach((key) => filters.delete(key))

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

  // 목록 끝의 sentinel이 화면에 들어오면 다음 페이지를 불러온다.
  // 가상 스크롤도 전체 높이를 차지하므로 같은 방식으로 동작한다
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
        <p>
          총 {data.pages[0].totalCount.toLocaleString()}개 · 불러온{' '}
          {products.length.toLocaleString()}개
        </p>
        <CartCount />
        <select
          className="rounded border px-2 py-1"
          value={isVirtual ? 'virtual' : 'all'}
          onChange={(e) => setParam('list', e.target.value)}
        >
          <option value="all">목록: 전부 렌더</option>
          <option value="virtual">목록: 가상 스크롤</option>
        </select>
        <select
          className="rounded border px-2 py-1"
          value={wishMode}
          onChange={(e) => setParam('wish', e.target.value)}
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

      {isVirtual ? (
        <VirtualProductGrid products={products} wishMode={wishMode} />
      ) : (
        // 실험 3 개선 전: 불러온 상품을 전부 DOM에 그린다
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              wishMode={wishMode}
            />
          ))}
        </ul>
      )}

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

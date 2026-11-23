'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { getProducts } from '@/lib/api'
import type { Product } from '@/lib/types'

// 개선 전 기준: 불러온 상품을 전부 DOM에 그린다 (3단계에서 가상 스크롤과 비교)
export function ProductList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'latest'

  const {
    data,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['products', searchParams.toString()],
    queryFn: ({ pageParam }) => getProducts(searchParams, pageParam),
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

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <p>총 {data.pages[0].totalCount.toLocaleString()}개</p>
        <select
          className="rounded border px-2 py-1"
          value={sort}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams)
            next.set('sort', e.target.value)
            router.replace(`?${next}`)
          }}
        >
          <option value="latest">최신순</option>
          <option value="price_asc">낮은 가격순</option>
          <option value="price_desc">높은 가격순</option>
          <option value="rating">평점순</option>
        </select>
      </div>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
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

function ProductCard({ product }: { product: Product }) {
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
      <p className="text-xs text-gray-500">
        ★ {product.rating} · {product.isWished ? '♥' : '♡'}{' '}
        {product.wishCount.toLocaleString()}
      </p>
    </li>
  )
}

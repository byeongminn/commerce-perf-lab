'use client'

import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { Product } from '@/lib/types'

import { ProductCard, type WishMode } from './ProductCard'

// 실험 3 개선 후: 화면에 보이는 줄(+ 앞뒤 여유분)만 DOM에 그린다.
// 그리드라서 상품 하나가 아니라 "한 줄"을 가상화 단위로 쓴다

const DESKTOP = '(min-width: 768px)' // Tailwind md

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** 한 줄에 들어가는 상품 수. ProductGrid의 grid-cols-2 md:grid-cols-4와 맞춘다 */
function useColumns() {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(DESKTOP).matches ? 4 : 2),
    () => 2,
  )
}

export function VirtualProductGrid({
  products,
  wishMode,
}: {
  products: Product[]
  wishMode: WishMode
}) {
  const columns = useColumns()
  const rowCount = Math.ceil(products.length / columns)

  // 목록이 페이지 맨 위에서 얼마나 떨어져 있는지 (위쪽 헤더 높이만큼 보정)
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    setScrollMargin(listRef.current?.offsetTop ?? 0)
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 400, // 첫 렌더용 추정치. 실제 높이는 measureElement로 잰다
    overscan: 3,
    gap: 16,
    scrollMargin,
  })

  return (
    <div
      ref={listRef}
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((row) => (
        <ul
          key={row.key}
          data-index={row.index}
          ref={virtualizer.measureElement}
          className="absolute top-0 left-0 grid w-full grid-cols-2 gap-4 md:grid-cols-4"
          style={{
            transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {products
            .slice(row.index * columns, (row.index + 1) * columns)
            .map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishMode={wishMode}
              />
            ))}
        </ul>
      ))}
    </div>
  )
}

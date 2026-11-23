'use client'

import Image from 'next/image'

import {
  useAddToCartOptimistic,
  useAddToCartServer,
} from '@/features/cart/useAddToCart'
import {
  useToggleWishOptimistic,
  useToggleWishServer,
} from '@/features/wishlist/useToggleWish'
import type { Product } from '@/lib/types'

/** 실험 2: 찜 · 담기 반영 방식 (?wish=) */
export type WishMode = 'server' | 'optimistic'

export function ProductCard({
  product,
  wishMode,
}: {
  product: Product
  wishMode: WishMode
}) {
  // 훅은 조건부로 부를 수 없어서 두 구현을 모두 만들고 wishMode에 맞는 쪽을 쓴다
  const wishServer = useToggleWishServer()
  const wishOptimistic = useToggleWishOptimistic()
  const cartServer = useAddToCartServer()
  const cartOptimistic = useAddToCartOptimistic()
  const wish = wishMode === 'optimistic' ? wishOptimistic : wishServer
  const cart = wishMode === 'optimistic' ? cartOptimistic : cartServer

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

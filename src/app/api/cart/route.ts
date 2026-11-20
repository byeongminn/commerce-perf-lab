import type { CartResponse } from '@/lib/types'
import { cart, simulate } from '@/server/data'

function cartResponse(): CartResponse {
  const items = [...cart].map(([productId, quantity]) => ({
    productId,
    quantity,
  }))
  return {
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

export async function GET(request: Request) {
  const failed = await simulate(request)
  if (failed) return failed
  return Response.json(cartResponse())
}

// body: { productId: string, quantity?: number }
export async function POST(request: Request) {
  const failed = await simulate(request)
  if (failed) return failed

  const { productId, quantity = 1 } = await request.json()
  cart.set(productId, (cart.get(productId) ?? 0) + quantity)
  return Response.json(cartResponse())
}

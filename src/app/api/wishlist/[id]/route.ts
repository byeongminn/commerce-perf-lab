import { products, simulate } from '@/server/data'

async function toggle(
  request: Request,
  { params }: RouteContext<'/api/wishlist/[id]'>,
  wished: boolean,
) {
  const failed = await simulate(request)
  if (failed) return failed

  const { id } = await params
  const product = products.find((item) => item.id === id)
  if (!product) return Response.json({ message: '없는 상품' }, { status: 404 })

  // 이미 같은 상태면 개수를 바꾸지 않는다 (같은 요청이 두 번 와도 결과가 같게)
  if (product.isWished !== wished) {
    product.isWished = wished
    product.wishCount += wished ? 1 : -1
  }
  return Response.json({
    productId: id,
    isWished: product.isWished,
    wishCount: product.wishCount,
  })
}

export function POST(
  request: Request,
  context: RouteContext<'/api/wishlist/[id]'>,
) {
  return toggle(request, context, true)
}

export function DELETE(
  request: Request,
  context: RouteContext<'/api/wishlist/[id]'>,
) {
  return toggle(request, context, false)
}

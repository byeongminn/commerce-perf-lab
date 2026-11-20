import { products, simulate } from '@/server/data'

export async function GET(
  request: Request,
  { params }: RouteContext<'/api/products/[id]'>,
) {
  const failed = await simulate(request)
  if (failed) return failed

  const { id } = await params
  const product = products.find((item) => item.id === id)
  if (!product) return Response.json({ message: '없는 상품' }, { status: 404 })
  return Response.json(product)
}

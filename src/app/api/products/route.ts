import { products, simulate } from '@/server/data'

// ?category=top&minPrice=10000&maxPrice=50000&color=black&size=M&sort=price_asc&cursor=20&limit=20
// cursor는 "다음 페이지의 시작 인덱스"
export async function GET(request: Request) {
  const failed = await simulate(request)
  if (failed) return failed

  const p = new URL(request.url).searchParams
  const category = p.get('category')
  const color = p.get('color')
  const size = p.get('size')
  const minPrice = Number(p.get('minPrice') ?? 0)
  const maxPrice = Number(p.get('maxPrice') ?? Infinity)
  const sort = p.get('sort') ?? 'latest'
  const cursor = Number(p.get('cursor') ?? 0)
  const limit = Number(p.get('limit') ?? 20)

  const filtered = products.filter(
    (item) =>
      (!category || item.category === category) &&
      (!color || item.options.colors.includes(color)) &&
      (!size || item.options.sizes.includes(size)) &&
      item.price >= minPrice &&
      item.price <= maxPrice,
  )

  const sorted = filtered.toSorted((a, b) => {
    if (sort === 'price_asc') return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'rating') return b.rating - a.rating
    return b.createdAt.localeCompare(a.createdAt)
  })

  const items = sorted.slice(cursor, cursor + limit)
  const next = cursor + limit

  return Response.json({
    items,
    nextCursor: next < sorted.length ? next : null,
    totalCount: sorted.length,
  })
}

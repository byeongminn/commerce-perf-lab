export const CATEGORIES = ['outer', 'top', 'bottom', 'shoes', 'bag'] as const
export type Category = (typeof CATEGORIES)[number]

export const COLORS = ['black', 'white', 'gray', 'navy', 'beige'] as const
export const SIZES = ['S', 'M', 'L', 'XL'] as const

export type Product = {
  id: string
  name: string
  price: number
  category: Category
  options: { colors: string[]; sizes: string[] }
  rating: number
  wishCount: number
  isWished: boolean
  imageUrl: string
  createdAt: string
}

export type ProductListResponse = {
  items: Product[]
  nextCursor: number | null
  totalCount: number
}

export type CartResponse = {
  items: { productId: string; quantity: number }[]
  totalQuantity: number
}

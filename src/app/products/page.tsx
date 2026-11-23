import { Suspense } from 'react'

import { ProductList } from '@/features/products/ProductList'

export default function ProductsPage() {
  // useSearchParams를 쓰는 클라이언트 컴포넌트는 Suspense로 감싸야 한다
  return (
    <Suspense fallback={<p className="p-8">불러오는 중...</p>}>
      <ProductList />
    </Suspense>
  )
}

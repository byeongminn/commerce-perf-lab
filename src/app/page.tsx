import Link from 'next/link'

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">commerce-perf-lab</h1>
      <Link href="/products" className="mt-4 inline-block underline">
        상품 목록
      </Link>
    </main>
  )
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { expect, vi } from 'vitest'

// mutation 훅 테스트용 도우미.
// fetch를 가짜로 바꿔 요청을 붙잡아 두고, 테스트가 원하는 순서로 성공 · 실패시킨다

type PendingRequest = {
  url: string
  method: string
  respond: (status: number, body: unknown) => void
}

export function mockFetch() {
  const requests: PendingRequest[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (url: string, init?: RequestInit) =>
        new Promise<Response>((resolve) => {
          requests.push({
            url,
            method: init?.method ?? 'GET',
            respond: (status, body) =>
              resolve(new Response(JSON.stringify(body), { status })),
          })
        }),
    ),
  )
  return requests
}

export function createTestClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { client, Wrapper }
}

/** onMutate의 await(cancelQueries)가 끝나 실제 요청이 나갈 때까지 기다린다 */
export function waitForRequests(requests: PendingRequest[], count: number) {
  return waitFor(() => expect(requests).toHaveLength(count))
}

/** 모든 mutation이 끝날 때까지 기다린다 */
export function waitForIdle(client: QueryClient) {
  return waitFor(() => expect(client.isMutating()).toBe(0))
}

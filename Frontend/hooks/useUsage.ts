import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { UsageStats } from '@/types'

export function useUsage() {
  const { data, isLoading, error, refetch } = useQuery<UsageStats>({
    queryKey: ['usage'],
    queryFn: async () => {
      const { data } = await api.get('/api/usage')
      return data
    },
    staleTime: 60_000,
    retry: 1,
  })

  return {
    stats: data ?? null,
    isLoading,
    error,
    refetch,
  }
}

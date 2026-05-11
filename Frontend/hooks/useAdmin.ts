import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User, AdminStats } from '@/types'

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/stats')
      return data.stats
    },
    staleTime: 30_000,
    retry: 1,
  })
}

export function useAdminUsers() {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/users')
      return data.users ?? []
    },
    staleTime: 30_000,
    retry: 1,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { is_active?: boolean; role?: string }
    }) => api.patch(`/api/admin/users/${id}`, payload),
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'users'] })
      const prev = qc.getQueryData<User[]>(['admin', 'users'])
      qc.setQueryData<User[]>(['admin', 'users'], (old) =>
        old?.map((u) => (u.id === id ? { ...u, ...payload } : u)) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'users'], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  return {
    users: data ?? [],
    isLoading,
    error,
    updateUser: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
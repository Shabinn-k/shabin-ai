import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Conversation } from '@/types'

const QUERY_KEY = ['conversations']

export function useConversations() {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery<Conversation[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/api/conversations')
      return data.conversations ?? []
    },
    staleTime: 30_000,
    retry: 1,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/conversations/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY })
      const prev = qc.getQueryData<Conversation[]>(QUERY_KEY)
      qc.setQueryData<Conversation[]>(QUERY_KEY, (old) =>
        old?.filter((c) => c.id !== id) ?? []
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.patch(`/api/conversations/${id}/title`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  return {
    conversations: data ?? [],
    isLoading,
    error,
    deleteConversation: deleteMutation.mutate,
    renameConversation: renameMutation.mutate,
    refetch: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  }
}

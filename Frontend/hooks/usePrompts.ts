import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SavedPrompt } from '@/types'

const KEY = ['prompts']

export function usePrompts() {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery<SavedPrompt[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get('/api/prompts')
      return data.prompts ?? []
    },
    staleTime: 60_000,
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: (body: {
      title: string
      content: string
      category: string
    }) => api.post('/api/prompts', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/prompts/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<SavedPrompt[]>(KEY)
      qc.setQueryData<SavedPrompt[]>(KEY, (old) =>
        old?.filter((p) => p.id !== id) ?? []
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return {
    prompts: data ?? [],
    isLoading,
    error,
    createPrompt: createMutation.mutateAsync,
    deletePrompt: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  }
}
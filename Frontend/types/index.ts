export interface User {
  id: string
  name: string
  email: string
  avatar_url: string
  provider: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  model: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used: number
  file_url?: string
  created_at: string
}

export interface SavedPrompt {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  created_at: string
}

export interface APIUsage {
  id: string
  conversation_id: string
  model: string
  prompt_tokens: number
  response_tokens: number
  cost_usd: number
  created_at: string
}

export interface UsageStats {
  total_messages: number
  total_prompt_tokens: number
  total_response_tokens: number
  total_cost_usd: number
  recent: APIUsage[]
}

export interface AdminStats {
  total_users: number
  active_today: number
  total_conversations: number
  total_messages: number
  total_cost_usd: number
}

export interface AuthResponse {
  token: string
  refresh_token: string
  user: User
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Conversation {
  id: string;
  user_id: string;
  started_at: string;
  last_interaction: string;
  context_summary: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  created_at: string;
}

export interface LearnedPreference {
  id: string;
  user_id: string;
  preference_type: string;
  preference_key: string;
  preference_value: string;
  confidence_score: number;
  learned_from_conversations: string[];
  last_updated: string;
  created_at: string;
}

export interface KnowledgeTopic {
  id: string;
  user_id: string;
  topic: string;
  mention_count: number;
  last_mentioned: string;
  related_keywords: string[];
  notes: string;
  created_at: string;
}

export interface PersonalityEvolution {
  id: string;
  user_id: string;
  trait_name: string;
  trait_value: string;
  evolution_history: Array<{
    value: string;
    timestamp: string;
    reason: string;
  }>;
  last_updated: string;
  created_at: string;
}

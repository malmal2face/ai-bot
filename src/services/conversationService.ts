import { supabase, Conversation, Message } from '../lib/supabase';

export const conversationService = {
  async createConversation(userId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
        context_summary: ''
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  },

  async getRecentConversations(userId: string, limit: number = 5): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_interaction', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  },

  async updateConversationContext(conversationId: string, contextSummary: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        context_summary: contextSummary,
        last_interaction: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation context:', error);
    }
  },

  async addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        timestamp: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    await supabase
      .from('conversations')
      .update({ last_interaction: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  }
};

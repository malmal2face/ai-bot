import { supabase, LearnedPreference, KnowledgeTopic, PersonalityEvolution } from '../lib/supabase';

export const learningService = {
  async getPreferences(userId: string): Promise<LearnedPreference[]> {
    const { data, error } = await supabase
      .from('learned_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false });

    if (error) {
      console.error('Error fetching preferences:', error);
      return [];
    }

    return data || [];
  },

  async updatePreference(
    userId: string,
    preferenceType: string,
    preferenceKey: string,
    preferenceValue: string,
    conversationId: string,
    confidenceScore: number = 0.5
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('learned_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('preference_type', preferenceType)
      .eq('preference_key', preferenceKey)
      .maybeSingle();

    if (existing) {
      const updatedConversations = [...existing.learned_from_conversations, conversationId];
      const newConfidence = Math.min(1, existing.confidence_score + 0.1);

      await supabase
        .from('learned_preferences')
        .update({
          preference_value: preferenceValue,
          confidence_score: newConfidence,
          learned_from_conversations: updatedConversations,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('learned_preferences')
        .insert({
          user_id: userId,
          preference_type: preferenceType,
          preference_key: preferenceKey,
          preference_value: preferenceValue,
          confidence_score: confidenceScore,
          learned_from_conversations: [conversationId],
          last_updated: new Date().toISOString()
        });
    }
  },

  async updateTopic(
    userId: string,
    topic: string,
    keywords: string[] = [],
    notes: string = ''
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('knowledge_topics')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .maybeSingle();

    if (existing) {
      const combinedKeywords = Array.from(new Set([...existing.related_keywords, ...keywords]));
      const combinedNotes = existing.notes ? `${existing.notes}\n${notes}` : notes;

      await supabase
        .from('knowledge_topics')
        .update({
          mention_count: existing.mention_count + 1,
          last_mentioned: new Date().toISOString(),
          related_keywords: combinedKeywords,
          notes: combinedNotes
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('knowledge_topics')
        .insert({
          user_id: userId,
          topic,
          mention_count: 1,
          last_mentioned: new Date().toISOString(),
          related_keywords: keywords,
          notes
        });
    }
  },

  async getTopics(userId: string): Promise<KnowledgeTopic[]> {
    const { data, error } = await supabase
      .from('knowledge_topics')
      .select('*')
      .eq('user_id', userId)
      .order('mention_count', { ascending: false });

    if (error) {
      console.error('Error fetching topics:', error);
      return [];
    }

    return data || [];
  },

  async updatePersonalityTrait(
    userId: string,
    traitName: string,
    traitValue: string,
    reason: string
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('personality_evolution')
      .select('*')
      .eq('user_id', userId)
      .eq('trait_name', traitName)
      .maybeSingle();

    const historyEntry = {
      value: traitValue,
      timestamp: new Date().toISOString(),
      reason
    };

    if (existing) {
      const updatedHistory = [...(existing.evolution_history || []), historyEntry];

      await supabase
        .from('personality_evolution')
        .update({
          trait_value: traitValue,
          evolution_history: updatedHistory,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('personality_evolution')
        .insert({
          user_id: userId,
          trait_name: traitName,
          trait_value: traitValue,
          evolution_history: [historyEntry],
          last_updated: new Date().toISOString()
        });
    }
  },

  async getPersonalityTraits(userId: string): Promise<PersonalityEvolution[]> {
    const { data, error } = await supabase
      .from('personality_evolution')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching personality traits:', error);
      return [];
    }

    return data || [];
  }
};

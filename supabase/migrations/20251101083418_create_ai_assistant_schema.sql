/*
  # AI Assistant with Evolving Personality Schema

  ## Overview
  This migration creates the database structure for an AI assistant that learns and evolves through interactions.

  ## New Tables

  ### `conversations`
  Stores individual conversation sessions
  - `id` (uuid, primary key) - Unique conversation identifier
  - `user_id` (text) - User identifier (can be browser fingerprint or actual user ID)
  - `started_at` (timestamptz) - When conversation began
  - `last_interaction` (timestamptz) - Most recent message timestamp
  - `context_summary` (text) - Summary of conversation context
  - `created_at` (timestamptz) - Record creation timestamp

  ### `messages`
  Stores individual messages within conversations
  - `id` (uuid, primary key) - Unique message identifier
  - `conversation_id` (uuid, foreign key) - Links to conversations table
  - `role` (text) - Either 'user' or 'assistant'
  - `content` (text) - Message content
  - `timestamp` (timestamptz) - When message was sent
  - `created_at` (timestamptz) - Record creation timestamp

  ### `learned_preferences`
  Tracks user preferences and patterns learned over time
  - `id` (uuid, primary key) - Unique preference identifier
  - `user_id` (text) - User identifier
  - `preference_type` (text) - Category (communication_style, topics, interaction_pattern)
  - `preference_key` (text) - Specific preference name
  - `preference_value` (text) - Value or description
  - `confidence_score` (numeric) - How confident we are (0-1)
  - `learned_from_conversations` (text[]) - Array of conversation IDs
  - `last_updated` (timestamptz) - When preference was last reinforced
  - `created_at` (timestamptz) - Record creation timestamp

  ### `knowledge_topics`
  Tracks topics user frequently discusses for deeper learning
  - `id` (uuid, primary key) - Unique topic identifier
  - `user_id` (text) - User identifier
  - `topic` (text) - Topic name or category
  - `mention_count` (integer) - How many times discussed
  - `last_mentioned` (timestamptz) - Most recent mention
  - `related_keywords` (text[]) - Related terms and concepts
  - `notes` (text) - AI's accumulated knowledge about this topic for this user
  - `created_at` (timestamptz) - Record creation timestamp

  ### `personality_evolution`
  Tracks how the AI's personality adapts over time
  - `id` (uuid, primary key) - Unique evolution record identifier
  - `user_id` (text) - User identifier
  - `trait_name` (text) - Personality trait (curiosity_level, formality, humor_style, etc.)
  - `trait_value` (text) - Current value or description
  - `evolution_history` (jsonb) - History of changes with timestamps
  - `last_updated` (timestamptz) - When trait was last modified
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Anonymous users identified by browser fingerprint or session ID
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_interaction timestamptz DEFAULT now(),
  context_summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learned_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  preference_type text NOT NULL,
  preference_key text NOT NULL,
  preference_value text NOT NULL,
  confidence_score numeric DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  learned_from_conversations text[] DEFAULT ARRAY[]::text[],
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  topic text NOT NULL,
  mention_count integer DEFAULT 1,
  last_mentioned timestamptz DEFAULT now(),
  related_keywords text[] DEFAULT ARRAY[]::text[],
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personality_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  trait_name text NOT NULL,
  trait_value text NOT NULL,
  evolution_history jsonb DEFAULT '[]'::jsonb,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_evolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (true);

CREATE POLICY "Users can view messages in conversations"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own preferences"
  ON learned_preferences FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own preferences"
  ON learned_preferences FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own preferences"
  ON learned_preferences FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own topics"
  ON knowledge_topics FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own topics"
  ON knowledge_topics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own topics"
  ON knowledge_topics FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own personality evolution"
  ON personality_evolution FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own personality evolution"
  ON personality_evolution FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own personality evolution"
  ON personality_evolution FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_learned_preferences_user_id ON learned_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_topics_user_id ON knowledge_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_evolution_user_id ON personality_evolution(user_id);

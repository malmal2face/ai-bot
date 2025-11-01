import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Brain, TrendingUp, Search } from 'lucide-react';
import { useUserId } from '../hooks/useUserId';
import { conversationService } from '../services/conversationService';
import { learningService } from '../services/learningService';
import { Message } from '../lib/supabase';
import ChatMessage from './ChatMessage';
import PersonalityPanel from './PersonalityPanel';
import { aiPersonality } from '../utils/aiPersonality';

interface AIResponse {
  message: string;
  searchPerformed?: boolean;
  searchQuery?: string;
}

const AIAssistant = () => {
  const userId = useUserId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPersonality, setShowPersonality] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [interactionCount, setInteractionCount] = useState(0);

  useEffect(() => {
    if (userId) {
      initializeConversation();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    const recentConversations = await conversationService.getRecentConversations(userId, 1);

    if (recentConversations.length > 0) {
      const lastConversation = recentConversations[0];
      setConversationId(lastConversation.id);

      const pastMessages = await conversationService.getConversationMessages(lastConversation.id);
      setMessages(pastMessages);

      if (pastMessages.length > 0) {
        const assistantMessage: Message = {
          id: `welcome_${Date.now()}`,
          conversation_id: lastConversation.id,
          role: 'assistant',
          content: "Welcome back! I remember our previous conversations. What would you like to explore today?",
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        setMessages([...pastMessages, assistantMessage]);
      }
    } else {
      const newConversation = await conversationService.createConversation(userId);
      if (newConversation) {
        setConversationId(newConversation.id);

        const welcomeMessage: Message = {
          id: `welcome_${Date.now()}`,
          conversation_id: newConversation.id,
          role: 'assistant',
          content: aiPersonality.getGreeting(),
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      }
    }
  };

  const analyzeAndLearn = async (userMessage: string, conversationHistory: Message[]) => {
    if (conversationHistory.length > 3) {
      const hasFormalLanguage = /please|kindly|would you|could you/i.test(userMessage);
      const hasInformalLanguage = /hey|yeah|cool|awesome/i.test(userMessage);

      if (hasFormalLanguage) {
        await learningService.updatePreference(
          userId,
          'communication_style',
          'formality',
          'formal',
          conversationId,
          0.7
        );
      } else if (hasInformalLanguage) {
        await learningService.updatePreference(
          userId,
          'communication_style',
          'formality',
          'casual',
          conversationId,
          0.7
        );
      }
    }

    const topics = extractTopics(userMessage);
    for (const topic of topics) {
      await learningService.updateTopic(
        userId,
        topic,
        [topic.toLowerCase()],
        `Discussed on ${new Date().toLocaleDateString()}`
      );
    }

    if (interactionCount > 0 && interactionCount % 5 === 0) {
      const traits = await learningService.getPersonalityTraits(userId);
      const preferences = await learningService.getPreferences(userId);

      if (preferences.length > 3 && !traits.find(t => t.trait_name === 'adaptability')) {
        await learningService.updatePersonalityTrait(
          userId,
          'adaptability',
          'high',
          'Learned multiple user preferences through sustained interaction'
        );
      }
    }
  };

  const extractTopics = (text: string): string[] => {
    const commonTopics = [
      'technology', 'programming', 'AI', 'machine learning', 'web development',
      'science', 'mathematics', 'business', 'design', 'art', 'music',
      'health', 'fitness', 'cooking', 'travel', 'books', 'movies',
      'sports', 'gaming', 'psychology', 'philosophy', 'history'
    ];

    return commonTopics.filter(topic =>
      text.toLowerCase().includes(topic.toLowerCase())
    );
  };

  const generateAIResponse = async (userMessage: string, history: Message[]): Promise<AIResponse> => {
    const preferences = await learningService.getPreferences(userId);
    const topics = await learningService.getTopics(userId);
    const traits = await learningService.getPersonalityTraits(userId);

    const needsCurrentInfo = /latest|recent|current|today|now|2025/i.test(userMessage) ||
                             /what's happening|news|update/i.test(userMessage);

    let response = '';
    let searchPerformed = false;
    let searchQuery = '';

    if (needsCurrentInfo) {
      searchPerformed = true;
      searchQuery = userMessage.substring(0, 50);
      response = `Let me search for the most up-to-date information on that topic...\n\n`;
      response += `[Simulated Search Results for: "${searchQuery}"]\n\n`;
      response += `Based on current information, here's what I found: `;
      response += aiPersonality.generateResponse(userMessage, preferences, topics, history);
    } else {
      response = aiPersonality.generateResponse(userMessage, preferences, topics, history);
    }

    if (topics.length > 0) {
      const topTopics = topics.slice(0, 3).map(t => t.topic).join(', ');
      response += `\n\n💡 I've noticed you're interested in ${topTopics}. I'm building deeper knowledge in these areas to help you better!`;
    }

    if (traits.length > 0 && history.length > 10) {
      response += `\n\n✨ Our conversations have helped me understand your preferences better. I'm adapting my responses to match your style!`;
    }

    return {
      message: response,
      searchPerformed,
      searchQuery: searchPerformed ? searchQuery : undefined
    };
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const userMsg = await conversationService.addMessage(conversationId, 'user', userMessage);
    if (userMsg) {
      setMessages(prev => [...prev, userMsg]);
    }

    await analyzeAndLearn(userMessage, messages);
    setInteractionCount(prev => prev + 1);

    const aiResponse = await generateAIResponse(userMessage, messages);

    const assistantMsg = await conversationService.addMessage(
      conversationId,
      'assistant',
      aiResponse.message
    );

    if (assistantMsg) {
      setMessages(prev => [...prev, assistantMsg]);
    }

    const contextSummary = `Last discussed: ${userMessage.substring(0, 100)}`;
    await conversationService.updateConversationContext(conversationId, contextSummary);

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Initializing AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-500">Learning and evolving with every conversation</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPersonality(!showPersonality)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">My Evolution</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 flex flex-col ${showPersonality ? 'mr-80' : ''}`}>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Brain className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">Thinking and learning...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share your thoughts, ask questions, or explore ideas..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                  <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="font-medium">Send</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 The more we interact, the better I understand your preferences and communication style
              </p>
            </div>
          </div>

          {showPersonality && (
            <PersonalityPanel userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

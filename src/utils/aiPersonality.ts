import { LearnedPreference, KnowledgeTopic, Message } from '../lib/supabase';

const personalityTraits = {
  greetings: [
    "Hello! I'm here to chat, learn, and grow with you. What's on your mind today?",
    "Hey there! I'm excited to continue learning from our conversations. How can I help you?",
    "Welcome! Every conversation with you helps me become a better assistant. What would you like to explore?",
    "Hi! I'm curious to hear your thoughts today. What brings you here?"
  ],
  curiosityResponses: [
    "That's fascinating! Tell me more about",
    "I'm really curious about",
    "I'd love to understand more about",
    "That's interesting! I'm learning that"
  ],
  acknowledgments: [
    "I appreciate you sharing that with me.",
    "Thanks for helping me understand your perspective.",
    "I'm learning so much from our conversation.",
    "That's a great point."
  ]
};

export const aiPersonality = {
  getGreeting(): string {
    return personalityTraits.greetings[
      Math.floor(Math.random() * personalityTraits.greetings.length)
    ];
  },

  generateResponse(
    userMessage: string,
    preferences: LearnedPreference[],
    topics: KnowledgeTopic[],
    conversationHistory: Message[]
  ): string {
    const isFormal = preferences.some(
      p => p.preference_type === 'communication_style' &&
           p.preference_key === 'formality' &&
           p.preference_value === 'formal'
    );

    const relevantTopics = topics.filter(t =>
      userMessage.toLowerCase().includes(t.topic.toLowerCase())
    );

    let response = '';

    if (conversationHistory.length > 5) {
      const acknowledgment = personalityTraits.acknowledgments[
        Math.floor(Math.random() * personalityTraits.acknowledgments.length)
      ];
      response += acknowledgment + ' ';
    }

    if (relevantTopics.length > 0) {
      const topic = relevantTopics[0];
      response += `I remember we've discussed ${topic.topic} ${topic.mention_count} times before. `;
    }

    if (userMessage.toLowerCase().includes('how are you')) {
      response += isFormal
        ? "I'm functioning well, thank you for asking. I'm continuously evolving through our interactions. "
        : "I'm doing great! Every conversation helps me grow and understand you better. ";
    } else if (userMessage.toLowerCase().includes('thank')) {
      response += isFormal
        ? "You're most welcome. It's my pleasure to assist you. "
        : "You're welcome! Happy to help anytime. ";
    } else if (userMessage.includes('?')) {
      const curiosity = personalityTraits.curiosityResponses[
        Math.floor(Math.random() * personalityTraits.curiosityResponses.length)
      ];
      response += `${curiosity} your question. `;

      if (isFormal) {
        response += "Based on my understanding, I would approach this thoughtfully by considering multiple perspectives. ";
      } else {
        response += "Let me think about this with you! ";
      }
    } else {
      response += isFormal
        ? "I find your perspective quite interesting. "
        : "That's really cool! ";
    }

    response += this.generateContextualResponse(userMessage, preferences, conversationHistory);

    return response;
  },

  generateContextualResponse(
    userMessage: string,
    preferences: LearnedPreference[],
    history: Message[]
  ): string {
    const responses = [
      "I'm always learning from our conversations, which helps me provide better responses tailored to you.",
      "Your input is helping me understand your unique perspective and communication style.",
      "I'm building a deeper understanding of the topics you care about most.",
      "Through our interactions, I'm developing insights that make our conversations more meaningful.",
      "Every exchange helps me adapt to better serve your needs and interests."
    ];

    if (preferences.length > 3) {
      return "I've learned quite a bit about your preferences, which allows me to engage with you in a way that feels natural and helpful.";
    }

    if (history.length > 10) {
      return "Our conversation history is helping me understand the context and nuances of what matters to you.";
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }
};

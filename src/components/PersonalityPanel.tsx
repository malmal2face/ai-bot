import { useState, useEffect } from 'react';
import { Brain, MessageCircle, TrendingUp, Bookmark, X } from 'lucide-react';
import { learningService } from '../services/learningService';
import { LearnedPreference, KnowledgeTopic, PersonalityEvolution } from '../lib/supabase';

interface PersonalityPanelProps {
  userId: string;
}

const PersonalityPanel = ({ userId }: PersonalityPanelProps) => {
  const [preferences, setPreferences] = useState<LearnedPreference[]>([]);
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [traits, setTraits] = useState<PersonalityEvolution[]>([]);
  const [activeTab, setActiveTab] = useState<'preferences' | 'topics' | 'evolution'>('preferences');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const [prefs, tops, trs] = await Promise.all([
      learningService.getPreferences(userId),
      learningService.getTopics(userId),
      learningService.getPersonalityTraits(userId)
    ]);

    setPreferences(prefs);
    setTopics(tops);
    setTraits(trs);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Evolution</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'preferences'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bookmark className="w-4 h-4 mx-auto mb-1" />
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'topics'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="w-4 h-4 mx-auto mb-1" />
            Topics
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'evolution'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 mx-auto mb-1" />
            Growth
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'preferences' && (
          <>
            {preferences.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Keep chatting!</p>
                <p className="text-xs mt-1">I'm learning your preferences</p>
              </div>
            ) : (
              preferences.map((pref) => (
                <div key={pref.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {pref.preference_key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{pref.preference_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(pref.confidence_score)}`}>
                      {Math.round(pref.confidence_score * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{pref.preference_value}</p>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'topics' && (
          <>
            {topics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No topics yet</p>
                <p className="text-xs mt-1">Start a conversation about your interests</p>
              </div>
            ) : (
              topics.map((topic) => (
                <div key={topic.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 capitalize">{topic.topic}</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {topic.mention_count}x
                    </span>
                  </div>
                  {topic.related_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {topic.related_keywords.slice(0, 4).map((keyword, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white text-gray-600 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Last: {new Date(topic.last_mentioned).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'evolution' && (
          <>
            {traits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Evolution in progress</p>
                <p className="text-xs mt-1">My personality adapts as we interact more</p>
              </div>
            ) : (
              traits.map((trait) => (
                <div key={trait.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {trait.trait_name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{trait.trait_value}</p>
                  </div>
                  {Array.isArray(trait.evolution_history) && trait.evolution_history.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Recent change:</p>
                      <p className="text-xs text-gray-500">
                        {trait.evolution_history[trait.evolution_history.length - 1]?.reason}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PersonalityPanel;

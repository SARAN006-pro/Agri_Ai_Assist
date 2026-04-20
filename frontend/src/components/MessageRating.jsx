import { useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Star, MessageSquare } from 'lucide-react';
import { useUserMemory } from '../contexts/UserMemoryContext';

/**
 * MessageRating - Thumbs up/down + optional correction form
 * Appears below each assistant message.
 */
export function MessageRating({ sessionId, messageIndex, content, onRated }) {
  const { submitFeedback } = useUserMemory();
  const [rating, setRating] = useState(null); // 'helpful' | 'not_helpful' | null
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (type) => {
    if (submitted) return;
    setRating(type);
    setSubmitted(true);

    await submitFeedback({
      session_id: sessionId,
      message_index: messageIndex,
      rating: type === 'helpful' ? 5 : 1,
      helpful: type === 'helpful',
      not_helpful: type === 'not_helpful',
      topic: null,
    });

    if (onRated) onRated(type);
  };

  const handleCorrectionSubmit = async () => {
    if (!correction.trim()) return;
    await submitFeedback({
      session_id: sessionId,
      message_index: messageIndex,
      rating: 1,
      helpful: false,
      not_helpful: true,
      correction,
      preferred_response: correction,
      topic: null,
    });
    setShowCorrection(false);
    setSubmitted(true);
  };

  if (submitted && !showCorrection) {
    return (
      <div className="flex items-center gap-1.5 mt-1.5 opacity-70">
        <span className="text-xs text-slate-400">
          {rating === 'helpful' ? 'Thanks for the feedback!' : 'Thanks — we\'ll improve'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
      <span className="text-xs text-slate-400 mr-1">Helpful?</span>
      <button
        onClick={() => handleRate('helpful')}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${rating === 'helpful' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20'}`}
        title="Helpful"
      >
        <ThumbsUp size={11} strokeWidth={2} />
        Yes
      </button>
      <button
        onClick={() => setShowCorrection(!showCorrection)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${rating === 'not_helpful' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'}`}
        title="Not helpful / Correct this"
      >
        <ThumbsDown size={11} strokeWidth={2} />
        No
      </button>
      {showCorrection && (
        <div className="w-full mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">What should the correct answer have been?</p>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Type the better response..."
            rows={2}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCorrectionSubmit}
              disabled={!correction.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg disabled:opacity-40"
            >
              Submit correction
            </button>
            <button
              onClick={() => setShowCorrection(false)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * StarRating - 1-5 star rating for quick satisfaction scoring
 */
export function StarRating({ sessionId, messageIndex, onRate }) {
  const { submitFeedback } = useUserMemory();
  const [hovered, setHovered] = useState(0);
  const [rated, setRated] = useState(0);

  const handleRate = async (stars) => {
    if (rated) return;
    setRated(stars);
    await submitFeedback({
      session_id: sessionId,
      message_index: messageIndex,
      rating: stars,
      helpful: stars >= 3,
      not_helpful: stars < 3,
    });
    if (onRate) onRate(stars);
  };

  if (rated) {
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400">
        Rated {rated}/5
      </span>
    );
  }

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHovered(star)}
          onClick={() => handleRate(star)}
          className="p-0.5 transition-colors"
        >
          <Star
            size={13}
            strokeWidth={1.5}
            className={`transition-colors ${star <= (hovered || rated) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * LearningIndicator - Shows the user's learning impact in settings or dashboard
 */
export function LearningIndicator({ stats }) {
  if (!stats) return null;

  const impactColors = {
    'Initializing profile': 'text-slate-400',
    'Building preference model': 'text-blue-500',
    'Improving with positive feedback': 'text-emerald-500',
    'Learning actively': 'text-emerald-600 dark:text-emerald-400',
  };

  const color = impactColors[stats.learning_impact] || 'text-slate-400';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${stats.learning_impact === 'Learning actively' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      <span className={`text-xs font-medium ${color}`}>{stats.learning_impact}</span>
    </div>
  );
}

/**
 * LearningStatsPanel - Detailed learning stats for settings page
 */
export function LearningStatsPanel({ deviceId }) {
  const { stats, profile } = useUserMemory();

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.total_interactions}</div>
          <div className="text-xs text-emerald-600/70">Total interactions</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.positive_ratings}</div>
          <div className="text-xs text-blue-600/70">Positive ratings</div>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.preferences_learned}</div>
          <div className="text-xs text-purple-600/70">Preferences learned</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.contexts_stored}</div>
          <div className="text-xs text-amber-600/70">Contexts stored</div>
        </div>
      </div>

      {stats.top_topics?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top Topics</h4>
          <div className="flex flex-wrap gap-2">
            {stats.top_topics.map(({ topic, count }) => (
              <span key={topic} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {topic} <span className="text-slate-400 ml-1">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <LearningIndicator stats={stats} />
    </div>
  );
}

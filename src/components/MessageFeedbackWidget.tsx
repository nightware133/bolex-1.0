import React, { useState, useEffect } from 'react';
import { Star, Check, MessageSquare, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { FeedbackCategory, MessageFeedback } from '../types';
import { getMessageFeedback, saveMessageFeedback, FEEDBACK_UPDATED_EVENT } from '../lib/feedbackManager';

interface MessageFeedbackWidgetProps {
  messageId: string;
  sessionId: string;
  sessionTitle: string;
  model: string;
  userPromptSnippet?: string;
  assistantResponseSnippet?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Partially Helpful',
  3: 'Acceptable',
  4: 'Very Good',
  5: 'Outstanding & Accurate',
};

const CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'code_quality', label: 'Code Quality' },
  { id: 'formatting', label: 'Formatting' },
  { id: 'speed', label: 'Speed' },
  { id: 'completeness', label: 'Completeness' },
  { id: 'general', label: 'General' },
];

export const MessageFeedbackWidget: React.FC<MessageFeedbackWidgetProps> = ({
  messageId,
  sessionId,
  sessionTitle,
  model,
  userPromptSnippet,
  assistantResponseSnippet,
}) => {
  const [feedback, setFeedback] = useState<MessageFeedback | null>(() => getMessageFeedback(messageId));
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(feedback?.rating || 0);
  const [comment, setComment] = useState<string>(feedback?.comment || '');
  const [category, setCategory] = useState<FeedbackCategory>(feedback?.category || 'general');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  // Sync when feedback changes externally
  useEffect(() => {
    const handleUpdate = () => {
      const current = getMessageFeedback(messageId);
      setFeedback(current);
      if (current) {
        setSelectedRating(current.rating);
        setComment(current.comment || '');
        setCategory(current.category || 'general');
      }
    };

    window.addEventListener(FEEDBACK_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(FEEDBACK_UPDATED_EVENT, handleUpdate);
  }, [messageId]);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    setIsDrawerOpen(true);
    // Instant initial save of star rating
    const saved = saveMessageFeedback({
      messageId,
      sessionId,
      sessionTitle,
      model,
      rating,
      comment: comment.trim() || undefined,
      category,
      userPromptSnippet,
      assistantResponseSnippet,
    });
    setFeedback(saved);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  const handleSaveDetailedFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) return;

    const saved = saveMessageFeedback({
      messageId,
      sessionId,
      sessionTitle,
      model,
      rating: selectedRating,
      comment: comment.trim() || undefined,
      category,
      userPromptSnippet,
      assistantResponseSnippet,
    });
    setFeedback(saved);
    setIsDrawerOpen(false);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const activeRating = hoverRating || selectedRating;

  return (
    <div className="mt-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/60 text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
            Rate response:
          </span>
          <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rate response helpfulness">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  title={`${star} Star${star > 1 ? 's' : ''} - ${RATING_LABELS[star]}`}
                  className="p-1 rounded-md text-neutral-400 hover:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-3.5 h-3.5 transition-all ${
                      isFilled
                        ? 'text-amber-500 fill-amber-400 scale-105'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {activeRating > 0 && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400/90 ml-1">
              {RATING_LABELS[activeRating]}
            </span>
          )}
        </div>

        {/* Feedback status & expand trigger */}
        <div className="flex items-center gap-2">
          {isSavedRecently && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-3 h-3" /> Feedback Saved
            </span>
          )}

          {feedback && !isDrawerOpen && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-200 dark:hover:text-neutral-300 transition-colors cursor-pointer"
            >
              <Edit3 className="w-2.5 h-2.5" />
              <span>{feedback.comment ? 'Edit Note' : 'Add Note'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Comment & Category Drawer */}
      {isDrawerOpen && (
        <form
          onSubmit={handleSaveDetailedFeedback}
          className="mt-2.5 p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-amber-500" />
              Provide Details for Model Improvement
            </span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="text-[10px] text-neutral-400 hover:text-neutral-200 cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Quick Category Segmented Buttons */}
          <div>
            <label className="text-[10px] text-neutral-400 dark:text-neutral-500 block mb-1">
              Primary Aspect:
            </label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                    category === cat.id
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
                      : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Written Feedback Textarea */}
          <div>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What made this response helpful, or how could Bolex AI improve? (Optional)"
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-2.5 py-1 rounded-md text-[11px] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
            >
              Save Feedback
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

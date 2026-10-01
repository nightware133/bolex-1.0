import React, { useState } from 'react';
import { 
  Radio, 
  X, 
  Sparkles, 
  Trophy, 
  Crown, 
  AlertCircle, 
  ArrowRight,
  Megaphone
} from 'lucide-react';
import { SystemAnnouncement } from '../lib/founder';

interface GlobalAnnouncementBannerProps {
  announcement: SystemAnnouncement;
  onActionClick?: (actionType?: string) => void;
  onOpenFounder?: () => void;
  isFounder?: boolean;
}

export function GlobalAnnouncementBanner({
  announcement,
  onActionClick,
  onOpenFounder,
  isFounder = false
}: GlobalAnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!announcement.isActive || isDismissed) return null;

  const styleConfig = {
    giveaway: {
      bg: 'bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-950/80 border-emerald-500/30 text-emerald-200',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold',
    },
    founder: {
      bg: 'bg-gradient-to-r from-amber-950/80 via-neutral-900 to-amber-950/80 border-amber-500/40 text-amber-200',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      btnBg: 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold',
    },
    update: {
      bg: 'bg-gradient-to-r from-blue-950/80 via-neutral-900 to-blue-950/80 border-blue-500/30 text-blue-200',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
      btnBg: 'bg-blue-500 hover:bg-blue-400 text-neutral-950 font-bold',
    },
    alert: {
      bg: 'bg-gradient-to-r from-rose-950/80 via-neutral-900 to-rose-950/80 border-rose-500/30 text-rose-200',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
      btnBg: 'bg-rose-500 hover:bg-rose-400 text-white font-bold',
    },
  }[announcement.type] || {
    bg: 'bg-neutral-900 border-neutral-800 text-neutral-200',
    badgeBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    icon: <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
    btnBg: 'bg-amber-500 text-neutral-950 font-bold',
  };

  return (
    <div className={`w-full py-2 px-3 sm:px-4 border-b flex items-center justify-between gap-2 sm:gap-4 text-xs transition-all z-20 ${styleConfig.bg}`}>
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 shrink-0 ${styleConfig.badgeBg}`}>
          {styleConfig.icon}
          <span>{announcement.type}</span>
        </span>

        <div className="truncate">
          <strong className="text-white font-semibold mr-1.5">{announcement.title}:</strong>
          <span className="text-neutral-300">{announcement.message}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {announcement.linkText && (
          <button
            type="button"
            onClick={() => onActionClick && onActionClick(announcement.actionType)}
            className={`px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1 shadow-xs cursor-pointer ${styleConfig.btnBg}`}
          >
            <span>{announcement.linkText}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {isFounder && onOpenFounder && (
          <button
            type="button"
            onClick={onOpenFounder}
            className="hidden md:inline-flex px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-[11px] text-amber-300 font-medium transition-colors"
          >
            Edit Broadcast
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

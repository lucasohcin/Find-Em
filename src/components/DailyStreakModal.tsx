import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Sparkles, X, Clock, Award, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { getTimeUntilNextDayMidnight, getTodayDateString } from '../utils/streak';
import { sounds } from '../utils/audio';

interface DailyStreakModalProps {
  user: UserProfile;
  onClaimDailyBonus?: () => void;
  onClose: () => void;
}

const MILESTONES = [
  { day: 1, reward: '+50 XP', desc: 'First Step', icon: '🌱' },
  { day: 2, reward: '+100 XP', desc: 'Consistency', icon: '⚡' },
  { day: 3, reward: '+175 XP', desc: 'Scout Rank', icon: '🎯' },
  { day: 4, reward: '+225 XP', desc: 'Campus Legend', icon: '🔥' },
  { day: 5, reward: '+325 XP', desc: 'Cyber Aura', icon: '💎' },
  { day: 6, reward: '+400 XP', desc: 'Unstoppable', icon: '🚀' },
  { day: 7, reward: '+725 XP', desc: 'Grand Master', icon: '👑' },
];

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  user,
  onClaimDailyBonus,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextDayMidnight());
  const today = getTodayDateString();
  const isClaimedToday = user.lastActiveDate === today && user.streakBonusClaimedToday;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilNextDayMidnight());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleClaim = () => {
    if (onClaimDailyBonus) {
      onClaimDailyBonus();
      sounds.playUnlockFanfare('mythic');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#ec4899', '#38bdf8'],
      });
    }
  };

  const streakDays = user.currentStreak || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Radiant Flame Glow background */}
      <div className="absolute w-80 h-80 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none animate-pulse-glow" />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-orange-950/40 via-slate-900 to-slate-900 border-b border-slate-800 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Big Flame Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3 animate-bounce">
            <Flame className="w-12 h-12 text-white fill-amber-200" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DAILY STREAK BONUS TRACKER</span>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight">
            {streakDays} Day Streak!
          </h2>
          <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1">
            Log in or scan physical Rapid Run items each day to multiply your bonus XP and climb the school rankings.
          </p>
        </div>

        {/* 7-Day Milestone Chain */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-slate-300">7-Day Consistency Path</span>
              <span className="text-[11px] font-mono text-orange-400">
                Longest: {user.longestStreak || streakDays} Days
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {MILESTONES.map((m) => {
                const isPassed = streakDays >= m.day;
                const isCurrent = streakDays === m.day;

                return (
                  <div
                    key={m.day}
                    className={`rounded-xl p-2 text-center flex flex-col items-center justify-between border transition ${
                      isCurrent
                        ? 'bg-gradient-to-b from-orange-500/30 to-rose-500/30 border-orange-500 shadow-md shadow-orange-500/20'
                        : isPassed
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase mb-1">
                      D{m.day}
                    </div>
                    <div className="text-base my-0.5">
                      {isPassed && !isCurrent ? '✓' : m.icon}
                    </div>
                    <div className="text-[9px] font-mono font-bold leading-tight mt-1 truncate max-w-full">
                      {m.reward}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Streak XP Earned</div>
                <div className="text-sm font-black text-amber-400 font-mono">
                  +{user.streakXP || (streakDays * 50)} XP
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Next Daily Reset</div>
                <div className="text-sm font-black text-sky-400 font-mono">
                  {timeLeft.hours}h {timeLeft.minutes}m
                </div>
              </div>
            </div>
          </div>

          {/* Consistency Rules Note */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How Rapid Run Streaks Work:</span>
            </div>
            <p>
              • <strong>Check in daily:</strong> Log in to the website or scan any real-world QR item on campus once every 24 hours.
            </p>
            <p>
              • <strong>Multiplier Bonuses:</strong> Higher streaks award more XP per scan and unlock special titles and badges.
            </p>
            <p>
              • <strong>Midnight Reset:</strong> Don't let your streak break, or you'll have to start from Day 1 again!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          {!isClaimedToday ? (
            <button
              onClick={handleClaim}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Claim Day {streakDays} Streak Bonus (+{50 + (streakDays * 25)} XP)</span>
            </button>
          ) : (
            <div className="flex-1 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>Today's Streak Bonus Claimed! Return in {timeLeft.hours}h {timeLeft.minutes}m</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

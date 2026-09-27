import React, { useState } from 'react';
import { Trophy, Award, Sparkles, Box, Shield, ExternalLink, Flame, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { UserProfile, HuntItem } from '../types';
import { Item3DViewer } from './Item3DViewer';
import { getTodayDateString } from '../utils/streak';

interface ProfileInventoryLeaderboardProps {
  user: UserProfile;
  leaderboardUsers: UserProfile[];
  items: HuntItem[];
  onInspectItem: (item: HuntItem) => void;
  onOpenStreakModal?: () => void;
}

const ALL_ACHIEVEMENTS = [
  { id: 'first_find', title: 'First Discovery', desc: 'Scan and claim your very first real-world item.', icon: '🎯' },
  { id: 'mythic_hunter', title: 'Mascot Hunter', desc: 'Unlock The Little Guy at Rapid Run.', icon: '👑' },
  { id: 'master_trader', title: 'Campus Barter King', desc: 'Post or complete an item trade.', icon: '🤝' },
  { id: 'streak_3', title: 'Consistent Hunter', desc: 'Maintain a 3-day Rapid Run streak.', icon: '⚡' },
  { id: 'streak_7', title: 'Weekly Legend', desc: 'Achieve a 7-day daily activity streak.', icon: '🔥' },
  { id: 'five_items', title: 'Rapid Collector', desc: 'Own at least 3 distinct 3D items.', icon: '🏆' },
  { id: 'gps_scout', title: 'True Navigator', desc: 'Verify proximity within 15 meters.', icon: '🧭' },
];

export const ProfileInventoryLeaderboard: React.FC<ProfileInventoryLeaderboardProps> = ({
  user,
  leaderboardUsers,
  items,
  onInspectItem,
  onOpenStreakModal,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'leaderboard' | 'achievements'>('inventory');

  const ownedItems = items.filter((item) => user.inventory.includes(item.id));
  const today = getTodayDateString();
  const isStreakClaimedToday = user.lastActiveDate === today && user.streakBonusClaimedToday;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Top Banner / User Status Card */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-sky-500/20">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-[10px] font-black text-slate-950 uppercase">
              LVL {user.level}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
              {user.role === 'admin' && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                  Staff / Admin
                </span>
              )}
            </div>
            <div className="text-xs text-sky-400 font-semibold">{user.title || 'Novice Treasure Hunter'}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{user.email}</div>
          </div>
        </div>

        {/* Stats Pill Counters including Daily Streak */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Daily Streak Highlight Card */}
          <button
            onClick={onOpenStreakModal}
            className="group px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/40 hover:border-orange-400 text-left transition flex items-center gap-3 active:scale-95 shadow-lg shadow-orange-500/10"
          >
            <div className="p-2 rounded-xl bg-orange-500/30 text-orange-400 group-hover:scale-110 transition">
              <Flame className="w-5 h-5 fill-orange-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-300 flex items-center gap-1">
                <span>Daily Streak</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isStreakClaimedToday ? 'bg-emerald-400' : 'bg-orange-400 animate-ping'}`} />
              </div>
              <div className="text-base font-black text-white font-mono flex items-center gap-1">
                <span>{user.currentStreak || 1} Days</span>
                <ChevronRight className="w-3.5 h-3.5 text-orange-400 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </button>

          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Score</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {user.score} XP
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Items</div>
            <div className="text-base font-black text-sky-400 font-mono">
              {ownedItems.length} / {items.length}
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Badges</div>
            <div className="text-base font-black text-purple-400 font-mono">
              {user.achievements?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'inventory'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>My 3D Inventory ({ownedItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'leaderboard'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Rapid Run Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'achievements'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Achievements</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6">
        {activeTab === 'inventory' ? (
          <div>
            {ownedItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Your inventory is empty! Scan a QR code around Rapid Run or use the simulator to claim your first 3D item.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onInspectItem(item)}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition flex flex-col items-center group relative overflow-hidden shadow-md"
                  >
                    <div className="w-full h-36 relative">
                      <Item3DViewer
                        modelType={item.modelType}
                        modelColor={item.modelColor}
                        glowColor={item.glowColor}
                        height={140}
                        showPedestal={false}
                        interactive={false}
                      />
                    </div>

                    <div className="w-full pt-2 border-t border-slate-800/80 text-center">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-bold">
                          {item.rarity}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 font-mono">
                          +{item.points} XP
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition truncate">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.locationName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'leaderboard' ? (
          /* Leaderboard Tab */
          <div className="space-y-2">
            {leaderboardUsers.map((player, index) => {
              const isCurrent = player.id === user.id;

              return (
                <div
                  key={player.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    isCurrent
                      ? 'bg-sky-500/10 border-sky-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      index === 0 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' :
                      index === 1 ? 'bg-slate-300 text-slate-950' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{index + 1}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{player.displayName}</span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                            You
                          </span>
                        )}
                        {/* Streak Badge on Leaderboard */}
                        {player.currentStreak && player.currentStreak > 1 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.2 rounded-md">
                            <Flame className="w-2.5 h-2.5 fill-orange-400" />
                            <span>{player.currentStreak}d</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Level {player.level} • {player.inventory?.length || 0} Items
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400 font-mono">
                      {player.score} XP
                    </div>
                    <div className="text-[10px] text-slate-400">{player.title || 'Hunter'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Achievements Tab */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_ACHIEVEMENTS.map((ach) => {
              const isUnlocked = user.achievements?.includes(ach.id) || 
                (ach.id === 'first_find' && user.inventory?.length > 0) ||
                (ach.id === 'mythic_hunter' && user.inventory?.includes('rapid-guy-01')) ||
                (ach.id === 'five_items' && user.inventory?.length >= 3) ||
                (ach.id === 'streak_3' && (user.currentStreak >= 3 || user.longestStreak >= 3)) ||
                (ach.id === 'streak_7' && (user.currentStreak >= 7 || user.longestStreak >= 7));

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
                    isUnlocked
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {ach.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{ach.title}</span>
                      {isUnlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ach.desc}</p>
                    <div className="text-[10px] font-semibold text-purple-400 mt-1 uppercase">
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

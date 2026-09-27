import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, MapPin, X, Share2, Compass, ShieldCheck } from 'lucide-react';
import { HuntItem } from '../types';
import { Item3DViewer } from './Item3DViewer';
import { sounds } from '../utils/audio';

interface UnboxClaimModalProps {
  item: HuntItem | null;
  distanceMeters?: number;
  onClose: () => void;
  onShareToFeed?: () => void;
}

const RARITY_GRADIENTS: Record<string, string> = {
  common: 'from-slate-600 to-slate-900 border-slate-500 text-slate-300',
  rare: 'from-sky-600 to-blue-950 border-sky-400 text-sky-300',
  epic: 'from-purple-600 to-purple-950 border-purple-400 text-purple-300',
  legendary: 'from-amber-500 to-amber-950 border-amber-400 text-amber-300',
  mythic: 'from-rose-500 via-purple-600 to-indigo-950 border-rose-400 text-rose-300 shadow-rose-500/30',
};

export const UnboxClaimModal: React.FC<UnboxClaimModalProps> = ({
  item,
  distanceMeters = 8,
  onClose,
  onShareToFeed,
}) => {
  useEffect(() => {
    if (!item) return;

    // Trigger celebration fanfare and confetti
    sounds.playUnlockFanfare(item.rarity);

    // Fire fireworks confetti
    const count = item.rarity === 'mythic' ? 120 : 60;
    confetti({
      particleCount: count,
      spread: 90,
      origin: { y: 0.6 },
      colors: item.rarity === 'mythic' 
        ? ['#f43f5e', '#a855f7', '#38bdf8', '#fbbf24'] 
        : ['#38bdf8', '#818cf8', '#34d399'],
    });
  }, [item]);

  if (!item) return null;

  const rarityStyle = RARITY_GRADIENTS[item.rarity] || RARITY_GRADIENTS.common;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Background glow radiating */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-[120px] opacity-40 pointer-events-none animate-pulse-glow"
        style={{ backgroundColor: item.glowColor || '#38bdf8' }}
      />

      <div className="relative w-full max-w-lg bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ribbon */}
        <div className={`py-3 px-6 text-center text-xs font-bold uppercase tracking-widest border-b bg-gradient-to-r ${rarityStyle}`}>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>REAL-WORLD DISCOVERY UNLOCKED</span>
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
        </div>

        {/* 3D Showcase */}
        <div className="relative p-2 flex flex-col items-center">
          <div className="w-full h-72">
            <Item3DViewer
              modelType={item.modelType}
              modelColor={item.modelColor}
              glowColor={item.glowColor}
              height={280}
              showPedestal={true}
            />
          </div>

          {/* Details */}
          <div className="w-full px-6 pb-6 text-center">
            <div className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
              {item.rarity} {item.category}
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              {item.name}
            </h2>

            <p className="text-slate-300 text-sm mb-4 leading-relaxed line-clamp-3">
              {item.description}
            </p>

            {/* Lore Box */}
            {item.lore && (
              <div className="mb-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 italic text-left">
                <span className="font-semibold text-slate-300 not-italic block mb-1">Meme Lore:</span>
                "{item.lore}"
              </div>
            )}

            {/* GPS Verification Badge */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left truncate">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">GPS Verified</div>
                  <div className="font-semibold text-emerald-400">{distanceMeters}m proximity</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-left truncate">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Score Reward</div>
                  <div className="font-semibold text-amber-400">+{item.points} Points</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Location: {item.locationName}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/25 transition active:scale-95"
              >
                Claim to Digital Inventory
              </button>
              {onShareToFeed && (
                <button
                  onClick={() => {
                    onShareToFeed();
                    onClose();
                  }}
                  className="py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Flex on Social Feed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Sparkles, MapPin, Trophy, Share2, ArrowRightLeft, ShieldCheck, QrCode } from 'lucide-react';
import { HuntItem } from '../types';
import { Item3DViewer } from './Item3DViewer';

interface ItemInspectModalProps {
  item: HuntItem;
  isOwned: boolean;
  onClose: () => void;
  onInitiateTrade?: (item: HuntItem) => void;
  onShowQRCard?: (item: HuntItem) => void;
}

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  item,
  isOwned,
  onClose,
  onInitiateTrade,
  onShowQRCard,
}) => {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Visualizer Column */}
        <div className="md:w-1/2 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 relative border-b md:border-b-0 md:border-r border-slate-800">
          <div className="w-full h-72 md:h-96">
            <Item3DViewer
              modelType={item.modelType}
              modelColor={item.modelColor}
              glowColor={item.glowColor}
              autoRotate={autoRotate}
              height="100%"
              showPedestal={true}
            />
          </div>

          {/* Viewer Controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="px-3 py-1 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-full text-[11px] text-slate-300 transition"
            >
              {autoRotate ? 'Pause Rotation' : 'Resume Spin'}
            </button>
            <span className="text-[11px] text-slate-400">Drag item to rotate</span>
          </div>
        </div>

        {/* Info & Action Column */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                item.rarity === 'mythic' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                item.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {item.rarity} {item.category}
              </span>
              {isOwned ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  In Your Inventory
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                  Uncollected
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">{item.description}</p>

            {/* Lore box */}
            {item.lore && (
              <div className="mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                <span className="font-semibold text-slate-200 block mb-1">Origin Lore:</span>
                "{item.lore}"
              </div>
            )}

            {/* Meta details */}
            <div className="space-y-2 text-xs text-slate-300 mb-6">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">Placed at: <strong>{item.locationName}</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Value: <strong>+{item.points} Leaderboard XP</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Secret Code: <strong className="font-mono text-emerald-300">{item.code}</strong></span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {isOwned && onInitiateTrade && (
              <button
                onClick={() => {
                  onInitiateTrade(item);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-purple-500/20"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Post Trade Offer on Social Feed</span>
              </button>
            )}

            {onShowQRCard && (
              <button
                onClick={() => {
                  onShowQRCard(item);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <QrCode className="w-4 h-4 text-sky-400" />
                <span>Generate Printable QR Card</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

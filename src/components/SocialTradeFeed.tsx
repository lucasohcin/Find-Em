import React, { useState } from 'react';
import { Heart, ArrowRightLeft, Plus, Sparkles, MessageSquare, Check, Clock, User, ShieldCheck } from 'lucide-react';
import { SocialFeedItem, TradeOffer, HuntItem, UserProfile } from '../types';
import { sounds } from '../utils/audio';

interface SocialTradeFeedProps {
  feedItems: SocialFeedItem[];
  tradeOffers: TradeOffer[];
  currentUser: UserProfile;
  inventoryItems: HuntItem[];
  onPostTrade: (offerItemId: string, offerItemName: string, lookingFor: string) => void;
  onAcceptTrade: (trade: TradeOffer) => void;
  onLikeFeedItem: (feedId: string) => void;
}

export const SocialTradeFeed: React.FC<SocialTradeFeedProps> = ({
  feedItems,
  tradeOffers,
  currentUser,
  inventoryItems,
  onPostTrade,
  onAcceptTrade,
  onLikeFeedItem,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'trades'>('feed');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [lookingForText, setLookingForText] = useState('');

  const handleCreateTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    const item = inventoryItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    onPostTrade(item.id, item.name, lookingForText.trim() || 'Open to any fair trade');
    setShowCreateModal(false);
    setSelectedItemId('');
    setLookingForText('');
    sounds.playClick();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'feed'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>School Activity Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'trades'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>Classmate Trade Market ({tradeOffers.filter(t => t.status === 'open').length})</span>
          </button>
        </div>

        {activeTab === 'trades' && (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={inventoryItems.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Trade Offer</span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        {activeTab === 'feed' ? (
          <div className="space-y-4">
            {feedItems.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No recent school discoveries yet. Be the first to scan an item at Rapid Run!
              </div>
            ) : (
              feedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                      {item.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.userName}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-sky-200 mt-0.5">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onLikeFeedItem(item.id);
                      sounds.playClick();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-rose-400 text-xs transition"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span className="font-mono text-[11px]">{item.likes || 0}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Trades Tab */
          <div className="space-y-4">
            {tradeOffers.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No open trade listings right now. Post your extra items to barter with friends!
              </div>
            ) : (
              tradeOffers.map((trade) => {
                const isOwnTrade = trade.fromUserId === currentUser.id;
                const isOpen = trade.status === 'open';

                return (
                  <div
                    key={trade.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isOpen
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400">
                          Offered by <strong className="text-slate-200">{trade.fromUserName}</strong>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {trade.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <span>Offering:</span>
                        <span className="text-sky-300">{trade.offerItemName}</span>
                      </div>

                      <div className="text-xs text-purple-300 mt-1 flex items-center gap-1">
                        <span>Looking for:</span>
                        <span className="font-medium text-slate-300 italic">"{trade.lookingFor}"</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOpen && !isOwnTrade && (
                        <button
                          onClick={() => onAcceptTrade(trade)}
                          className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-purple-500/20 active:scale-95"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Accept Trade</span>
                        </button>
                      )}
                      {isOwnTrade && (
                        <span className="text-[11px] text-slate-500 italic">Your Listing</span>
                      )}
                      {!isOpen && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>Completed by {trade.acceptedByUserName || 'Trader'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Post Trade Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Post Item to School Market</h3>
            <p className="text-xs text-slate-400 mb-4">Choose an item from your collection to put up for trade</p>

            <form onSubmit={handleCreateTrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Item to Offer</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Pick an item you own --</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.rarity.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">What would you like in return?</label>
                <input
                  type="text"
                  value={lookingForText}
                  onChange={(e) => setLookingForText(e.target.value)}
                  placeholder="e.g. The Little Guy, or another Legendary item"
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-500/25"
                >
                  Post Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

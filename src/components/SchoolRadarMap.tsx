import React, { useState } from 'react';
import { Navigation, Compass, MapPin, Target, Eye, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { HuntItem, Coordinates } from '../types';
import { calculateBearing, calculateDistanceMeters, formatDistance } from '../utils/geo';
import { RAPID_RUN_CENTER } from '../data/initialItems';

interface SchoolRadarMapProps {
  items: HuntItem[];
  userCoords: Coordinates | null;
  ownedItemIds: string[];
  gpsSimulated: boolean;
  onToggleSimulate: () => void;
  onSelectTargetItem: (item: HuntItem) => void;
  onSimulateNearItem: (item: HuntItem) => void;
}

export const SchoolRadarMap: React.FC<SchoolRadarMapProps> = ({
  items,
  userCoords,
  ownedItemIds,
  gpsSimulated,
  onToggleSimulate,
  onSelectTargetItem,
  onSimulateNearItem,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const playerPos = userCoords || { lat: RAPID_RUN_CENTER.lat, lng: RAPID_RUN_CENTER.lng };

  const distance = selectedItem
    ? calculateDistanceMeters(playerPos, { lat: selectedItem.lat, lng: selectedItem.lng })
    : 0;

  const bearing = selectedItem
    ? calculateBearing(playerPos, { lat: selectedItem.lat, lng: selectedItem.lng })
    : 0;

  const isWithinScanRange = distance <= (selectedItem?.radiusMeters || 40);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-400 animate-pulse" />
            <h2 className="text-base font-bold text-white">Rapid Run Proximity Radar</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
              GPS SATELLITE LOCK
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-world object locations around Rapid Run Middle School (6345 Rapid Run Rd)
          </p>
        </div>

        {/* GPS Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSimulate}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              gpsSimulated
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{gpsSimulated ? 'Simulating School Campus' : 'Live Device GPS Active'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Radar Map Visualizer Canvas */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
          {/* Radar Circles Grid */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-80 h-80 rounded-full border border-sky-400" />
            <div className="w-56 h-56 rounded-full border border-sky-400 absolute" />
            <div className="w-32 h-32 rounded-full border border-sky-400 absolute" />
            <div className="w-full h-[1px] bg-sky-400 absolute" />
            <div className="h-full w-[1px] bg-sky-400 absolute" />
          </div>

          {/* Compass Radar Sweep effect */}
          <div 
            className="absolute w-80 h-80 rounded-full pointer-events-none opacity-30 animate-spin"
            style={{ 
              animationDuration: '6s',
              background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.4) 0deg, transparent 60deg)' 
            }}
          />

          {/* School Center Label */}
          <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-500">
            <div>CAMPUS GRID: RAPID RUN (39.1135° N, 84.6648° W)</div>
            <div>STATUS: {isWithinScanRange ? 'IN RANGE FOR SCAN' : 'APPROACHING TARGET'}</div>
          </div>

          {/* Interactive Radar Objects */}
          <div className="relative w-72 h-72 rounded-full flex items-center justify-center">
            {/* Player Center Blip */}
            <div className="z-20 flex flex-col items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-lg shadow-emerald-400/50 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-300 mt-1 uppercase tracking-wider bg-slate-900/90 px-1.5 py-0.5 rounded border border-emerald-500/40">
                You
              </span>
            </div>

            {/* Item Target Blips positioned relative to center */}
            {items.map((item, idx) => {
              const isSelected = item.id === selectedItemId;
              const isOwned = ownedItemIds.includes(item.id);

              // Map lat/lng offset to radar visual coordinates
              const dLat = (item.lat - RAPID_RUN_CENTER.lat) * 20000;
              const dLng = (item.lng - RAPID_RUN_CENTER.lng) * 20000;

              // Constrain visually
              const topPos = Math.max(15, Math.min(85, 50 - dLat));
              const leftPos = Math.max(15, Math.min(85, 50 + dLng));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    onSelectTargetItem(item);
                  }}
                  style={{ top: `${topPos}%`, left: `${leftPos}%` }}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition group ${
                    isSelected ? 'ring-2 ring-sky-400 scale-125' : 'hover:scale-110'
                  }`}
                  title={`${item.name} (${item.locationName})`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md ${
                      isOwned
                        ? 'bg-slate-600'
                        : item.rarity === 'mythic'
                        ? 'bg-rose-500 animate-ping'
                        : item.rarity === 'legendary'
                        ? 'bg-amber-400'
                        : 'bg-sky-400'
                    }`}
                  />
                  <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-white z-30 shadow-xl">
                    {item.name} {isOwned ? '(Collected)' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Details & Navigation Compass */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {selectedItem && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Targeted Object
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  selectedItem.rarity === 'mythic' ? 'bg-rose-500/20 text-rose-300' :
                  selectedItem.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-sky-500/20 text-sky-300'
                }`}>
                  {selectedItem.rarity}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                <span>{selectedItem.name}</span>
                {ownedItemIds.includes(selectedItem.id) && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-3">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{selectedItem.locationName}</span>
              </div>

              {/* Proximity Meter */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 mb-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Proximity Distance:</span>
                  <span className={`font-mono font-bold ${isWithinScanRange ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatDistance(distance)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isWithinScanRange ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, 100 - (distance / 150) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Geofence: {selectedItem.radiusMeters}m</span>
                  <span>{isWithinScanRange ? 'READY TO SCAN' : 'WALK CLOSER'}</span>
                </div>
              </div>

              {/* Teleport / Walk simulator button for testing */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSimulateNearItem(selectedItem)}
                  className="flex-1 py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Simulate Walk to Item</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Item List to target */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Campus Hidden Relics ({items.length})
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {items.map((item) => {
                const isOwned = ownedItemIds.includes(item.id);
                const isSelected = item.id === selectedItemId;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition border ${
                      isSelected
                        ? 'bg-slate-800 border-sky-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isOwned ? 'bg-slate-500' : 'bg-sky-400'}`} />
                      <span className="font-semibold truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {isOwned ? 'Found' : `+${item.points} XP`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

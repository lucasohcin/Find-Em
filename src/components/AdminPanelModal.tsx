import React, { useState } from 'react';
import { X, Plus, QrCode, Trash2, Sparkles, MapPin, Eye, Link, Copy, Check, Shield } from 'lucide-react';
import { HuntItem, ModelType, ItemRarity } from '../types';
import { Item3DViewer } from './Item3DViewer';
import { RAPID_RUN_CENTER } from '../data/initialItems';

interface AdminPanelModalProps {
  items: HuntItem[];
  onAddItem: (item: HuntItem) => void;
  onDeleteItem: (id: string) => void;
  onShowQRCard: (item: HuntItem) => void;
  onClose: () => void;
}

const SCHOOL_PRESETS = [
  { name: 'Rapid Run - Main Courtyard Plaza', lat: 39.11352, lng: -84.66480 },
  { name: 'Rapid Run - East Cafeteria Benches', lat: 39.11385, lng: -84.66440 },
  { name: 'Rapid Run - Varsity Gymnasium & Track', lat: 39.11320, lng: -84.66510 },
  { name: 'Rapid Run - West Science Wing', lat: 39.11365, lng: -84.66550 },
  { name: 'Rapid Run - Library Media Hub', lat: 39.11310, lng: -84.66420 },
  { name: 'Rapid Run - Front Entrance Flagpole', lat: 39.11400, lng: -84.66490 },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  onShowQRCard,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lore, setLore] = useState('');
  const [rarity, setRarity] = useState<ItemRarity>('epic');
  const [category, setCategory] = useState('meme');
  const [modelType, setModelType] = useState<ModelType>('little_guy');
  const [modelColor, setModelColor] = useState('#38bdf8');
  const [glowColor, setGlowColor] = useState('#0284c7');
  const [locationName, setLocationName] = useState(SCHOOL_PRESETS[0].name);
  const [lat, setLat] = useState(SCHOOL_PRESETS[0].lat);
  const [lng, setLng] = useState(SCHOOL_PRESETS[0].lng);
  const [radiusMeters, setRadiusMeters] = useState(35);
  const [points, setPoints] = useState(250);
  const [code, setCode] = useState(() => `RR_${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof SCHOOL_PRESETS[0]) => {
    setLocationName(preset.name);
    setLat(preset.lat);
    setLng(preset.lng);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const newItem: HuntItem = {
      id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || 'A mysterious real-world item hidden around Rapid Run.',
      rarity,
      category,
      locationName,
      lat: Number(lat),
      lng: Number(lng),
      radiusMeters: Number(radiusMeters) || 35,
      modelType,
      modelColor,
      glowColor,
      points: Number(points) || 100,
      lore: lore.trim(),
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
    };

    onAddItem(newItem);
    setActiveTab('list');
  };

  const handleCopyLink = (item: HuntItem) => {
    const url = `${window.location.origin}${window.location.pathname}?claim=${item.id}&token=${item.code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Rapid Run Hunt Admin Command</h2>
              <p className="text-xs text-slate-400">Manage real-world 3D items, QR codes & GPS locations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'create'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create New 3D Item</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'list'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Placed Objects & QR Cards ({items.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'create' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. The Little Guy Mascot"
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">3D Model Style</label>
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value as ModelType)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="little_guy">The Little Guy (Character)</option>
                      <option value="golden_trophy">Golden Athletic Trophy</option>
                      <option value="meme_orb">Cyber Meme Orb</option>
                      <option value="school_pass">Hall Pass Relic</option>
                      <option value="potion_flask">Slushie Flask Elixir</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Rarity Tier</label>
                    <select
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value as ItemRarity)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="common">Common (Standard)</option>
                      <option value="rare">Rare (Blue)</option>
                      <option value="epic">Epic (Purple)</option>
                      <option value="legendary">Legendary (Gold)</option>
                      <option value="mythic">Mythic (Rainbow Glow)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Model Color</label>
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <input
                        type="color"
                        value={modelColor}
                        onChange={(e) => setModelColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-slate-300 uppercase">{modelColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Aura Glow Color</label>
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <input
                        type="color"
                        value={glowColor}
                        onChange={(e) => setGlowColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-slate-300 uppercase">{glowColor}</span>
                    </div>
                  </div>
                </div>

                {/* Location Preset Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rapid Run School Preset Location
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {SCHOOL_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 text-left rounded-lg text-[11px] border transition ${
                          locationName === preset.name
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset.name.replace('Rapid Run - ', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={lat}
                      onChange={(e) => setLat(Number(e.target.value))}
                      className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={lng}
                      onChange={(e) => setLng(Number(e.target.value))}
                      className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Radius (Meters)</label>
                    <input
                      type="number"
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(Number(e.target.value))}
                      className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Secret QR Code</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => setCode(`RR_${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold shrink-0"
                      >
                        Regen
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Points (XP)</label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Meme Lore / Description</label>
                  <textarea
                    rows={2}
                    value={lore}
                    onChange={(e) => setLore(e.target.value)}
                    placeholder="Backstory or hint for students searching the campus..."
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm transition shadow-lg shadow-sky-500/25 active:scale-98"
                >
                  Deploy 3D Object to Rapid Run
                </button>
              </form>

              {/* Live 3D Preview Column */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Real-Time 3D Preview</span>
                </span>

                <div className="w-full h-64">
                  <Item3DViewer
                    modelType={modelType}
                    modelColor={modelColor}
                    glowColor={glowColor}
                    height={250}
                    showPedestal={true}
                  />
                </div>

                <div className="w-full p-3 bg-slate-900 rounded-xl border border-slate-800 text-center mt-2">
                  <div className="text-xs font-bold text-white mb-0.5">{name || 'Your New 3D Item'}</div>
                  <div className="text-[11px] text-slate-400">{locationName}</div>
                </div>
              </div>
            </div>
          ) : (
            /* Items List Tab */
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Item3DViewer
                        modelType={item.modelType}
                        modelColor={item.modelColor}
                        glowColor={item.glowColor}
                        height={48}
                        showPedestal={false}
                        interactive={false}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {item.rarity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        <span>{item.locationName}</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        Code: {item.code} | +{item.points} XP
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyLink(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Copied!' : 'Copy Direct Link'}</span>
                    </button>

                    <button
                      onClick={() => onShowQRCard(item)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Print QR Tag</span>
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, ExternalLink, ShieldCheck, MapPin } from 'lucide-react';
import { HuntItem } from '../types';

interface QRCardModalProps {
  item: HuntItem;
  onClose: () => void;
}

export const QRCardModal: React.FC<QRCardModalProps> = ({ item, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const claimUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?claim=${item.id}&token=${item.code}`
    : `https://rapidrun.game?claim=${item.id}&token=${item.code}`;

  useEffect(() => {
    // Generate high resolution QR code data URL
    QRCode.toDataURL(claimUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [claimUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `rapid-run-${item.id}-qr.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="font-bold text-white text-base">Printable Real-World QR Tag</h2>
            <p className="text-xs text-slate-400">Place this sticker at Rapid Run for students to scan</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          <div 
            id="printable-qr-card" 
            className="w-full max-w-sm bg-white text-slate-900 rounded-2xl p-6 shadow-xl border-4 border-slate-800 flex flex-col items-center text-center select-none"
          >
            {/* Header Badge */}
            <div className="w-full pb-3 border-b-2 border-slate-200 mb-3 flex items-center justify-between">
              <span className="font-black text-xs tracking-wider uppercase text-sky-600">
                RAPID RUN REAL-WORLD OBJECT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-bold uppercase">
                {item.rarity}
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
              {item.name}
            </h3>
            <p className="text-xs text-slate-600 mb-4 px-2">
              Scan with your phone to add this 3D meme collectible to your digital inventory!
            </p>

            {/* QR Code Graphic */}
            <div className="relative p-2 bg-white rounded-xl border-2 border-slate-300 shadow-sm mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR for ${item.name}`}
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Verification Code Box */}
            <div className="w-full py-2 px-3 bg-slate-100 rounded-lg border border-slate-300 mb-3">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Secret Code</div>
              <div className="text-xs font-mono font-bold text-slate-900">{item.code}</div>
            </div>

            <div className="w-full text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" />
                <span>{item.locationName}</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-amber-600">
                <span>+{item.points} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex gap-2.5">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-sky-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};

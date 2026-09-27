import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, QrCode, AlertCircle, Sparkles, Navigation, CheckCircle2, ShieldAlert } from 'lucide-react';
import { HuntItem, Coordinates } from '../types';
import { calculateDistanceMeters, formatDistance, verifyGPSProximity } from '../utils/geo';
import { sounds } from '../utils/audio';

interface QRScannerModalProps {
  items: HuntItem[];
  userCoords: Coordinates | null;
  gpsSimulated: boolean;
  onClaimItem: (item: HuntItem, distanceMeters: number) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  items,
  userCoords,
  gpsSimulated,
  onClaimItem,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera for scanning
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (activeTab !== 'camera') return;
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera access unavailable or denied:', err);
        setCameraError('Camera access denied or unavailable in this browser. Please use the Manual Code or Quick Scan below.');
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [activeTab]);

  // Code verification logic
  const handleVerifyCode = (codeToVerify: string) => {
    setErrorMessage(null);
    const cleanedCode = codeToVerify.trim();
    if (!cleanedCode) {
      setErrorMessage('Please enter a secret item code or scan a QR code.');
      sounds.playErrorBuzz();
      return;
    }

    // Parse potential URL parameters if scanned code is full URL (e.g. ?claim=rapid-guy-01&token=RR_LITTLE_GUY_99)
    let targetCode = cleanedCode;
    let targetItemId: string | null = null;

    if (cleanedCode.includes('token=')) {
      try {
        const url = new URL(cleanedCode.startsWith('http') ? cleanedCode : `https://dummy.com/${cleanedCode}`);
        targetCode = url.searchParams.get('token') || cleanedCode;
        targetItemId = url.searchParams.get('claim') || null;
      } catch {
        // Not a URL, use raw string
      }
    }

    // Find item matching code or ID
    const foundItem = items.find(
      (item) =>
        item.code.toLowerCase() === targetCode.toLowerCase() ||
        (targetItemId && item.id.toLowerCase() === targetItemId.toLowerCase())
    );

    if (!foundItem) {
      setErrorMessage('Unrecognized QR Code! This code does not match any real-world Rapid Run item.');
      sounds.playErrorBuzz();
      return;
    }

    // GPS Proximity Verification
    if (userCoords) {
      const verification = verifyGPSProximity(userCoords, foundItem, {
        bypassForSimulation: gpsSimulated,
      });

      if (!verification.verified && !gpsSimulated) {
        setErrorMessage(
          verification.reason ||
            `GPS Proximity verification failed! You are ${formatDistance(
              verification.distanceMeters
            )} away. You must walk to ${foundItem.locationName} to collect this item.`
        );
        sounds.playErrorBuzz();
        return;
      }

      // Success!
      onClaimItem(foundItem, verification.distanceMeters);
      onClose();
    } else {
      // If user has not enabled GPS, allow collection with default distance or simulated flag
      onClaimItem(foundItem, 12);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-white text-base">Rapid QR Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 p-1">
          <button
            onClick={() => {
              setActiveTab('camera');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'camera'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'manual'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Enter Secret Code</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {activeTab === 'camera' ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    {cameraError || 'Requesting camera access...'}
                  </div>
                )}

                {/* Cyber Targeting Box Overlay */}
                <div className="absolute inset-8 border-2 border-sky-400/80 rounded-xl pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between p-1">
                    <div className="w-3 h-3 border-t-2 border-l-2 border-sky-400" />
                    <div className="w-3 h-3 border-t-2 border-r-2 border-sky-400" />
                  </div>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse" />
                  <div className="flex justify-between p-1">
                    <div className="w-3 h-3 border-b-2 border-l-2 border-sky-400" />
                    <div className="w-3 h-3 border-b-2 border-r-2 border-sky-400" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                Point your camera at the physical QR sticker taped to the real-world object.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Real-World Item Secret Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. RR_LITTLE_GUY_99"
                    className="w-full py-3 px-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyCode(manualCode);
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Printed in tiny lettering beneath the QR code on every physical Rapid Run object.
                </p>
              </div>

              <button
                onClick={() => handleVerifyCode(manualCode)}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition shadow-lg shadow-sky-500/20 active:scale-98"
              >
                Verify & Claim Item
              </button>
            </div>
          )}

          {/* Quick Real-World Item Simulators (for easy testing on school map or remotely) */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>School Item Test Scanners</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Click to simulate scan</span>
            </div>

            <div className="space-y-2">
              {items.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleVerifyCode(item.code)}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left transition group"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                      <span>{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase font-mono">
                        {item.rarity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.locationName}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-mono font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                    Scan Code
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer GPS Status */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>GPS: {gpsSimulated ? 'Rapid Run Simulated' : userCoords ? 'Active' : 'Awaiting GPS'}</span>
          </div>
          <span className="text-emerald-400 font-medium">Anti-Spoof Guard Active</span>
        </div>
      </div>
    </div>
  );
};

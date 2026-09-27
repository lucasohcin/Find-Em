/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  QrCode, 
  MapPin, 
  Compass, 
  Trophy, 
  Shield, 
  Sparkles, 
  ArrowRightLeft, 
  Box, 
  Volume2, 
  VolumeX, 
  LogOut, 
  LogIn, 
  Navigation, 
  CheckCircle,
  AlertCircle,
  Flame
} from 'lucide-react';

import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { HuntItem, UserProfile, SocialFeedItem, TradeOffer, Coordinates, ItemClaim } from './types';
import { INITIAL_ITEMS, RAPID_RUN_CENTER } from './data/initialItems';
import { calculateDistanceMeters, formatDistance } from './utils/geo';
import { sounds } from './utils/audio';
import { calculateDailyStreak, getTodayDateString } from './utils/streak';

import { Item3DViewer } from './components/Item3DViewer';
import { QRScannerModal } from './components/QRScannerModal';
import { UnboxClaimModal } from './components/UnboxClaimModal';
import { ItemInspectModal } from './components/ItemInspectModal';
import { QRCardModal } from './components/QRCardModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SocialTradeFeed } from './components/SocialTradeFeed';
import { SchoolRadarMap } from './components/SchoolRadarMap';
import { ProfileInventoryLeaderboard } from './components/ProfileInventoryLeaderboard';
import { DailyStreakModal } from './components/DailyStreakModal';

const LOCAL_STORAGE_KEY = 'rapid_hunt_profile_v2';
const DEFAULT_USER_ID = 'hunter_guest_' + Math.floor(Math.random() * 10000);

export default function App() {
  // Navigation & View
  const [activeTab, setActiveTab] = useState<'radar' | 'inventory' | 'trades'>('radar');

  // Items & Game State
  const [items, setItems] = useState<HuntItem[]>(INITIAL_ITEMS);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    // Attempt local storage load on boot
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        // ignore
      }
    }
    return {
      id: DEFAULT_USER_ID,
      displayName: 'Rapid Runner #42',
      email: 'runner@rapidrun.edu',
      role: 'player',
      score: 0,
      level: 1,
      itemsCount: 0,
      title: 'School Rookie',
      inventory: [],
      achievements: [],
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: getTodayDateString(),
      streakBonusClaimedToday: false,
      streakXP: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [feedItems, setFeedItems] = useState<SocialFeedItem[]>([]);
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [unboxingItem, setUnboxingItem] = useState<{ item: HuntItem; distance: number } | null>(null);
  const [inspectingItem, setInspectingItem] = useState<HuntItem | null>(null);
  const [qrCardItem, setQrCardItem] = useState<HuntItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  // GPS State
  const [userCoords, setUserCoords] = useState<Coordinates | null>({
    lat: RAPID_RUN_CENTER.lat,
    lng: RAPID_RUN_CENTER.lng,
    accuracy: 8,
  });
  const [gpsSimulated, setGpsSimulated] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 1. Boot connection test
  useEffect(() => {
    testConnection().catch((err) => console.warn('Test connection check:', err));
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (e) {
      // ignore
    }
  }, [userProfile]);

  // 2. Track Auth state and sync user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthLoading(false);

      if (user) {
        // Fetch or create user profile in Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          const isAdminUser = user.email === 'lucasoh13m@gmail.com';
          const today = getTodayDateString();

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            // Check streak calculation on login
            const streakRes = calculateDailyStreak(
              data.lastActiveDate,
              data.currentStreak || 1,
              data.longestStreak || 1,
              'login'
            );

            const syncedProfile: UserProfile = {
              ...data,
              currentStreak: streakRes.currentStreak,
              longestStreak: streakRes.longestStreak,
              lastActiveDate: streakRes.lastActiveDate,
              role: isAdminUser ? 'admin' : (data.role || 'player'),
            };

            setUserProfile(syncedProfile);

            if (streakRes.isNewDay) {
              setStatusMessage(`Daily login: Streak updated to ${streakRes.currentStreak} days!`);
              setTimeout(() => setStatusMessage(null), 3500);
            }
          } else {
            const newProfile: UserProfile = {
              id: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'Rapid Student',
              email: user.email || 'student@rapidrun.edu',
              photoURL: user.photoURL || undefined,
              role: isAdminUser ? 'admin' : 'player',
              score: userProfile.score > 0 ? userProfile.score : 0,
              level: userProfile.level > 1 ? userProfile.level : 1,
              itemsCount: userProfile.inventory.length,
              title: 'Freshman Hunter',
              inventory: userProfile.inventory || [],
              achievements: userProfile.achievements || [],
              currentStreak: 1,
              longestStreak: 1,
              lastActiveDate: today,
              streakBonusClaimedToday: false,
              streakXP: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('Could not sync user profile with firestore, using local profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Sync Items catalog from Firestore (or seed defaults)
  useEffect(() => {
    async function initCatalog() {
      try {
        const itemsSnap = await getDocs(collection(db, 'items'));
        if (itemsSnap.empty) {
          // If Firestore is empty, seed initial items
          for (const item of INITIAL_ITEMS) {
            await setDoc(doc(db, 'items', item.id), item).catch(() => {});
          }
          setItems(INITIAL_ITEMS);
        } else {
          const loaded = itemsSnap.docs.map((d) => d.data() as HuntItem);
          setItems(loaded.length > 0 ? loaded : INITIAL_ITEMS);
        }
      } catch (err) {
        console.warn('Using local catalog items:', err);
        setItems(INITIAL_ITEMS);
      }
    }

    initCatalog();

    // Listen to items changes safely
    const unsubItems = onSnapshot(
      collection(db, 'items'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as HuntItem);
          setItems(list);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'items');
        } catch (e) {
          console.warn('Items snapshot warning handled:', e);
        }
      }
    );

    // Listen to feed changes safely
    const unsubFeed = onSnapshot(
      query(collection(db, 'feed'), orderBy('createdAt', 'desc'), limit(25)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as SocialFeedItem);
        setFeedItems(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'feed');
        } catch (e) {
          console.warn('Feed snapshot warning handled:', e);
        }
      }
    );

    // Listen to trades changes safely
    const unsubTrades = onSnapshot(
      query(collection(db, 'trades'), orderBy('createdAt', 'desc'), limit(20)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as TradeOffer);
        setTradeOffers(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'trades');
        } catch (e) {
          console.warn('Trades snapshot warning handled:', e);
        }
      }
    );

    // Listen to users leaderboard safely
    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('score', 'desc'), limit(15)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as UserProfile);
        setLeaderboard(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'users');
        } catch (e) {
          console.warn('Users snapshot warning handled:', e);
        }
      }
    );

    return () => {
      unsubItems();
      unsubFeed();
      unsubTrades();
      unsubUsers();
    };
  }, []);

  // 4. Handle Direct Unlock Link on mount (e.g. ?claim=rapid-guy-01&token=RR_LITTLE_GUY_99)
  const initialLinkCheckedRef = useRef(false);
  useEffect(() => {
    if (initialLinkCheckedRef.current || items.length === 0) return;
    initialLinkCheckedRef.current = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const claimParam = params.get('claim');
      const tokenParam = params.get('token');

      if (claimParam) {
        const target = items.find(
          (i) =>
            i.id.toLowerCase() === claimParam.toLowerCase() ||
            (tokenParam && i.code.toLowerCase() === tokenParam.toLowerCase())
        );

        if (target) {
          setTimeout(() => {
            handleClaimItem(target, 5);
          }, 800);
        }
      }
    } catch (e) {
      console.error('Error parsing claim URL', e);
    }
  }, [items]);

  // 5. Watch Device Geolocation
  useEffect(() => {
    if (gpsSimulated) return;

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('GPS position error:', err.message);
          setGpsSimulated(true);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [gpsSimulated]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      sounds.playUnlockFanfare('rare');
    } catch (err) {
      console.warn('Google sign in popup prevented or cancelled:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  // Claim Item Handler with Daily Streak progression & Streak XP Bonus
  const handleClaimItem = async (item: HuntItem, distanceMeters: number) => {
    const isAlreadyOwned = userProfile.inventory.includes(item.id);

    // Calculate streak update from real-world scan
    const streakResult = calculateDailyStreak(
      userProfile.lastActiveDate,
      userProfile.currentStreak || 1,
      userProfile.longestStreak || 1,
      'scan'
    );

    const updatedInventory = isAlreadyOwned ? userProfile.inventory : [...userProfile.inventory, item.id];
    
    // Earn base item points + daily streak bonus if scan advanced streak today
    const earnedPoints = isAlreadyOwned ? 0 : item.points;
    const streakBonus = streakResult.isNewDay ? streakResult.bonusXP : 0;
    const totalNewScore = userProfile.score + earnedPoints + streakBonus;
    const newLevel = Math.max(1, Math.floor(totalNewScore / 300) + 1);

    const updatedAchievements = [...(userProfile.achievements || [])];
    if (!updatedAchievements.includes('first_find')) updatedAchievements.push('first_find');
    if (item.rarity === 'mythic' && !updatedAchievements.includes('mythic_hunter')) {
      updatedAchievements.push('mythic_hunter');
    }
    if (updatedInventory.length >= 3 && !updatedAchievements.includes('five_items')) {
      updatedAchievements.push('five_items');
    }
    if (streakResult.currentStreak >= 3 && !updatedAchievements.includes('streak_3')) {
      updatedAchievements.push('streak_3');
    }
    if (streakResult.currentStreak >= 7 && !updatedAchievements.includes('streak_7')) {
      updatedAchievements.push('streak_7');
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      inventory: updatedInventory,
      score: totalNewScore,
      level: newLevel,
      itemsCount: updatedInventory.length,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastActiveDate: streakResult.lastActiveDate,
      streakBonusClaimedToday: true,
      streakXP: (userProfile.streakXP || 0) + streakBonus,
      achievements: updatedAchievements,
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updatedProfile);

    if (streakResult.isNewDay) {
      setStatusMessage(streakResult.message);
      setTimeout(() => setStatusMessage(null), 4000);
    }

    // Persist claim record in Firestore
    try {
      const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const claimRecord: ItemClaim = {
        id: claimId,
        userId: userProfile.id,
        userDisplayName: userProfile.displayName,
        itemId: item.id,
        itemName: item.name,
        itemRarity: item.rarity,
        points: item.points,
        distanceMeters,
        verified: true,
        claimedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'claims', claimId), claimRecord).catch(() => {});

      // Create social feed entry
      const feedId = `feed_${Date.now()}`;
      const feedEntry: SocialFeedItem = {
        id: feedId,
        userId: userProfile.id,
        userName: userProfile.displayName,
        type: 'claim',
        title: `Found ${item.name}! (+${item.points} XP)`,
        content: `Discovered near ${item.locationName} (${distanceMeters}m GPS proximity). Daily Streak: ${streakResult.currentStreak} Days!`,
        itemId: item.id,
        itemName: item.name,
        itemRarity: item.rarity,
        likes: 1,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'feed', feedId), feedEntry).catch(() => {});

      // Update user doc if authenticated
      if (authUser) {
        await updateDoc(doc(db, 'users', authUser.uid), {
          inventory: updatedInventory,
          score: totalNewScore,
          level: newLevel,
          itemsCount: updatedInventory.length,
          currentStreak: streakResult.currentStreak,
          longestStreak: streakResult.longestStreak,
          lastActiveDate: streakResult.lastActiveDate,
          streakBonusClaimedToday: true,
          streakXP: (userProfile.streakXP || 0) + streakBonus,
          achievements: updatedAchievements,
          updatedAt: new Date().toISOString(),
        }).catch(console.warn);
      }
    } catch (err) {
      console.warn('Saved claim locally, Firestore sync status:', err);
    }

    // Open celebratory 3D unboxing experience
    setUnboxingItem({ item, distance: distanceMeters });
  };

  // Claim Daily Streak Bonus manually via Streak Modal
  const handleClaimDailyBonus = () => {
    const today = getTodayDateString();
    const streakResult = calculateDailyStreak(
      userProfile.lastActiveDate,
      userProfile.currentStreak || 1,
      userProfile.longestStreak || 1,
      'login'
    );

    const bonus = 50 + (streakResult.currentStreak * 25);
    const newScore = userProfile.score + bonus;
    const newLevel = Math.max(1, Math.floor(newScore / 300) + 1);

    const updatedAchievements = [...(userProfile.achievements || [])];
    if (streakResult.currentStreak >= 3 && !updatedAchievements.includes('streak_3')) {
      updatedAchievements.push('streak_3');
    }
    if (streakResult.currentStreak >= 7 && !updatedAchievements.includes('streak_7')) {
      updatedAchievements.push('streak_7');
    }

    const updated: UserProfile = {
      ...userProfile,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastActiveDate: today,
      streakBonusClaimedToday: true,
      streakXP: (userProfile.streakXP || 0) + bonus,
      score: newScore,
      level: newLevel,
      achievements: updatedAchievements,
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updated);
    setStatusMessage(`🔥 Day ${streakResult.currentStreak} Streak Bonus Claimed! (+${bonus} XP)`);
    setTimeout(() => setStatusMessage(null), 3500);

    if (authUser) {
      updateDoc(doc(db, 'users', authUser.uid), {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastActiveDate: today,
        streakBonusClaimedToday: true,
        streakXP: (userProfile.streakXP || 0) + bonus,
        score: newScore,
        level: newLevel,
        achievements: updatedAchievements,
        updatedAt: new Date().toISOString(),
      }).catch(console.warn);
    }
  };

  // Add Item (Admin)
  const handleAddItem = async (newItem: HuntItem) => {
    try {
      await setDoc(doc(db, 'items', newItem.id), newItem);
      setStatusMessage(`Added "${newItem.name}" to Rapid Run catalog!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.warn('Item created locally:', err);
      setItems((prev) => [newItem, ...prev]);
    }
  };

  // Delete Item (Admin)
  const handleDeleteItem = async (id: string) => {
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setStatusMessage('Item removed from campus.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Post Trade Offer
  const handlePostTrade = async (offerItemId: string, offerItemName: string, lookingFor: string) => {
    const tradeId = `trade_${Date.now()}`;
    const newTrade: TradeOffer = {
      id: tradeId,
      fromUserId: userProfile.id,
      fromUserName: userProfile.displayName,
      offerItemId,
      offerItemName,
      offerRarity: items.find((i) => i.id === offerItemId)?.rarity || 'common',
      lookingFor,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'trades', tradeId), newTrade);

      // Social feed item
      const feedId = `feed_trade_${Date.now()}`;
      await setDoc(doc(db, 'feed', feedId), {
        id: feedId,
        userId: userProfile.id,
        userName: userProfile.displayName,
        type: 'trade',
        title: `New Trade Offer: ${offerItemName}`,
        content: `${userProfile.displayName} wants to barter for: "${lookingFor}"`,
        likes: 0,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setTradeOffers((prev) => [newTrade, ...prev]);
    }
  };

  // Accept Trade
  const handleAcceptTrade = async (trade: TradeOffer) => {
    try {
      await updateDoc(doc(db, 'trades', trade.id), {
        status: 'completed',
        acceptedByUserId: userProfile.id,
        acceptedByUserName: userProfile.displayName,
      });
      sounds.playUnlockFanfare('epic');
    } catch (err) {
      setTradeOffers((prev) =>
        prev.map((t) =>
          t.id === trade.id
            ? { ...t, status: 'completed', acceptedByUserName: userProfile.displayName }
            : t
        )
      );
    }
  };

  // Like Feed Item
  const handleLikeFeedItem = async (feedId: string) => {
    try {
      const feedRef = doc(db, 'feed', feedId);
      const current = feedItems.find((f) => f.id === feedId);
      if (current) {
        await updateDoc(feedRef, { likes: (current.likes || 0) + 1 });
      }
    } catch (err) {
      setFeedItems((prev) =>
        prev.map((f) => (f.id === feedId ? { ...f, likes: (f.likes || 0) + 1 } : f))
      );
    }
  };

  // Teleport simulator helper
  const handleSimulateNearItem = (targetItem: HuntItem) => {
    setUserCoords({
      lat: targetItem.lat + 0.00005, // ~5 meters away
      lng: targetItem.lng + 0.00005,
      accuracy: 5,
    });
    setGpsSimulated(true);
    sounds.playClick();
    setStatusMessage(`GPS position simulated ~5m from ${targetItem.name}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // The first Little Guy item reference
  const littleGuy = items.find((i) => i.id === 'rapid-guy-01') || items[0];
  const today = getTodayDateString();
  const isStreakBonusClaimed = userProfile.lastActiveDate === today && userProfile.streakBonusClaimedToday;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 shrink-0">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '15s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-base sm:text-lg text-white tracking-tight">
                  RAPID HUNT
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  RAPID RUN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Real-World 3D Meme Quest & School Leaderboard
              </p>
            </div>
          </div>

          {/* Quick Actions & User Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Daily Streak Trigger Button in Navbar */}
            <button
              onClick={() => {
                setIsStreakModalOpen(true);
                sounds.playClick();
              }}
              className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-orange-500/10"
              title="Daily Streak Tracker & Bonus XP"
            >
              <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
              <span>{userProfile.currentStreak || 1}d Streak</span>
              {!isStreakBonusClaimed && (
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              )}
            </button>

            {/* Direct Scan QR Button */}
            <button
              onClick={() => {
                setIsScannerOpen(true);
                sounds.playClick();
              }}
              className="py-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-sky-500/25 transition active:scale-95 animate-pulse"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>

            {/* Admin Panel Toggle */}
            <button
              onClick={() => {
                setIsAdminOpen(true);
                sounds.playClick();
              }}
              className={`p-2 rounded-xl border transition ${
                userProfile.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Admin Command (Add 3D Items & QR Cards)"
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* Auth Button */}
            {authUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                <div 
                  onClick={() => setActiveTab('inventory')}
                  className="cursor-pointer flex items-center gap-2 bg-slate-800/80 hover:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs transition"
                >
                  <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-white hidden md:inline truncate max-w-[100px]">
                    {userProfile.displayName}
                  </span>
                  <span className="text-amber-400 font-mono font-bold">
                    {userProfile.score} XP
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Sign In with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Status notification toast */}
      {statusMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-sky-500 text-white font-semibold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Hero Showcase Banner for "The Little Guy" */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Call to Action */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              <span>PRIMARY REAL-WORLD TARGET PLACED AT RAPID RUN</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Collect Real Objects.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
                Turn Them Into 3D Memes.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Real-world physical objects are hidden across Rapid Run Middle School. Walk to their GPS coordinates, scan their unique secret QR tags, unlock spinning 3D interactive artifacts like <strong>The Little Guy</strong>, keep your daily streak alive, and trade them with your classmates!
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (littleGuy) {
                    handleClaimItem(littleGuy, 4);
                  }
                }}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-rose-500/25 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulate Scan "The Little Guy" (+500 XP)</span>
              </button>

              {littleGuy && (
                <button
                  onClick={() => setQrCardItem(littleGuy)}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition"
                >
                  <QrCode className="w-4 h-4 text-sky-400" />
                  <span>Get Physical QR Sticker Card</span>
                </button>
              )}

              <button
                onClick={() => setIsStreakModalOpen(true)}
                className="py-3 px-4 rounded-2xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 font-semibold text-xs flex items-center gap-2 transition"
              >
                <Flame className="w-4 h-4 fill-orange-400" />
                <span>Daily Streak Tracker ({userProfile.currentStreak || 1}d)</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-4 pt-1">
              <span>📍 Rapid Run Courtyard</span>
              <span>•</span>
              <span>🔒 GPS Proximity Protected</span>
              <span>•</span>
              <span>🔄 Live 3D File Inspection</span>
            </div>
          </div>

          {/* Right Live 3D Showcase Card of "The Little Guy" */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-square bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-800 p-2 shadow-2xl flex flex-col items-center justify-center group">
              <div className="absolute top-4 left-4 z-20 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                MYTHIC MASCOT #001
              </div>

              <div className="w-full h-full">
                <Item3DViewer
                  modelType="little_guy"
                  modelColor="#38bdf8"
                  glowColor="#0284c7"
                  height="100%"
                  showPedestal={true}
                  autoRotate={true}
                />
              </div>

              <div className="absolute bottom-3 inset-x-3 p-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">The Little Guy</div>
                  <div className="text-[10px] text-slate-400">Click & Drag to rotate 3D mesh</div>
                </div>
                <button
                  onClick={() => littleGuy && setInspectingItem(littleGuy)}
                  className="px-3 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition"
                >
                  Full 3D Inspect
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <nav className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2.5 gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('radar')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'radar'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>School GPS Radar</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>My Inventory & Rank ({userProfile.inventory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('trades')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'trades'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Trade Feed & Barter</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Campus Real-Time Sync</span>
          </div>
        </div>
      </nav>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {activeTab === 'radar' && (
          <div className="space-y-8">
            <SchoolRadarMap
              items={items}
              userCoords={userCoords}
              ownedItemIds={userProfile.inventory}
              gpsSimulated={gpsSimulated}
              onToggleSimulate={() => setGpsSimulated(!gpsSimulated)}
              onSelectTargetItem={(target) => setInspectingItem(target)}
              onSimulateNearItem={handleSimulateNearItem}
            />

            {/* Catalog Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">Active Rapid Run Objects</h3>
                  <p className="text-xs text-slate-400">Find these around the school buildings and sports field</p>
                </div>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>Open Scanner</span>
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const isOwned = userProfile.inventory.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                        isOwned
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-300">
                          {item.rarity}
                        </span>
                        {isOwned ? (
                          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Collected</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400">
                            +{item.points} XP
                          </span>
                        )}
                      </div>

                      <div className="w-full h-32 my-1">
                        <Item3DViewer
                          modelType={item.modelType}
                          modelColor={item.modelColor}
                          glowColor={item.glowColor}
                          height={128}
                          showPedestal={false}
                          interactive={false}
                        />
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1 truncate">{item.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 my-1">{item.description}</p>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">{item.locationName}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setInspectingItem(item)}
                          className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition"
                        >
                          3D Inspect
                        </button>
                        <button
                          onClick={() => setQrCardItem(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-400 text-xs font-semibold transition"
                          title="Print QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <ProfileInventoryLeaderboard
            user={userProfile}
            leaderboardUsers={leaderboard}
            items={items}
            onInspectItem={(item) => setInspectingItem(item)}
            onOpenStreakModal={() => setIsStreakModalOpen(true)}
          />
        )}

        {activeTab === 'trades' && (
          <SocialTradeFeed
            feedItems={feedItems}
            tradeOffers={tradeOffers}
            currentUser={userProfile}
            inventoryItems={items.filter((i) => userProfile.inventory.includes(i.id))}
            onPostTrade={handlePostTrade}
            onAcceptTrade={handleAcceptTrade}
            onLikeFeedItem={handleLikeFeedItem}
          />
        )}
      </main>

      {/* Modals */}
      {isScannerOpen && (
        <QRScannerModal
          items={items}
          userCoords={userCoords}
          gpsSimulated={gpsSimulated}
          onClaimItem={handleClaimItem}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {unboxingItem && (
        <UnboxClaimModal
          item={unboxingItem.item}
          distanceMeters={unboxingItem.distance}
          onClose={() => setUnboxingItem(null)}
          onShareToFeed={() => setActiveTab('trades')}
        />
      )}

      {inspectingItem && (
        <ItemInspectModal
          item={inspectingItem}
          isOwned={userProfile.inventory.includes(inspectingItem.id)}
          onClose={() => setInspectingItem(null)}
          onInitiateTrade={(item) => {
            setActiveTab('trades');
          }}
          onShowQRCard={(item) => setQrCardItem(item)}
        />
      )}

      {qrCardItem && (
        <QRCardModal
          item={qrCardItem}
          onClose={() => setQrCardItem(null)}
        />
      )}

      {isAdminOpen && (
        <AdminPanelModal
          items={items}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onShowQRCard={(item) => setQrCardItem(item)}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {isStreakModalOpen && (
        <DailyStreakModal
          user={userProfile}
          onClaimDailyBonus={handleClaimDailyBonus}
          onClose={() => setIsStreakModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Rapid Run Middle School Collectibles Quest • Designed for physical object hunting with GPS verification.
          </div>
          <div className="flex items-center gap-4">
            <span>Lat: 39.1135° N, Lng: 84.6648° W</span>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                sounds.playClick();
              }}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

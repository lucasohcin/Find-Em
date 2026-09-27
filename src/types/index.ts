export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type ModelType = 
  | 'little_guy' 
  | 'golden_trophy' 
  | 'cyber_disk' 
  | 'potion_flask' 
  | 'meme_orb' 
  | 'school_pass';

export interface HuntItem {
  id: string;
  name: string;
  code: string; // Secret verification code encoded in QR
  description: string;
  rarity: ItemRarity;
  category: string;
  locationName: string;
  lat: number;
  lng: number;
  radiusMeters: number; // e.g. 35m proximity requirement
  modelType: ModelType;
  modelColor: string;
  glowColor: string;
  points: number;
  lore: string;
  createdBy: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'player' | 'admin';
  score: number;
  level: number;
  itemsCount: number;
  title: string;
  inventory: string[]; // Item IDs
  achievements: string[];
  currentStreak: number; // consecutive days active
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakBonusClaimedToday: boolean;
  streakXP: number; // accumulated bonus XP from streaks
  createdAt: string;
  updatedAt: string;
}

export interface ItemClaim {
  id: string;
  userId: string;
  userDisplayName: string;
  itemId: string;
  itemName: string;
  itemRarity: ItemRarity;
  points: number;
  distanceMeters: number;
  verified: boolean;
  claimedAt: string;
}

export interface TradeOffer {
  id: string;
  fromUserId: string;
  fromUserName: string;
  offerItemId: string;
  offerItemName: string;
  offerRarity: ItemRarity;
  lookingFor: string;
  status: 'open' | 'completed' | 'cancelled';
  acceptedByUserId?: string;
  acceptedByUserName?: string;
  createdAt: string;
}

export interface SocialFeedItem {
  id: string;
  userId: string;
  userName: string;
  type: 'claim' | 'trade' | 'achievement' | 'levelup';
  title: string;
  content: string;
  itemId?: string;
  itemName?: string;
  itemRarity?: ItemRarity;
  likes: number;
  createdAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

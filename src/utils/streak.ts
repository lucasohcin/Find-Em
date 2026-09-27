/**
 * Utility functions for calculating and updating user daily streaks.
 */

export interface StreakCalculationResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  isNewDay: boolean;
  isStreakExtended: boolean;
  wasReset: boolean;
  bonusXP: number;
  message: string;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDailyStreak(
  lastActiveDate?: string,
  currentStreak: number = 0,
  longestStreak: number = 0,
  trigger: 'login' | 'scan' = 'login'
): StreakCalculationResult {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (!lastActiveDate) {
    // First time player
    const initialStreak = 1;
    const bonus = trigger === 'scan' ? 100 : 50;
    return {
      currentStreak: initialStreak,
      longestStreak: Math.max(longestStreak, initialStreak),
      lastActiveDate: today,
      isNewDay: true,
      isStreakExtended: true,
      wasReset: false,
      bonusXP: bonus,
      message: `Welcome to Rapid Run! You started a 1-day streak (+${bonus} XP)!`,
    };
  }

  if (lastActiveDate === today) {
    // Already checked in today
    return {
      currentStreak: Math.max(1, currentStreak),
      longestStreak: Math.max(longestStreak, currentStreak),
      lastActiveDate: today,
      isNewDay: false,
      isStreakExtended: false,
      wasReset: false,
      bonusXP: 0,
      message: `Streak active for today (${currentStreak} ${currentStreak === 1 ? 'day' : 'days'})! Keep it up tomorrow for more bonus XP.`,
    };
  }

  if (lastActiveDate === yesterday) {
    // Consecutive day check-in!
    const newStreak = (currentStreak || 0) + 1;
    let bonus = 50 + (newStreak * 25);
    let milestoneNote = '';

    if (newStreak === 3) {
      bonus += 100;
      milestoneNote = ' 🎯 3-Day Milestone Bonus!';
    } else if (newStreak === 5) {
      bonus += 200;
      milestoneNote = ' ⚡ 5-Day Champion Bonus!';
    } else if (newStreak === 7) {
      bonus += 500;
      milestoneNote = ' 👑 7-Day Full Week Streak Legend Bonus!';
    }

    if (trigger === 'scan') {
      bonus += 50; // extra reward for scanning physical item
    }

    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      lastActiveDate: today,
      isNewDay: true,
      isStreakExtended: true,
      wasReset: false,
      bonusXP: bonus,
      message: `🔥 Streak extended to ${newStreak} days!${milestoneNote} Earned +${bonus} Streak XP!`,
    };
  }

  // Missed a day or more -> reset to 1
  const resetStreak = 1;
  const bonus = 50;
  return {
    currentStreak: resetStreak,
    longestStreak: Math.max(longestStreak, resetStreak),
    lastActiveDate: today,
    isNewDay: true,
    isStreakExtended: false,
    wasReset: true,
    bonusXP: bonus,
    message: `Your streak reset. Welcome back! Day 1 streak started (+${bonus} XP)!`,
  };
}

export function getTimeUntilNextDayMidnight(): { hours: number; minutes: number } {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
}

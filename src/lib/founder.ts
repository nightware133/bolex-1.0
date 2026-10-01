export const FOUNDER_EMAIL = 'tayden.simon@2hourlearning.com';
export const FOUNDER_NAME = 'Tayden Simon';
export const FOUNDER_PASSKEY_STORAGE_KEY = 'bolex_founder_passkey_session';
export const FOUNDER_ANNOUNCEMENT_STORAGE_KEY = 'bolex_global_announcement_v1';
export const FOUNDER_GIVEAWAYS_STORAGE_KEY = 'bolex_giveaways_v1';
export const FOUNDER_LICENSE_KEYS_STORAGE_KEY = 'bolex_license_keys_v1';

// Preset default passkeys so the founder can unlock admin console on any browser
export const DEFAULT_PASSKEYS = ['tayden2026', 'bolex-founder-vip', 'tayden-founder'];

export interface GiveawayParticipant {
  id: string;
  name: string;
  email: string;
  enteredAt: number;
}

export interface GiveawayWinner {
  id: string;
  name: string;
  email: string;
  claimCode: string;
  drawnAt: number;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeTier: 'plus' | 'ultra' | 'quantum' | 'custom';
  durationDays: number;
  createdAt: number;
  endsAt: number;
  status: 'active' | 'drawn' | 'ended';
  participants: GiveawayParticipant[];
  winners?: GiveawayWinner[];
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'founder' | 'update' | 'giveaway' | 'alert';
  isActive: boolean;
  linkText?: string;
  actionType?: 'open_giveaway' | 'open_plus' | 'open_share' | 'none';
  updatedAt: number;
}

export interface LicenseKey {
  code: string;
  planTier: 'plus' | 'ultra' | 'quantum';
  duration: '1month' | '3months' | '1year' | 'lifetime';
  createdAt: number;
  isRedeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: number;
}

export const INITIAL_ANNOUNCEMENT: SystemAnnouncement = {
  id: 'announcement-launch-1',
  title: 'Founder Announcement from Tayden Simon',
  message: 'Welcome to Bolex AI Assistant! Enter our official Launch Giveaway to win 1 Year of Bolex Ultra VIP access.',
  type: 'giveaway',
  isActive: false,
  linkText: 'Enter Giveaway',
  actionType: 'open_giveaway',
  updatedAt: Date.now(),
};

export const INITIAL_GIVEAWAYS: Giveaway[] = [
  {
    id: 'giveaway-launch-ultra',
    title: 'Bolex Ultra VIP 1-Year Membership Giveaway',
    description: 'Celebrate the official public launch of Bolex AI! Winner receives 1 Full Year of Bolex Ultra with infinite context and priority quantum reasoning.',
    prize: '1 Year Bolex Ultra VIP ($348 Value)',
    prizeTier: 'ultra',
    durationDays: 7,
    createdAt: Date.now() - 3600000 * 24,
    endsAt: Date.now() + 3600000 * 24 * 6,
    status: 'active',
    participants: [
      { id: 'p1', name: 'Alex M.', email: 'alex.m@example.com', enteredAt: Date.now() - 3600000 * 18 },
      { id: 'p2', name: 'Sophia R.', email: 'sophia.r@tech.org', enteredAt: Date.now() - 3600000 * 12 },
      { id: 'p3', name: 'Liam K.', email: 'liam.k@school.edu', enteredAt: Date.now() - 3600000 * 5 },
      { id: 'p4', name: 'Elena V.', email: 'elena@design.io', enteredAt: Date.now() - 3600000 * 2 },
    ],
  },
];

export const INITIAL_LICENSE_KEYS: LicenseKey[] = [
  {
    code: 'BOLEX-ULTRA-LAUNCH',
    planTier: 'ultra',
    duration: '1month',
    createdAt: Date.now(),
    isRedeemed: false,
  },
  {
    code: 'FOUNDER-TAYDEN-VIP',
    planTier: 'quantum',
    duration: 'lifetime',
    createdAt: Date.now(),
    isRedeemed: false,
  },
  {
    code: 'PLUS-SPECIAL-30D',
    planTier: 'plus',
    duration: '1month',
    createdAt: Date.now(),
    isRedeemed: false,
  },
];

// Helper: Check if user has Founder rights (Exclusively Tayden Simon's account)
export function isUserFounder(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === FOUNDER_EMAIL.toLowerCase();
}

export function isFounderSessionActive(): boolean {
  try {
    const session = localStorage.getItem(FOUNDER_PASSKEY_STORAGE_KEY);
    return session === 'active';
  } catch {
    return false;
  }
}

export function setFounderSessionActive(active: boolean) {
  try {
    if (active) {
      localStorage.setItem(FOUNDER_PASSKEY_STORAGE_KEY, 'active');
    } else {
      localStorage.removeItem(FOUNDER_PASSKEY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}

export function verifyFounderPasskey(inputKey: string): boolean {
  const clean = inputKey.trim().toLowerCase();
  return DEFAULT_PASSKEYS.includes(clean);
}

// Announcements storage
export function getStoredAnnouncement(): SystemAnnouncement {
  try {
    const raw = localStorage.getItem(FOUNDER_ANNOUNCEMENT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return INITIAL_ANNOUNCEMENT;
}

export function saveStoredAnnouncement(announcement: SystemAnnouncement) {
  try {
    localStorage.setItem(FOUNDER_ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(announcement));
  } catch {
    // fallback
  }
}

// Giveaways storage
export function getStoredGiveaways(): Giveaway[] {
  try {
    const raw = localStorage.getItem(FOUNDER_GIVEAWAYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_GIVEAWAYS;
}

export function saveStoredGiveaways(giveaways: Giveaway[]) {
  try {
    localStorage.setItem(FOUNDER_GIVEAWAYS_STORAGE_KEY, JSON.stringify(giveaways));
  } catch {
    // fallback
  }
}

// License keys storage
export function getStoredLicenseKeys(): LicenseKey[] {
  try {
    const raw = localStorage.getItem(FOUNDER_LICENSE_KEYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_LICENSE_KEYS;
}

export function saveStoredLicenseKeys(keys: LicenseKey[]) {
  try {
    localStorage.setItem(FOUNDER_LICENSE_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // fallback
  }
}

// Redeem helper
export function validateAndRedeemKey(
  inputCode: string, 
  redeemerEmail: string
): { success: boolean; key?: LicenseKey; error?: string } {
  const cleanCode = inputCode.trim().toUpperCase();
  const keys = getStoredLicenseKeys();
  const index = keys.findIndex((k) => k.code.toUpperCase() === cleanCode);

  if (index === -1) {
    return { success: false, error: 'Invalid license or gift code. Please double-check characters.' };
  }

  const targetKey = keys[index];
  if (targetKey.isRedeemed) {
    return { success: false, error: `This code has already been redeemed on ${new Date(targetKey.redeemedAt || 0).toLocaleDateString()}.` };
  }

  // Mark as redeemed
  targetKey.isRedeemed = true;
  targetKey.redeemedBy = redeemerEmail || 'user';
  targetKey.redeemedAt = Date.now();
  keys[index] = targetKey;
  saveStoredLicenseKeys(keys);

  return { success: true, key: targetKey };
}

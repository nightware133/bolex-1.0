import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { 
  auth, 
  googleProvider, 
  getUserProfile, 
  syncUserProfile, 
  updateUserProfileData,
  syncPublicProfile
} from '../lib/firebase';
import { UserProfile } from '../types';

export type PlanTier = 'free' | 'plus' | 'ultra' | 'quantum';

const LOCAL_STORAGE_KEY = 'bolex_local_user_profile';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  isLocalUser: boolean;
  effectiveTier: PlanTier;
  isTrialActive: boolean;
  trialRemainingText: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInLocally: (email?: string, displayName?: string, tier?: PlanTier) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileInfo: (updates: { 
    displayName?: string; 
    bio?: string; 
    photoURL?: string;
    isBolexPlus?: boolean;
    isBolexUltra?: boolean;
    isBolexQuantum?: boolean;
    planTier?: PlanTier;
    trialTier?: 'plus' | 'ultra' | 'quantum' | null;
    trialStartedAt?: string | null;
    trialExpiresAt?: string | null;
  }) => Promise<void>;
  setPlanTier: (tier: PlanTier) => Promise<void>;
  startTrial: (tier: 'plus' | 'ultra' | 'quantum') => Promise<void>;
  cancelTrial: () => Promise<void>;
  setBolexPlus: (enabled: boolean) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createMockLocalUser(email: string, displayName: string, uid?: string): User {
  const cleanUid = uid || `local_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || Date.now().toString()}`;
  return {
    uid: cleanUid,
    email,
    displayName,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [{
      uid: cleanUid,
      displayName,
      email,
      phoneNumber: null,
      photoURL: null,
      providerId: 'password',
    }],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'local-mock-token',
    getIdTokenResult: async () => ({
      authTime: new Date().toISOString(),
      claims: {},
      expirationTime: new Date(Date.now() + 86400000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      signInProvider: 'local',
      signInSecondFactor: null,
      token: 'local-mock-token',
    }),
    reload: async () => {},
    toJSON: () => ({ uid: cleanUid, email, displayName }),
    phoneNumber: null,
    providerId: 'local',
  } as unknown as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLocalUser, setIsLocalUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize and restore saved local session if present
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedRaw) {
        const savedProfile: UserProfile = JSON.parse(savedRaw);
        if (savedProfile && typeof savedProfile === 'object') {
          const uid = savedProfile.uid || `local_${Date.now()}`;
          const localUser = createMockLocalUser(
            savedProfile.email || 'user@bolex.ai',
            savedProfile.displayName || 'Bolex User',
            uid
          );
          setUser(localUser);
          setProfile(savedProfile);
          setIsLocalUser(true);
        }
      }
    } catch {
      // LocalStorage parse error ignored
    }
  }, []);

  // Monitor Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLocalUser(false);
        try {
          // Fetch existing profile or sync new one
          let userProf = await getUserProfile(currentUser.uid);
          if (!userProf) {
            userProf = await syncUserProfile(currentUser);
          } else {
            // Ensure public directory is populated with non-PII record
            syncPublicProfile(currentUser.uid, {
              displayName: userProf.displayName,
              photoURL: userProf.photoURL,
              bio: userProf.bio,
              planTier: userProf.planTier || 'free',
              createdAt: userProf.createdAt,
            }).catch(() => {});
          }
          setProfile(userProf);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userProf));
          } catch {
            // storage full
          }
        } catch (err) {
          console.error('Failed to load user profile from Firestore:', err);
        }
      } else {
        // If no Firebase user, restore or maintain local profile if exists
        const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedRaw) {
          try {
            const savedProfile: UserProfile = JSON.parse(savedRaw);
            if (savedProfile && typeof savedProfile === 'object') {
              const uid = savedProfile.uid || `local_${Date.now()}`;
              const localUser = createMockLocalUser(
                savedProfile.email || 'user@bolex.ai',
                savedProfile.displayName || 'Bolex User',
                uid
              );
              setUser(localUser);
              setProfile(savedProfile);
              setIsLocalUser(true);
            }
          } catch {
            // ignore
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  // Seamless Local Sign In (Works as offline / guest session)
  const signInLocally = async (
    email: string = 'user@bolex.ai',
    displayName: string = 'Bolex User',
    tier: PlanTier = 'free'
  ) => {
    const cleanEmail = email.trim() || 'user@bolex.ai';
    const cleanName = displayName?.trim() || cleanEmail.split('@')[0] || 'Bolex User';
    const localUser = createMockLocalUser(cleanEmail, cleanName);
    
    const now = new Date().toISOString();
    const localProfile: UserProfile = {
      uid: localUser.uid,
      email: cleanEmail,
      displayName: cleanName,
      createdAt: now,
      updatedAt: now,
      planTier: tier,
      isBolexPlus: tier === 'plus' || tier === 'ultra' || tier === 'quantum',
      isBolexUltra: tier === 'ultra' || tier === 'quantum',
      isBolexQuantum: tier === 'quantum',
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localProfile));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    setUser(localUser);
    setProfile(localProfile);
    setIsLocalUser(true);
    setAuthError(null);
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setIsLocalUser(false);
        const synced = await syncUserProfile(result.user);
        setProfile(synced);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(synced));
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed popup
        return;
      }
      if (error?.code === 'auth/unauthorized-domain') {
        const message = 'Google Sign-In popup was blocked because this preview domain is not in Firebase Authorized Domains. Please use Email & Password Sign Up / Sign In above, which is fully supported and works immediately without domain setup!';
        setAuthError(message);
        throw new Error(message);
      }
      if (error?.code === 'auth/operation-not-allowed') {
        const message = 'Google sign-in is not enabled in Firebase Console. Please toggle Google ON under Authentication > Sign-in method, or sign in using Email & Password above.';
        setAuthError(message);
        throw new Error(message);
      }
      const message = error?.message || 'Failed to sign in with Google.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setIsLocalUser(false);
        let userProf = await getUserProfile(result.user.uid);
        if (!userProf) {
          userProf = await syncUserProfile(result.user);
        }
        setProfile(userProf);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userProf));
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let message = 'Unable to sign in. Please check your credentials.';
      if (
        error?.code === 'auth/invalid-credential' || 
        error?.code === 'auth/wrong-password' || 
        error?.code === 'auth/user-not-found'
      ) {
        message = 'Invalid email or password. If you do not have an account yet, please switch to "Create Account" to sign up.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled in Firebase Console. Please verify that Email/Password is toggled ON in Firebase Console under Authentication > Sign-in method.';
      } else if (error?.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please wait a moment and try again.';
      } else if (error?.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error?.message) {
        message = error.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setIsLocalUser(false);
        if (displayName?.trim()) {
          try {
            await updateProfile(result.user, { displayName: displayName.trim() });
          } catch {
            // ignore
          }
        }
        const synced = await syncUserProfile(result.user, { displayName: displayName?.trim() });
        setProfile(synced);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(synced));
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let message = 'Failed to create account.';
      if (error?.code === 'auth/email-already-in-use') {
        message = 'An account with this email address already exists. Please switch to "Sign In" to log in.';
      } else if (error?.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-up is not enabled in Firebase Console. Please verify that Email/Password is toggled ON in Firebase Console under Authentication > Sign-in method.';
      } else if (error?.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error?.message) {
        message = error.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    setIsLocalUser(false);
  };

  // Compute effective tier taking 3-day trials into account
  const { isTrialActive, trialRemainingText, effectiveTier } = useMemo(() => {
    if (!profile) {
      return { isTrialActive: false, trialRemainingText: null, effectiveTier: 'free' as PlanTier };
    }

    let trialActive = false;
    let remainingText: string | null = null;
    if (profile.trialExpiresAt && profile.trialTier) {
      const expiresMs = new Date(profile.trialExpiresAt).getTime();
      const nowMs = Date.now();
      if (expiresMs > nowMs) {
        trialActive = true;
        const diffMs = expiresMs - nowMs;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        remainingText = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
      }
    }

    let tier: PlanTier = 'free';
    if (profile.planTier === 'quantum' || profile.isBolexQuantum) {
      tier = 'quantum';
    } else if (profile.planTier === 'ultra' || profile.isBolexUltra) {
      tier = 'ultra';
    } else if (profile.planTier === 'plus' || profile.isBolexPlus) {
      tier = 'plus';
    }

    // Active trial overrides if higher
    if (trialActive && profile.trialTier) {
      if (profile.trialTier === 'quantum') {
        tier = 'quantum';
      } else if (profile.trialTier === 'ultra' && tier !== 'quantum') {
        tier = 'ultra';
      } else if (profile.trialTier === 'plus' && tier !== 'ultra' && tier !== 'quantum') {
        tier = 'plus';
      }
    }

    return {
      isTrialActive: trialActive,
      trialRemainingText: remainingText,
      effectiveTier: tier,
    };
  }, [profile]);

  const updateProfileInfo = async (updates: { 
    displayName?: string; 
    bio?: string; 
    photoURL?: string;
    isBolexPlus?: boolean;
    isBolexUltra?: boolean;
    isBolexQuantum?: boolean;
    planTier?: PlanTier;
    trialTier?: 'plus' | 'ultra' | 'quantum' | null;
    trialStartedAt?: string | null;
    trialExpiresAt?: string | null;
  }) => {
    const updatedProfile: UserProfile = {
      uid: user?.uid || 'guest',
      email: user?.email || 'guest@bolex.ai',
      displayName: updates.displayName !== undefined ? updates.displayName : (profile?.displayName || 'User'),
      photoURL: updates.photoURL !== undefined ? updates.photoURL : profile?.photoURL,
      bio: updates.bio !== undefined ? updates.bio : profile?.bio,
      isBolexPlus: updates.isBolexPlus !== undefined ? updates.isBolexPlus : profile?.isBolexPlus,
      isBolexUltra: updates.isBolexUltra !== undefined ? updates.isBolexUltra : profile?.isBolexUltra,
      isBolexQuantum: updates.isBolexQuantum !== undefined ? updates.isBolexQuantum : profile?.isBolexQuantum,
      planTier: updates.planTier !== undefined ? updates.planTier : profile?.planTier,
      trialTier: updates.trialTier !== undefined ? updates.trialTier : profile?.trialTier,
      trialStartedAt: updates.trialStartedAt !== undefined ? updates.trialStartedAt : profile?.trialStartedAt,
      trialExpiresAt: updates.trialExpiresAt !== undefined ? updates.trialExpiresAt : profile?.trialExpiresAt,
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always update local state and localStorage
    if (!user) {
      const localUser = createMockLocalUser(updatedProfile.email, updatedProfile.displayName, updatedProfile.uid);
      setUser(localUser);
      setIsLocalUser(true);
    }
    setProfile(updatedProfile);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // ignore
    }

    // If signed into real Firebase Auth, sync to Firestore
    if (user && !isLocalUser && !user.uid.startsWith('local_')) {
      try {
        await updateUserProfileData(user.uid, updates);
      } catch (err) {
        console.warn('Firestore update failed (using local state fallback):', err);
      }
    }
  };

  const startTrial = async (tier: 'plus' | 'ultra' | 'quantum') => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const updates = {
      planTier: tier,
      trialTier: tier,
      trialStartedAt: now.toISOString(),
      trialExpiresAt: expires.toISOString(),
      isBolexPlus: true,
      isBolexUltra: tier === 'ultra' || tier === 'quantum',
      isBolexQuantum: tier === 'quantum',
    };
    await updateProfileInfo(updates);
  };

  const cancelTrial = async () => {
    const updates = {
      planTier: 'free' as PlanTier,
      trialTier: null,
      trialStartedAt: null,
      trialExpiresAt: null,
      isBolexPlus: false,
      isBolexUltra: false,
      isBolexQuantum: false,
    };
    await updateProfileInfo(updates);
  };

  const setPlanTier = async (tier: PlanTier) => {
    const updates = {
      planTier: tier,
      isBolexPlus: tier === 'plus' || tier === 'ultra' || tier === 'quantum',
      isBolexUltra: tier === 'ultra' || tier === 'quantum',
      isBolexQuantum: tier === 'quantum',
    };
    await updateProfileInfo(updates);
  };

  const setBolexPlus = async (enabled: boolean) => {
    await setPlanTier(enabled ? 'plus' : 'free');
  };

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    authError,
    isLocalUser,
    effectiveTier,
    isTrialActive,
    trialRemainingText,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInLocally,
    logout,
    updateProfileInfo,
    setPlanTier,
    startTrial,
    cancelTrial,
    setBolexPlus,
    clearAuthError,
  }), [
    user,
    profile,
    loading,
    authError,
    isLocalUser,
    effectiveTier,
    isTrialActive,
    trialRemainingText,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

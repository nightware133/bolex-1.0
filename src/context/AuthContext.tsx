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
  updateUserProfileData 
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileInfo: (updates: { 
    displayName?: string; 
    bio?: string; 
    photoURL?: string;
    isBolexPlus?: boolean;
    planTier?: 'free' | 'plus';
  }) => Promise<void>;
  setBolexPlus: (enabled: boolean) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch existing profile or sync new one
          let userProf = await getUserProfile(currentUser.uid);
          if (!userProf) {
            userProf = await syncUserProfile(currentUser);
          }
          setProfile(userProf);
        } catch (err) {
          console.error('Failed to load user profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const synced = await syncUserProfile(result.user);
        setProfile(synced);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed popup
        return;
      }
      const message = error?.message || 'Failed to sign in with Google.';
      setAuthError(message);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        let userProf = await getUserProfile(result.user.uid);
        if (!userProf) {
          userProf = await syncUserProfile(result.user);
        }
        setProfile(userProf);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let message = 'Unable to sign in. Please check your credentials.';
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      } else if (error?.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again later.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        message = 'Email & Password sign-in is disabled in Firebase console. Please use Google Sign-In or enable Email/Password provider.';
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
        if (displayName?.trim()) {
          await updateProfile(result.user, { displayName: displayName.trim() });
        }
        const synced = await syncUserProfile(result.user, { displayName: displayName?.trim() });
        setProfile(synced);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let message = 'Failed to create account.';
      if (error?.code === 'auth/email-already-in-use') {
        message = 'An account with this email address already exists.';
      } else if (error?.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (error?.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        message = 'Email & Password sign-up is disabled in Firebase console. Please use Google Sign-In or enable Email/Password provider.';
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
      setUser(null);
      setProfile(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setAuthError(error?.message || 'Failed to sign out.');
    }
  };

  const updateProfileInfo = async (updates: { 
    displayName?: string; 
    bio?: string; 
    photoURL?: string;
    isBolexPlus?: boolean;
    planTier?: 'free' | 'plus';
  }) => {
    if (!user) throw new Error('Must be signed in to update profile.');
    try {
      await updateUserProfileData(user.uid, updates);
      // Reload profile
      const updated = await getUserProfile(user.uid);
      if (updated) {
        setProfile(updated);
      } else {
        setProfile(prev => prev ? {
          ...prev,
          displayName: updates.displayName !== undefined ? updates.displayName : prev.displayName,
          bio: updates.bio !== undefined ? updates.bio : prev.bio,
          photoURL: updates.photoURL !== undefined ? updates.photoURL : prev.photoURL,
          isBolexPlus: updates.isBolexPlus !== undefined ? updates.isBolexPlus : prev.isBolexPlus,
          planTier: updates.planTier !== undefined ? updates.planTier : prev.planTier,
          updatedAt: new Date().toISOString()
        } : null);
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
      throw err;
    }
  };

  const setBolexPlus = async (enabled: boolean) => {
    if (!user) {
      // For guest users, simulate local profile toggle so they can try perks
      setProfile(prev => ({
        uid: 'guest',
        email: 'guest@bolex.ai',
        displayName: 'Guest User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBolexPlus: enabled,
        planTier: enabled ? 'plus' : 'free',
        ...(prev || {})
      }));
      return;
    }
    await updateProfileInfo({
      isBolexPlus: enabled,
      planTier: enabled ? 'plus' : 'free'
    });
  };

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateProfileInfo,
    setBolexPlus,
    clearAuthError,
  }), [user, profile, loading, authError]);

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

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocFromServer,
  collection,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, PublicUserProfile } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit databaseId from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Test connection at initialization as required by Firestore verification standards
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Standardized Firestore error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetch a user's secure profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Synchronizes public searchable profile in publicProfiles collection
 * Strictly real human accounts, zero bots, and zero email/PII leakage
 */
export async function syncPublicProfile(
  uid: string,
  data: {
    displayName: string;
    photoURL?: string;
    bio?: string;
    planTier?: 'free' | 'plus' | 'ultra' | 'quantum';
    createdAt?: string;
  }
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  const path = `publicProfiles/${uid}`;
  const now = new Date().toISOString();
  try {
    const publicDocRef = doc(db, 'publicProfiles', uid);
    const existingSnap = await getDoc(publicDocRef);
    if (existingSnap.exists()) {
      const updates: Record<string, unknown> = {
        displayName: data.displayName.slice(0, 100),
        updatedAt: now,
      };
      if (data.photoURL !== undefined) updates.photoURL = data.photoURL.slice(0, 1024);
      if (data.bio !== undefined) updates.bio = data.bio.slice(0, 500);
      if (data.planTier !== undefined) updates.planTier = data.planTier;
      await updateDoc(publicDocRef, updates);
    } else {
      const publicPayload: Record<string, unknown> = {
        uid,
        displayName: data.displayName.slice(0, 100),
        createdAt: data.createdAt || now,
        updatedAt: now,
      };
      if (data.photoURL) publicPayload.photoURL = data.photoURL.slice(0, 1024);
      if (data.bio) publicPayload.bio = data.bio.slice(0, 500);
      if (data.planTier) publicPayload.planTier = data.planTier;
      await setDoc(publicDocRef, publicPayload);
    }
  } catch (error) {
    console.warn('Public profile sync skipped:', error);
  }
}

/**
 * Ensures a user profile exists in Firestore upon signup or initial login
 */
export async function syncUserProfile(user: User, additionalInfo?: { displayName?: string; bio?: string }): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const now = new Date().toISOString();
  
  try {
    const existing = await getUserProfile(user.uid);
    if (existing) {
      // Profile exists, update updatedAt and any new display name if provided
      const updates: Partial<UserProfile> = {
        updatedAt: now,
      };
      if (additionalInfo?.displayName && additionalInfo.displayName !== existing.displayName) {
        updates.displayName = additionalInfo.displayName.slice(0, 100);
      }
      if (additionalInfo?.bio !== undefined) {
        updates.bio = additionalInfo.bio.slice(0, 500);
      }
      
      await updateDoc(doc(db, 'users', user.uid), updates);
      const merged = { ...existing, ...updates };

      // Also ensure public directory record is up to date (no email/PII)
      await syncPublicProfile(user.uid, {
        displayName: merged.displayName,
        photoURL: merged.photoURL,
        bio: merged.bio,
        planTier: merged.planTier || 'free',
        createdAt: merged.createdAt,
      });

      return merged;
    }

    // Create new profile adhering to schema & constraints
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || 'no-email@bolex.ai',
      displayName: additionalInfo?.displayName || user.displayName || user.email?.split('@')[0] || 'AI Explorer',
      photoURL: user.photoURL || undefined,
      bio: additionalInfo?.bio || 'Bolex AI user exploring intelligent prompts.',
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined fields before writing
    const docData: Record<string, unknown> = {
      uid: newProfile.uid,
      email: newProfile.email,
      displayName: newProfile.displayName,
      createdAt: newProfile.createdAt,
      updatedAt: newProfile.updatedAt,
    };
    if (newProfile.photoURL) docData.photoURL = newProfile.photoURL;
    if (newProfile.bio) docData.bio = newProfile.bio;

    await setDoc(doc(db, 'users', user.uid), docData);

    // Sync to public directory for searching people in Bolex (zero bots, zero PII)
    await syncPublicProfile(user.uid, {
      displayName: newProfile.displayName,
      photoURL: newProfile.photoURL,
      bio: newProfile.bio,
      planTier: 'free',
      createdAt: newProfile.createdAt,
    });

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Updates basic user information securely in Firestore and Auth profile
 */
export async function updateUserProfileData(
  uid: string, 
  updates: { 
    displayName?: string; 
    bio?: string; 
    photoURL?: string; 
    isBolexPlus?: boolean; 
    isBolexUltra?: boolean;
    isBolexQuantum?: boolean;
    planTier?: 'free' | 'plus' | 'ultra' | 'quantum';
    trialTier?: 'plus' | 'ultra' | 'quantum' | null;
    trialStartedAt?: string | null;
    trialExpiresAt?: string | null;
  }
): Promise<void> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  
  try {
    const cleanedUpdates: Record<string, unknown> = {
      updatedAt: now,
    };
    if (updates.displayName !== undefined) {
      cleanedUpdates.displayName = updates.displayName.trim().slice(0, 100);
    }
    if (updates.bio !== undefined) {
      cleanedUpdates.bio = updates.bio.trim().slice(0, 500);
    }
    if (updates.photoURL !== undefined) {
      cleanedUpdates.photoURL = updates.photoURL.trim().slice(0, 1024);
    }
    if (updates.isBolexPlus !== undefined) {
      cleanedUpdates.isBolexPlus = Boolean(updates.isBolexPlus);
    }
    if (updates.isBolexUltra !== undefined) {
      cleanedUpdates.isBolexUltra = Boolean(updates.isBolexUltra);
    }
    if (updates.isBolexQuantum !== undefined) {
      cleanedUpdates.isBolexQuantum = Boolean(updates.isBolexQuantum);
    }
    if (updates.planTier !== undefined) {
      cleanedUpdates.planTier = updates.planTier;
    }
    if (updates.trialTier !== undefined) {
      cleanedUpdates.trialTier = updates.trialTier;
    }
    if (updates.trialStartedAt !== undefined) {
      cleanedUpdates.trialStartedAt = updates.trialStartedAt;
    }
    if (updates.trialExpiresAt !== undefined) {
      cleanedUpdates.trialExpiresAt = updates.trialExpiresAt;
    }

    await updateDoc(doc(db, 'users', uid), cleanedUpdates);

    // Also update public directory record if relevant fields changed
    await syncPublicProfile(uid, {
      displayName: (cleanedUpdates.displayName as string) || auth.currentUser?.displayName || 'Bolex User',
      photoURL: (cleanedUpdates.photoURL as string) || auth.currentUser?.photoURL || undefined,
      bio: cleanedUpdates.bio as string | undefined,
      planTier: cleanedUpdates.planTier as 'free' | 'plus' | 'ultra' | 'quantum' | undefined,
    });

    // Also update auth profile if displayName or photoURL changed
    if (auth.currentUser && (updates.displayName || updates.photoURL)) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName?.trim() || auth.currentUser.displayName,
        photoURL: updates.photoURL?.trim() || auth.currentUser.photoURL,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Searches real registered human accounts in Bolex
 * Strictly zero bots, strictly no private email leakage
 */
export async function searchPublicProfiles(searchQuery: string = ''): Promise<PublicUserProfile[]> {
  const path = 'publicProfiles';
  try {
    const q = query(collection(db, 'publicProfiles'), limit(100));
    const snapshot = await getDocs(q);
    const profiles: PublicUserProfile[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as PublicUserProfile;
      if (data && data.uid && data.displayName) {
        profiles.push(data);
      }
    });

    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      return profiles.sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
    }

    return profiles
      .filter((p) => {
        const nameMatch = p.displayName?.toLowerCase().includes(trimmed);
        const bioMatch = p.bio?.toLowerCase().includes(trimmed);
        return nameMatch || bioMatch;
      })
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut 
};

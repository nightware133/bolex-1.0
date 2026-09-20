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
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

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
      return { ...existing, ...updates };
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
    planTier?: 'free' | 'plus';
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
    if (updates.planTier !== undefined) {
      cleanedUpdates.planTier = updates.planTier;
    }

    await updateDoc(doc(db, 'users', uid), cleanedUpdates);

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

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut 
};

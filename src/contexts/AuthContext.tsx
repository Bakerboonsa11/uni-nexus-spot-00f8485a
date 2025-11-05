import { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  isPremium: boolean;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
  location?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: 'admin' | 'user') => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    console.log("🔐 AuthContext: Attempting login");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ AuthContext: Login successful");
    } catch (error) {
      console.error("❌ AuthContext: Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, role: 'admin' | 'user' = 'user') => {
    console.log("📝 AuthContext: Attempting registration");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ AuthContext: User created in Auth:", user.uid);
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.email.split('@')[0],
        role,
        isPremium: true,
        createdAt: new Date()
      });
      console.log("✅ AuthContext: User saved to Firestore");
    } catch (error) {
      console.error("❌ AuthContext: Registration error:", error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    console.log("🔄 AuthContext: Setting up auth listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔄 AuthContext: Auth state changed:", user ? user.email : "No user");
      setCurrentUser(user);
      if (user) {
        console.log("👤 AuthContext: Loading user data from Firestore");
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const docData = userDoc.data();
            const userData = {
              uid: user.uid,
              email: user.email!,
              role: docData.role,
              isPremium: docData.isPremium ?? true,
              displayName: docData.displayName,
              photoURL: docData.photoURL,
              bio: docData.bio,
              phone: docData.phone,
              location: docData.location
            };
            console.log("✅ AuthContext: User data loaded:", userData);
            setUserData(userData);
          } else {
            console.log("⚠️ AuthContext: No user document found in Firestore");
            setUserData(null);
          }
        } catch (error) {
          console.error("❌ AuthContext: Error loading user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

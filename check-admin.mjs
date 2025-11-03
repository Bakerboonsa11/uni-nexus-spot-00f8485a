import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDX5C0AMphKGOBW9MOR2w96wKYIr-oHoIs",
  authDomain: "university-hub-6be49.firebaseapp.com",
  projectId: "university-hub-6be49",
  storageBucket: "university-hub-6be49.firebasestorage.app",
  messagingSenderId: "648455540925",
  appId: "1:648455540925:web:236634ceaf5918a8b527d4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndSetAdmin() {
  try {
    // Check current user (replace with your actual user ID)
    const userId = "WkxpgtnQP9QWULRP0GqQcY7sGgJ3"; // The user ID from the premium request
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('Current user data:', userData);
      
      if (userData.role !== 'admin') {
        console.log('Setting user as admin...');
        await updateDoc(doc(db, 'users', userId), { role: 'admin' });
        console.log('✅ User is now admin');
      } else {
        console.log('✅ User is already admin');
      }
    } else {
      console.log('❌ User document not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndSetAdmin();

// Run this once to create the first admin user
// node setup-admin.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDX5C0AMphKGOBW9MOR2w96wKYIr-oHoIs",
  authDomain: "university-hub-6be49.firebaseapp.com",
  projectId: "university-hub-6be49",
  storageBucket: "university-hub-6be49.firebasestorage.app",
  messagingSenderId: "648455540925",
  appId: "1:648455540925:web:236634ceaf5918a8b527d4",
  measurementId: "G-Z7SCPLKL31"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, 'admin@university.com', 'admin123');
    await setDoc(doc(db, 'users', user.uid), {
      email: 'admin@university.com',
      role: 'admin',
      createdAt: new Date()
    });
    console.log('Admin user created successfully!');
    console.log('Email: admin@university.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin();

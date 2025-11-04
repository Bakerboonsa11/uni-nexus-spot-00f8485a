
// This script updates all documents in the 'services' and 'products' collections
// to include the 'averageRating' and 'ratingCount' fields.

// To run this script, you need to have Node.js and Firebase Admin SDK installed.
// 1. Install the dependencies: npm install firebase-admin
// 2. Replace the service account key path with your own.
// 3. Run the script: node updateSchema.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // <--- REPLACE WITH YOUR SERVICE ACCOUNT KEY PATH

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`No documents found in the ${collectionName} collection.`);
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    const docRef = collectionRef.doc(doc.id);
    batch.update(docRef, { averageRating: 0, ratingCount: 0 });
  });

  await batch.commit();
  console.log(`Successfully updated ${snapshot.size} documents in the ${collectionName} collection.`);
}

async function main() {
  try {
    await updateCollection('services');
    await updateCollection('products');
  } catch (error) {
    console.error("Error updating collections:", error);
  }
}

main();

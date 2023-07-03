import admin from 'firebase-admin';

// Import your Firebase service account key file
import serviceAccountKey from '../config/serviceAccountKey.js'

// Initialize the SDK with your Firebase service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  databaseURL: 'https://ai-labs-1d352-default-rtdb.firebaseio.com/' // Replace with your Firebase database URL
});

// Access Firebase services using the admin object
const firestore = admin.firestore();
const storage = admin.storage();

function formatDocumentName(documentName){
  return documentName.toLowerCase().replace(/ /g, '_');
}

async function checkDocumentExists(documentName) {
  const documentRef = firestore.collection('documents').doc(documentName);
  const documentSnapshot = await documentRef.get();
  return documentSnapshot.exists;
}

async function getDocumentPayload(formattedDocumentName) {
  const documentRef = firestore.collection('documents').doc(formattedDocumentName);
  const documentSnapshot = await documentRef.get();

  if (documentSnapshot.exists) {
    const documentData = documentSnapshot.data();
    return documentData;
  }

  return null;
}

// Function to update or create a document based on document name and payload
async function storeDocument(documentName, payload) {
  const formattedDocumentName = formatDocumentName(documentName)
  const documentRef = firestore.collection('documents').doc(formattedDocumentName);
  const documentExists = await checkDocumentExists(formattedDocumentName);

  if (documentExists) {
    // Document exists, update its data
    await documentRef.update(payload);
    console.log('Document updated successfully.');
  } else {
    // Document doesn't exist, create a new document with the provided data
    await documentRef.set(payload);
    console.log('Document created successfully.');
  }
}

async function getDocumentDetails(documentName) {
  const formattedDocumentName = formatDocumentName(documentName)
  const documentExists = await checkDocumentExists(formattedDocumentName);
  if (documentExists) {
    const payload = await getDocumentPayload(formattedDocumentName)
    return payload
  } else {
    return null
  }
}

export { admin, firestore, storage, storeDocument, getDocumentDetails };

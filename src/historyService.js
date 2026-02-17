import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function logHistory({ action, itemId, itemName, fromTier, toTier, userId, userName }) {
  try {
    await addDoc(collection(db, 'history'), {
      action,
      itemId: itemId || null,
      itemName,
      fromTier: fromTier || null,
      toTier: toTier || null,
      userId,
      userName,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log history:', err);
  }
}

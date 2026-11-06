import { db } from './firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

export async function sendMessage(roomId: string, senderId: string, text: string) {
  if (!text.trim()) return;

  await addDoc(collection(db, `rooms/${roomId}/messages`), {
    text,
    senderId,
    createdAt: serverTimestamp(),
    readBy: [senderId]
  });
}

export function watchMessages(roomId: string, callback: (msgs: any[]) => void) {
  const q = query(collection(db, `rooms/${roomId}/messages`), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(msgs);
  });
}
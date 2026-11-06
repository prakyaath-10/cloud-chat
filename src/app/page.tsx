'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  uid: string;
  displayName: string;
  createdAt: any;
}

export default function ChatApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch messages in real-time from Firestore when logged in
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-scroll down when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Google Sign In Handler
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  // Fixed Sign Out Handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading...
      </div>
    );
  }

  // If user is not logged in, show the clean Sign In view
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100">
        <div className="text-center space-y-4 p-8 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full shadow-xl">
          <h1 className="text-2xl font-bold">Welcome to Cloud Chat</h1>
          <p className="text-sm text-zinc-400">Sign in with your Google account to join the room.</p>
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // If user is logged in, show the Chat Room view with a fully functional Sign Out button
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 max-w-2xl mx-auto border-x border-zinc-800">
      {/* Chat Header */}
      <header className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="font-semibold text-lg">Room: General</h1>
        <button 
          onClick={handleSignOut} 
          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md transition"
        >
          Sign Out
        </button>
      </header>

      {/* Message List Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.uid === user.uid;
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-zinc-500 mb-1 px-1">
                {msg.displayName}
              </span>
              <div 
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-blue-600 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-medium text-sm transition flex items-center justify-center"
        >
          Send
        </button>
      </form>
    </div>
  );
}

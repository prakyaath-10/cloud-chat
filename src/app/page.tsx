'use client';
import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { watchMessages, sendMessage } from '../lib/chatService';
import { Send, LogOut, LogIn } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const roomId = "general-room"; // Default public room

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribeMsgs = watchMessages(roomId, (msgs) => setMessages(msgs));
    return () => unsubscribeMsgs();
  }, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    await sendMessage(roomId, user.uid, input);
    setInput('');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Cloud Chat</h1>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          <LogIn size={20} /> Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <span className="font-semibold text-gray-700">Room: General</span>
        <button onClick={() => signOut(auth)} className="text-gray-500 hover:text-red-600 transition">
          <LogOut size={20} />
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t bg-white">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type a message..." 
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 text-gray-800"
        />
        <button type="submit" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
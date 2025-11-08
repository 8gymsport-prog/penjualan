'use client';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import type { UserProfile, ChatMessage } from '@/lib/types';
import { CardHeader } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { MessageInput } from './message-input';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChatWindowProps {
  user: UserProfile;
  onBack: () => void;
}

// Helper to create a consistent chat ID between two users
const getChatId = (uid1: string, uid2: string) => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};


export function ChatWindow({ user, onBack }: ChatWindowProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Determine chatId
  useEffect(() => {
    if (currentUser && user) {
      setChatId(getChatId(currentUser.uid, user.id));
    }
  }, [currentUser, user]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, chatId]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 100);
        }
    }
  }, [messages]);


  const handleSendMessage = async (text: string) => {
    if (!firestore || !currentUser || !chatId || !text.trim()) return;

    const chatRef = doc(firestore, 'chats', chatId);
    const messagesColRef = collection(chatRef, 'messages');

    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      text,
      senderId: currentUser.uid,
    };
    
    try {
        // Check if chat doc exists, if not create it
        const chatSnap = await getDocs(query(collection(firestore, 'chats'), where('id', '==', chatId)));
        if(chatSnap.empty) {
            await setDoc(chatRef, {
                id: chatId,
                participantIds: [currentUser.uid, user.id],
            });
        }

        // Add the message and update last message
        await addDoc(messagesColRef, { ...newMessage, timestamp: serverTimestamp() });
        await updateDoc(chatRef, {
            lastMessage: {
                text,
                senderId: currentUser.uid,
                timestamp: serverTimestamp()
            }
        });
    } catch(e) {
        console.error("Error sending message: ", e)
    }
  };

  return (
    <div className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center gap-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profilePictureUrl} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold">{user.username}</h3>
      </CardHeader>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
            {isLoading && <p className="text-center text-muted-foreground">Memuat pesan...</p>}
            {messages && messages.map((msg) => (
                <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser?.uid ? "justify-end" : "justify-start")}>
                    {msg.senderId !== currentUser?.uid && (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={user.profilePictureUrl} />
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", msg.senderId === currentUser?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <p>{msg.text}</p>
                    </div>
                </div>
            ))}
             {messages && messages.length === 0 && !isLoading && (
                <p className="text-center text-sm text-muted-foreground">Belum ada pesan. Mulai percakapan!</p>
             )}
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}

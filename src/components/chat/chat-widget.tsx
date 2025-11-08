'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, X } from 'lucide-react';
import { UserList } from './user-list';
import { ChatWindow } from './chat-window';
import type { UserProfile } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-80 h-96 origin-bottom-right"
          >
            <Card className="flex h-full w-full flex-col shadow-2xl">
              {selectedUser ? (
                <ChatWindow user={selectedUser} onBack={handleBack} />
              ) : (
                <UserList onUserSelect={handleUserSelect} />
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        className="mt-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Tutup chat" : "Buka chat"}
      >
        <AnimatePresence mode="wait">
            <motion.div
                 key={isOpen ? 'x' : 'msg'}
                 initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                 animate={{ opacity: 1, rotate: 0, scale: 1 }}
                 exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                 transition={{ duration: 0.2 }}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </motion.div>
        </AnimatePresence>
      </Button>
    </div>
  );
}

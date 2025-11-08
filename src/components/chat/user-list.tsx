'use client';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';

interface UserListProps {
  onUserSelect: (user: UserProfile) => void;
}

export function UserList({ onUserSelect }: UserListProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    // Query for users that are not the current user
    return query(collection(firestore, 'users'), where('id', '!=', currentUser.uid));
  }, [firestore, currentUser]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  return (
    <div className="flex h-full flex-col">
        <CardHeader>
            <CardTitle>Mulai Percakapan</CardTitle>
            <CardDescription>Pilih pengguna untuk diajak chat.</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-1 px-4">
            <div className="flex flex-col gap-2 py-4">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                ))}
                {users && users.length > 0 ? (
                    users.map((user) => (
                    <div
                        key={user.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-accent"
                        onClick={() => onUserSelect(user)}
                    >
                        <Avatar>
                        <AvatarImage src={user.profilePictureUrl} />
                        <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                    </div>
                    ))
                ) : (
                    !isLoading && <p className="text-sm text-muted-foreground text-center">Tidak ada pengguna lain.</p>
                )}
            </div>
        </ScrollArea>
    </div>
  );
}

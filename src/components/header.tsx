'use client';

import { LogOut, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import KassaKilatIcon from '@/app/icon.svg';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import {
  useUser,
  useAuth as useFirebaseAuth,
  useFirestore,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc(userProfileRef);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const displayName =
    userProfile?.username || user?.displayName || user?.email || 'User';
  const photoURL = userProfile?.profilePictureUrl || user?.photoURL;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src={KassaKilatIcon}
          alt="Ikon 店"
          width={32}
          height={32}
        />
        <h1 className="hidden text-xl font-semibold font-headline text-primary sm:block">
          店
        </h1>
      </Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {isUserLoading || isProfileLoading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="hidden h-4 w-20 sm:inline" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={photoURL ?? undefined} alt={displayName} />
              <AvatarFallback>
                {displayName?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Halo, {displayName}
            </span>
          </div>
        ) : null}
        <Link href="/products">
          <Button variant="ghost" size="icon" aria-label="Products">
            <Package className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

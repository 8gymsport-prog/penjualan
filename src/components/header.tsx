"use client";

import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import KassaKilatIcon from "@/app/icon.svg";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { useUser, useAuth as useFirebaseAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";


export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        router.push('/login');
    }
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src={KassaKilatIcon} alt="Kassa Kilat Icon" width={32} height={32} />
        <h1 className="text-xl font-semibold font-headline text-primary hidden sm:block">
          Kassa Kilat
        </h1>
      </Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {isUserLoading ? (
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-8 rounded-full" />
             <Skeleton className="h-4 w-20 hidden sm:inline" />
           </div>
        ) : user ? (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.email ?? ''} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:inline">Halo, {user.email}</span>
            </div>
        ) : null}
        <Link href="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" />
            </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

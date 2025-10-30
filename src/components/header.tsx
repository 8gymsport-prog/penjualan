"use client";

import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import KassaKilatIcon from "@/app/icon.svg";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

export function Header() {
  const { logout, user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src={KassaKilatIcon} alt="Kassa Kilat Icon" width={32} height={32} />
        <h1 className="text-xl font-semibold font-headline text-primary hidden sm:block">
          Kassa Kilat
        </h1>
      </Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {isClient && user ? (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:inline">Halo, {user.username}</span>
            </div>
        ) : isClient ? null : (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20 hidden sm:inline" />
          </div>
        )}
        <Link href="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" />
            </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

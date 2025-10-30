"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import KassaKilatIcon from "@/app/icon.svg";

export function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <Image src={KassaKilatIcon} alt="Kassa Kilat Icon" width={32} height={32} />
        <h1 className="text-xl font-semibold font-headline text-primary">
          Kassa Kilat
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {user && <span className="text-sm text-muted-foreground hidden sm:inline">Halo, {user.username}</span>}
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

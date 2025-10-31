"use client";

import { useState } from "react";
import { useAuth, useFirebase } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus } from "lucide-react";
import KassaKilatIcon from "@/app/icon.svg";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@kassa.kilat");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: "Pendaftaran Berhasil",
          description: "Akun Anda telah dibuat. Silakan masuk.",
        });
        setIsSignUp(false); // Switch to login view after successful sign up
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Login Berhasil",
          description: "Selamat datang kembali!",
        });
        // Redirect handled by AuthProvider/useUser hook in layout/page
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: error.message || "Email atau password salah.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Image
                src={KassaKilatIcon}
                alt="Kassa Kilat Icon"
                width={40}
                height={40}
              />
            </div>
            <CardTitle className="text-3xl font-headline text-primary">
              Kassa Kilat
            </CardTitle>
            <CardDescription>
              {isSignUp ? "Buat akun baru Anda." : "Masuk untuk mengelola penjualan Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="anda@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Memproses..."
                : isSignUp
                ? "Daftar"
                : "Masuk"}
              {!isLoading && (isSignUp ? <UserPlus className="ml-2 h-4 w-4" /> : <LogIn className="ml-2 h-4 w-4" />)}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? "Sudah punya akun? Masuk"
                : "Belum punya akun? Daftar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

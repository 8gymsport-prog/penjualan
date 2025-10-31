"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth as useFirebaseAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Lock, Camera } from "lucide-react";
import { updatePassword, updateProfile } from "firebase/auth";


export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
     if (user) {
      setUsername(user.displayName || user.email || "");
      setPhoto(user.photoURL || undefined);
    }
  }, [user, isUserLoading, router]);
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth?.currentUser) return;
    
    try {
        await updateProfile(auth.currentUser, { displayName: username, photoURL: photo });
        toast({
            title: "Sukses",
            description: "Profil berhasil diperbarui.",
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Gagal memperbarui profil.",
        });
    }
  };

  const handleUpdatePassword = async () => {
     if (!auth?.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password baru tidak cocok.",
      });
      return;
    }
    if (newPassword.length < 6) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Password baru minimal 6 karakter.",
        });
        return;
    }

    try {
        await updatePassword(auth.currentUser, newPassword);
        toast({
            title: "Sukses",
            description: "Password berhasil diperbarui.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Gagal memperbarui password. Anda mungkin perlu login ulang.",
        });
    }
  };
  
  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
           <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <h2 className="text-2xl font-bold font-headline tracking-tight">
          Pengaturan Akun
        </h2>
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserIcon/> Edit Profil</CardTitle>
                    <CardDescription>Perbarui username dan foto profil Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Foto Profil</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={photo} />
                                <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="max-w-xs"/>
                        </div>
                    </div>
                    <Button onClick={handleUpdateProfile}>Simpan Profil</Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock/> Ubah Password</CardTitle>
                    <CardDescription>Ubah password masuk Anda secara berkala untuk keamanan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Password Baru</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <Button onClick={handleUpdatePassword}>Simpan Password</Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

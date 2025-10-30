"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Lock, Camera } from "lucide-react";

export default function SettingsPage() {
  const { isAuthenticated, user, updateUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(user?.photoURL);
  
  useEffect(() => {
    setIsClient(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
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

  const handleUpdateUsername = () => {
    if (username.length < 2) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Username harus lebih dari 2 karakter.",
        });
        return;
    }
    updateUser({ username });
    toast({
        title: "Sukses",
        description: "Username berhasil diperbarui.",
    });
  };

  const handleUpdatePassword = () => {
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
    // In a real app, you'd verify the currentPassword against the backend
    toast({
        title: "Sukses",
        description: "Password berhasil diperbarui (simulasi).",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleUpdatePhoto = () => {
    updateUser({ photoURL: photo });
    toast({
        title: "Sukses",
        description: "Foto profil berhasil diperbarui.",
    });
  };
  
  if (!isClient || !isAuthenticated) {
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
            {/* Edit Profile Picture */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Camera/> Ubah Foto Profil</CardTitle>
                    <CardDescription>Perbarui foto profil Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={photo} />
                            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="max-w-xs"/>
                    </div>
                    <Button onClick={handleUpdatePhoto}>Simpan Foto</Button>
                </CardContent>
            </Card>

            {/* Edit Username */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserIcon/> Ubah Username</CardTitle>
                    <CardDescription>Ubah username yang akan ditampilkan di aplikasi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <Button onClick={handleUpdateUsername}>Simpan Username</Button>
                </CardContent>
            </Card>
            
            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock/> Ubah Password</CardTitle>
                    <CardDescription>Ubah password masuk Anda secara berkala untuk keamanan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="current-password">Password Saat Ini</Label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
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
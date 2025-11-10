'use client';

import { useEffect, useState, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Lock, Camera, Moon, Sun, Trash2, ShieldX } from 'lucide-react';
import { updatePassword, updateProfile, deleteUser as deleteAuthUser } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop
): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('Failed to get canvas context'));
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/jpeg'));
  });
}

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

  const [crop, setCrop] = useState<Crop>();
  const [src, setSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || user?.email || '');
      setPhoto(userProfile.profilePictureUrl || undefined);
    } else if (user) {
      setUsername(user.displayName || user.email || '');
      setPhoto(user.photoURL || undefined);
    }
  }, [userProfile, user]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
    }
  };

  const handleCropImage = async () => {
    if (imgRef.current && crop?.width && crop?.height) {
      const croppedImageUrl = await getCroppedImg(imgRef.current, crop);
      setPhoto(croppedImageUrl);
      setIsCropModalOpen(false);
      setSrc(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth?.currentUser || !firestore) return;

    setIsUpdating(true);
    try {
      
      // We don't update Firebase Auth profile photoURL due to length limits.
      // We only update displayName in Auth, and username/photo in Firestore.
      if(auth.currentUser.displayName !== username) {
        await updateProfile(auth.currentUser, { displayName: username });
      }

      // Automatically assign 'superadmin' role to 'Rakarmp'
      const userRole = username === 'Rakarmp' ? 'superadmin' : userProfile?.role || 'user';

      // Update Firestore document with username, new photo, and role
      const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
      await setDoc(
        userDocRef,
        {
          id: auth.currentUser.uid,
          username: username,
          email: auth.currentUser.email, // Make sure email is saved
          profilePictureUrl: photo,
          role: userRole,
        },
        { merge: true }
      );

      toast({
        title: 'Sukses',
        description: 'Profil berhasil diperbarui.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Gagal memperbarui profil.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth?.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password baru tidak cocok.',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password baru minimal 6 karakter.',
      });
      return;
    }
    setIsUpdating(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast({
        title: 'Sukses',
        description: 'Password berhasil diperbarui.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memperbarui password. Anda mungkin perlu login ulang.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser || !firestore) return;
    setIsUpdating(true);
    try {
        const userId = auth.currentUser.uid;
        // Delete Firestore document first
        await deleteDoc(doc(firestore, 'users', userId));
        // Then delete the auth user
        await deleteAuthUser(auth.currentUser);

        toast({
            title: 'Akun Dihapus',
            description: 'Akun Anda telah berhasil dihapus secara permanen.',
        });
        // The auth state listener in the provider will handle the redirect to /login
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Gagal Menghapus Akun',
            description: 'Terjadi kesalahan. Anda mungkin perlu login ulang terlebih dahulu.',
        });
        setIsUpdating(false);
    }
  };

  if (isUserLoading || isProfileLoading || !user) {
    return (
       <div className="flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Pengaturan
        </h2>
        <div className="grid gap-8">
          <Card className="transparent-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserIcon className="text-primary" />
                <span>Edit Profil</span>
              </CardTitle>
              <CardDescription>
                Perbarui username dan foto profil Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label>Foto Profil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary/50">
                    <AvatarImage src={photo} />
                    <AvatarFallback className="bg-secondary text-lg">
                      {username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={onSelectFile}
                      className="hidden"
                    />
                    <Button asChild variant="outline">
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Ganti Foto
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
             <CardFooter>
                 <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                    {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </Button>
            </CardFooter>
          </Card>
          
          <Card className="transparent-card">
            <CardHeader>
               <CardTitle className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="text-purple-400"/> : <Sun className="text-yellow-400"/>}
                <span>Tampilan</span>
              </CardTitle>
              <CardDescription>
                Sesuaikan tampilan aplikasi sesuai preferensi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                  <span>Mode Gelap</span>
                  <span className="font-normal text-muted-foreground">
                    Nikmati skema warna yang lebih teduh.
                  </span>
                </Label>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>


          <Card className="transparent-card">
            <CardHeader>
               <CardTitle className="flex items-center gap-3">
                <Lock className="text-accent"/>
                <span>Ubah Password</span>
              </CardTitle>
              <CardDescription>
                Ubah password masuk Anda secara berkala untuk keamanan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Konfirmasi Password Baru
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Ketik ulang password baru Anda"
                />
              </div>
            </CardContent>
             <CardFooter>
                <Button onClick={handleUpdatePassword} disabled={isUpdating}>
                    {isUpdating ? 'Menyimpan...' : 'Simpan Password Baru'}
                </Button>
            </CardFooter>
          </Card>
          
           <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-destructive">
                <ShieldX /> Zona Berbahaya
              </CardTitle>
              <CardDescription className="text-destructive/80">
                Tindakan di bawah ini bersifat permanen dan tidak dapat diurungkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                    <p className="font-semibold text-destructive">Hapus Akun Anda</p>
                    <p className="text-sm text-destructive/70">Semua data Anda akan dihapus secara permanen.</p>
                </div>
                <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)} disabled={isUpdating}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Akun Saya
                </Button>
            </CardContent>
          </Card>

        </div>
      </main>

      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Potong Gambar</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
            {src && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={src}
                  alt="Source"
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.currentTarget;
                    const side = Math.min(naturalWidth, naturalHeight, 400);
                    const x = (naturalWidth - side) / 2;
                    const y = (naturalHeight - side) / 2;
                    setCrop({
                      unit: 'px',
                      x,
                      y,
                      width: side,
                      height: side,
                    });
                  }}
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleCropImage}>Terapkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
            Tindakan ini tidak dapat diurungkan. Ini akan menghapus akun beserta seluruh data Anda secara permanen.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
             onClick={handleDeleteAccount}>
             Ya, Hapus Akun Saya
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

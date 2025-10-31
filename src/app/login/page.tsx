'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus } from 'lucide-react';
import KassaKilatIcon from '@/app/icon.svg';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If the user is already logged in, redirect them to the dashboard.
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = async () => {
    if (!auth || !firestore) return;
    if (username.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Pendaftaran Gagal',
        description: 'Username minimal 3 karakter.',
      });
      return;
    }

    // Check if username already exists
    const usernameQuery = query(collection(firestore, 'users'), where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
      toast({
        variant: 'destructive',
        title: 'Pendaftaran Gagal',
        description: 'Username ini sudah digunakan. Silakan pilih yang lain.',
      });
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    // Save user profile with username
    await setDoc(doc(firestore, 'users', newUser.uid), {
      id: newUser.uid,
      username: username,
      email: newUser.email, // Storing email for potential future use
    });

    toast({
      title: 'Pendaftaran Berhasil',
      description: 'Akun Anda telah dibuat. Silakan masuk.',
    });
    setIsSignUp(false); // Switch to login view after successful sign up
  };

  const handleSignIn = async () => {
     if (!auth || !firestore) return;
     let userEmail = email; // Assume input is an email by default

     // If input doesn't contain '@', it's a username, so we need to find the email
     if (!email.includes('@')) {
        const usernameQuery = query(collection(firestore, 'users'), where('username', '==', email));
        const querySnapshot = await getDocs(usernameQuery);
        
        if (querySnapshot.empty) {
          throw new Error('auth/user-not-found');
        }
        
        // Assuming usernames are unique, get the first result
        const userData = querySnapshot.docs[0].data();
        userEmail = userData.email;
     }

     await signInWithEmailAndPassword(auth, userEmail, password);
     toast({
        title: 'Login Berhasil',
        description: 'Selamat datang kembali!',
     });
     // The useEffect will now handle the redirection
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.message === 'auth/user-not-found') {
        errorMessage = 'Email/Username atau password yang Anda masukkan salah.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Don't render the login form if we are still checking the user's auth state
  // or if the user is already logged in (and the redirect is in progress).
  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Image
                src={KassaKilatIcon}
                alt="Ikon 店"
                width={40}
                height={40}
              />
            </div>
            <CardTitle className="text-3xl font-headline text-primary">
              店
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Buat akun baru Anda.'
                : 'Masuk untuk mengelola penjualan Anda.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="pilih username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{isSignUp ? 'Email' : 'Email atau Username'}</Label>
              <Input
                id="email"
                type="text"
                placeholder={isSignUp ? 'anda@email.com' : 'email atau username anda'}
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
                ? 'Memproses...'
                : isSignUp
                ? 'Daftar'
                : 'Masuk'}
              {!isLoading &&
                (isSignUp ? (
                  <UserPlus className="ml-2 h-4 w-4" />
                ) : (
                  <LogIn className="ml-2 h-4 w-4" />
                ))}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? 'Sudah punya akun? Masuk'
                : 'Belum punya akun? Daftar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

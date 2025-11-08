'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
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
import { LogIn, UserPlus, KeyRound, AtSign, User } from 'lucide-react';
import KassaKilatIcon from '@/app/icon.svg';
import Image from 'next/image';
import Link from 'next/link';

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
    setIsLoading(true);
    if (username.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Pendaftaran Gagal',
        description: 'Username minimal 3 karakter.',
      });
      setIsLoading(false);
      return;
    }

    // Check if username already exists
    const usersCol = collection(firestore, 'users');
    const usernameQuery = query(usersCol, where('username', '==', username));
    
    try {
        const usernameSnapshot = await getDocs(usernameQuery);

        if (!usernameSnapshot.empty) {
          toast({
            variant: 'destructive',
            title: 'Pendaftaran Gagal',
            description: 'Username ini sudah digunakan. Silakan pilih yang lain.',
          });
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        // Save user profile with username
        await setDoc(doc(firestore, 'users', newUser.uid), {
          id: newUser.uid,
          username: username,
          email: newUser.email,
        });

        toast({
          title: 'Pendaftaran Berhasil',
          description: 'Akun Anda telah dibuat. Silakan masuk.',
        });
        setIsSignUp(false); // Switch to login view after successful sign up
    } catch (error: any) {
         let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
          } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
          }
          toast({
            variant: 'destructive',
            title: 'Pendaftaran Gagal',
            description: errorMessage,
          });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
     if (!auth || !firestore) return;
     setIsLoading(true);
     let userEmail = email; // Assume input is an email by default

     // If input doesn't contain '@', it's a username, so we need to find the email
     if (!email.includes('@')) {
        const usersCol = collection(firestore, 'users');
        const usernameQuery = query(usersCol, where('username', '==', email));
        
        try {
            const querySnapshot = await getDocs(usernameQuery);
            if (querySnapshot.empty) {
              // We throw a specific string to be caught and translated to the user.
              throw new Error('auth/user-not-found');
            }
            
            const userData = querySnapshot.docs[0].data();
            userEmail = userData.email;

            await signInWithEmailAndPassword(auth, userEmail, password);
            toast({
                title: 'Login Berhasil',
                description: 'Selamat datang kembali!',
            });
            // The useEffect will now handle the redirection
        } catch(error: any) {
            let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
             if (error.code === 'auth/invalid-credential' || error.message === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Email/Username atau password yang Anda masukkan salah.';
            } else {
                 const permissionError = new FirestorePermissionError({
                    path: usersCol.path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                errorMessage = 'Gagal mencari pengguna. Periksa aturan keamanan Anda.'
            }
             toast({
                variant: 'destructive',
                title: 'Login Gagal',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
     } else {
        // Sign in with email
        try {
            await signInWithEmailAndPassword(auth, userEmail, password);
            toast({
                title: 'Login Berhasil',
                description: 'Selamat datang kembali!',
            });
        } catch (error: any) {
            let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Email/Username atau password yang Anda masukkan salah.';
            }
             toast({
                variant: 'destructive',
                title: 'Login Gagal',
                description: errorMessage,
            });
        } finally {
             setIsLoading(false);
        }
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
        await handleSignUp();
    } else {
        await handleSignIn();
    }
  };
  
  // Don't render the login form if we are still checking the user's auth state
  // or if the user is already logged in (and the redirect is in progress).
  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 font-body">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--background)),transparent)]"></div></div>
      <main className="flex w-full flex-col items-center justify-center">
        <Card className="w-full max-w-sm border-2 shadow-2xl shadow-primary/10">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">
                {isSignUp ? 'Buat Akun' : 'Selamat Datang'}
              </CardTitle>
              <CardDescription className="font-semibold text-muted-foreground">
                {isSignUp
                  ? 'Mulai perjalanan Anda bersama kami.'
                  : 'Masuk untuk melanjutkan ke toko Anda.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 font-semibold"
                  />
                </div>
              )}
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder={isSignUp ? 'Email' : 'Email atau Username'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 font-semibold"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 font-semibold"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                {isSignUp ? 'Daftar Sekarang' : 'Masuk'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
                <Button
                  type="button"
                  variant="link"
                  className="p-1 font-bold"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={isLoading}
                >
                  {isSignUp ? 'Masuk di sini' : 'Daftar sekarang'}
                </Button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        Build with Love ❤️ by{' '}
        <Link href="https://github.com/rakarmp" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">
          Rakarmp
        </Link>
      </footer>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { Header } from '@/components/header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profilePictureUrl?: string;
  role?: 'user' | 'superadmin';
}

export default function UserManagementPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const usersQuery = useMemoFirebase(() => {
    // Wait for the profile to load and confirm the user is a superadmin before creating the query.
    if (!firestore || isProfileLoading || currentUserProfile?.role !== 'superadmin') return null;
    return collection(firestore, 'users');
  }, [firestore, currentUserProfile, isProfileLoading]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  useEffect(() => {
    // If auth state is determined and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push('/login');
      return; // Stop further execution
    }
    
    // If profile loading is finished and the user is NOT a superadmin, redirect.
    if (!isUserLoading && !isProfileLoading && currentUserProfile && currentUserProfile.role !== 'superadmin') {
      router.push('/');
    }
  }, [user, isUserLoading, router, currentUserProfile, isProfileLoading]);

  // Combined loading state: show spinner if auth, profile, or user list is loading.
  const isLoading = isUserLoading || isProfileLoading || isLoadingUsers;

  // We need to wait for the profile to load to know if we should render the page or redirect.
  // So, if we are loading, or if the profile isn't loaded yet, show the spinner.
  if (isLoading || !currentUserProfile) {
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

  // After loading, if the user is still not a superadmin (e.g., direct URL access), don't render.
  // The useEffect will handle the redirect, but this prevents a flash of content.
  if (currentUserProfile.role !== 'superadmin') {
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Lihat dan kelola semua akun pengguna terdaftar.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pengguna</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users && users.length > 0 ? (
                            users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={u.profilePictureUrl} />
                                                <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{u.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={u.role === 'superadmin' ? 'default' : 'secondary'}>
                                            {u.role || 'user'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {/* Actions like reset password would go here, but are disabled on client-side */}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Tidak ada pengguna lain yang ditemukan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

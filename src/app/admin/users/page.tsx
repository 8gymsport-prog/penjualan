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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Shield, Trash2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: currentUserProfile, isLoading: isProfileLoading } =
    useDoc(userProfileRef);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || isProfileLoading || currentUserProfile?.role !== 'superadmin')
      return null;
    return collection(firestore, 'users');
  }, [firestore, currentUserProfile, isProfileLoading]);

  const { data: users, isLoading: isLoadingUsers } =
    useCollection<UserProfile>(usersQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }
    if (
      !isUserLoading &&
      !isProfileLoading &&
      currentUserProfile &&
      currentUserProfile.role !== 'superadmin'
    ) {
      router.push('/');
    }
  }, [user, isUserLoading, router, currentUserProfile, isProfileLoading]);

  const handleRoleChange = async (targetUser: UserProfile, newRole: 'user' | 'superadmin') => {
    if (!firestore || !user || targetUser.id === user.uid) {
        toast({
            variant: "destructive",
            title: "Aksi Ditolak",
            description: "Anda tidak dapat mengubah role akun Anda sendiri.",
        });
        return;
    };
    const userDocRef = doc(firestore, 'users', targetUser.id);
    try {
        await updateDoc(userDocRef, { role: newRole });
        toast({
            title: "Sukses",
            description: `Role ${targetUser.username} telah diubah menjadi ${newRole}.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Gagal mengubah role pengguna.",
        });
    }
  };

  const openDeleteDialog = (targetUser: UserProfile) => {
    if (targetUser.id === user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Aksi Ditolak',
        description: 'Anda tidak dapat menghapus akun Anda sendiri.',
      });
      return;
    }
    setUserToDelete(targetUser);
  };
  
  const handleDeleteUser = async () => {
    if (!firestore || !userToDelete) return;
    const userDocRef = doc(firestore, 'users', userToDelete.id);
    try {
      await deleteDoc(userDocRef);
      toast({
        title: 'Sukses',
        description: `Pengguna ${userToDelete.username} telah dihapus.`,
      });
      setUserToDelete(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus pengguna.',
      });
      setUserToDelete(null);
    }
  };

  const isLoading = isUserLoading || isProfileLoading || isLoadingUsers;

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

  if (currentUserProfile.role !== 'superadmin') {
    return null;
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Pengguna</CardTitle>
              <CardDescription>
                Lihat dan kelola semua akun pengguna terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
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
                              <AvatarFallback>
                                {u.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{u.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === 'superadmin' ? 'default' : 'secondary'
                            }
                          >
                            {u.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Buka menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(u, u.role === 'superadmin' ? 'user' : 'superadmin')}
                                disabled={u.id === user?.uid}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Jadikan {u.role === 'superadmin' ? 'User' : 'Super Admin'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openDeleteDialog(u)}
                                disabled={u.id === user?.uid}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus Pengguna</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

       <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data pengguna <strong>{userToDelete?.username}</strong> secara permanen dari Firestore. Ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Ya, Hapus Pengguna</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

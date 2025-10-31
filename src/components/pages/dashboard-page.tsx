'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, Product } from '@/lib/types';
import { SalesOverview } from '@/components/dashboard/sales-overview';
import { TransactionForm } from '@/components/dashboard/transaction-form';
import { TransactionsTable } from '@/components/dashboard/transactions-table';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  Timestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { v4 as uuidv4 } from 'uuid';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'transactions'),
      where(
        'timestamp',
        '>=',
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      )
    );
  }, [firestore, user]);

  const { data: transactions, isLoading: isLoadingTransactions } =
    useCollection<Transaction>(transactionsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'products');
  }, [firestore, user]);

  const { data: products, isLoading: isLoadingProducts } =
    useCollection<Product>(productsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const addTransaction = (
    newTransactionData: Omit<
      Transaction,
      'id' | 'timestamp' | 'total' | 'userId'
    >
  ) => {
    if (!firestore || !user) return;
    setIsProcessing(true);

    const selectedProduct = products?.find(
      (p) => p.id === newTransactionData.productId
    );

    if (!selectedProduct) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Produk yang dipilih tidak valid.',
      });
      setIsProcessing(false);
      return;
    }

    const transactionId = uuidv4();
    const newTransaction = {
      ...newTransactionData,
      id: transactionId,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      userId: user.uid,
      timestamp: Timestamp.now().toMillis().toString(),
      total: newTransactionData.quantity * selectedProduct.price,
    };

    const transactionRef = doc(
      firestore,
      'users',
      user.uid,
      'transactions',
      transactionId
    );

    setDoc(transactionRef, newTransaction)
      .then(() => {
        toast({
          title: 'Transaksi Ditambahkan',
          description: `${newTransaction.productName} berhasil ditambahkan.`,
        });
      })
      .catch((err) => {
        console.error(err);
        const permissionError = new FirestorePermissionError({
          path: transactionRef.path,
          operation: 'create',
          requestResourceData: newTransaction,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal menambahkan transaksi.',
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const clearTransactions = async () => {
    if (!firestore || !user || !transactions || transactions.length === 0)
      return;

    try {
      const transactionsCol = collection(
        firestore,
        'users',
        user.uid,
        'transactions'
      );
      const querySnapshot = await getDocs(
        query(
          transactionsCol,
          where(
            'timestamp',
            '>=',
            new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          )
        )
      );

      const batch = writeBatch(firestore);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      toast({
        title: 'Riwayat Dihapus',
        description: 'Semua transaksi hari ini telah berhasil dihapus.',
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus riwayat transaksi.',
      });
    }
  };

  if (isUserLoading || !user || isLoadingTransactions || isLoadingProducts) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <Skeleton className="h-60" />
            </div>
            <div className="xl:col-span-3">
              <Skeleton className="h-80" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <h2 className="text-2xl font-bold font-headline tracking-tight">
          Dashboard Penjualan
        </h2>
        <div className="flex flex-col gap-4 md:gap-8">
          <SalesOverview transactions={transactions || []} />
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <TransactionForm
                addTransaction={addTransaction}
                isProcessing={isProcessing}
                products={products || []}
              />
            </div>
            <div className="xl:col-span-3">
              <TransactionsTable
                transactions={transactions || []}
                clearTransactions={clearTransactions}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

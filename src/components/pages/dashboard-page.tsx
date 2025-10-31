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
import useLocalStorage from '@/hooks/use-local-storage';
import type { Transaction, Product } from '@/lib/types';
import { SalesOverview } from '@/components/dashboard/sales-overview';
import { TransactionForm } from '@/components/dashboard/transaction-form';
import { TransactionsTable } from '@/components/dashboard/transactions-table';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  collection,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [isProcessing, setIsProcessing] = useState(false);

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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (transactions.length > 0) {
        e.preventDefault();
        // returnValue is required for Chrome
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [transactions]);

  const addTransaction = (
    newTransactionData: Omit<
      Transaction,
      'id' | 'timestamp' | 'total' | 'userId' | 'productName' | 'price'
    >
  ) => {
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

    const newTransaction: Transaction = {
      ...newTransactionData,
      id: uuidv4(),
      productName: selectedProduct.name,
      price: selectedProduct.price,
      userId: user!.uid,
      timestamp: Date.now().toString(),
      total: newTransactionData.quantity * selectedProduct.price,
    };
    
    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
    
    toast({
      title: 'Transaksi Ditambahkan',
      description: `${newTransaction.productName} berhasil ditambahkan.`,
    });

    setIsProcessing(false);
  };

  const clearTransactions = async () => {
    setTransactions([]);
    toast({
      title: 'Riwayat Dihapus',
      description: 'Semua transaksi hari ini telah berhasil dihapus.',
    });
  };

  if (isUserLoading || !user || isLoadingProducts) {
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
          <SalesOverview transactions={transactions} />
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
                transactions={transactions}
                clearTransactions={clearTransactions}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

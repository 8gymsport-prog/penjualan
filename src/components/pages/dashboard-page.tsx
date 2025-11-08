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
import type { Transaction, Product, Payment } from '@/lib/types';
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

    const totalAmount = newTransactionData.quantity * selectedProduct.price;

    const newTransaction: Transaction = {
      ...newTransactionData,
      id: uuidv4(),
      productName: selectedProduct.name,
      price: selectedProduct.price,
      userId: user!.uid,
      timestamp: Date.now().toString(),
      total: totalAmount,
    };
    
    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
    
    toast({
      title: 'Transaksi Ditambahkan',
      description: `${newTransaction.productName} berhasil ditambahkan.`,
    });

    setIsProcessing(false);
  };
  
  const updateTransaction = (updatedTransaction: Transaction) => {
    const selectedProduct = products?.find(p => p.id === updatedTransaction.productId);
     if (!selectedProduct) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Produk yang dipilih tidak valid.',
      });
      return;
    }

    const transactionWithDetails: Transaction = {
        ...updatedTransaction,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        total: selectedProduct.price * updatedTransaction.quantity
    };

    setTransactions(prev => 
        prev.map(t => t.id === transactionWithDetails.id ? transactionWithDetails : t)
    );
    toast({
        title: "Transaksi Diperbarui",
        description: "Detail transaksi telah berhasil disimpan."
    });
  };

  const clearTransactions = async () => {
    setTransactions([]);
    toast({
      title: 'Riwayat Dihapus',
      description: 'Semua transaksi hari ini telah berhasil dihapus.',
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({
        title: 'Transaksi Dihapus',
        description: 'Transaksi telah dihapus dari riwayat.',
    });
  };

  if (isUserLoading || !user || isLoadingProducts) {
    return (
      <>
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Skeleton className="h-8 w-64 bg-slate-200/80" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28 bg-slate-200/80" />
              <Skeleton className="h-28 bg-slate-200/80" />
              <Skeleton className="h-28 bg-slate-200/80" />
              <Skeleton className="h-28 bg-slate-200/80" />
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <div className="xl:col-span-3">
                <Skeleton className="h-60 bg-slate-200/80" />
              </div>
              <div className="xl:col-span-3">
                <Skeleton className="h-80 bg-slate-200/80" />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
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
                  products={products || []}
                  updateTransaction={updateTransaction}
                  clearTransactions={clearTransactions}
                  deleteTransaction={deleteTransaction}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

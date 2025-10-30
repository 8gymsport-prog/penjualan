"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import useLocalStorage from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/types";
import { SalesOverview } from "@/components/dashboard/sales-overview";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const addTransaction = (newTransactionData: Omit<Transaction, 'id' | 'timestamp' | 'total'>) => {
    setIsProcessing(true);
    setTimeout(() => {
        const newTransaction: Transaction = {
            ...newTransactionData,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            total: newTransactionData.quantity * newTransactionData.price,
        };
        setTransactions(prev => [newTransaction, ...prev]);
        toast({
            title: "Transaksi Ditambahkan",
            description: `${newTransaction.productName} berhasil ditambahkan.`,
        });
        setIsProcessing(false);
    }, 500);
  };

  const clearTransactions = () => {
    setTransactions([]);
    toast({
        title: "Riwayat Dihapus",
        description: "Semua transaksi telah berhasil dihapus.",
    });
  };
  
  if (!isClient || !isAuthenticated) {
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
              <TransactionForm addTransaction={addTransaction} isProcessing={isProcessing} />
            </div>
            <div className="xl:col-span-3">
              <TransactionsTable transactions={transactions} clearTransactions={clearTransactions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

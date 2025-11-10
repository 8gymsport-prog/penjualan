"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction, Product } from "@/lib/types";
import { Trash2, FileText, FileType, Edit } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ReportPreviewDialog } from "./report-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { exportToPdf } from "@/lib/reports";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from 'firebase/firestore';
import { EditTransactionDialog } from "./edit-transaction-dialog";


interface TransactionsTableProps {
  transactions: Transaction[];
  products: Product[];
  clearTransactions: () => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

export function TransactionsTable({ transactions, products, clearTransactions, deleteTransaction, updateTransaction }: TransactionsTableProps) {
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const handleClear = () => {
    clearTransactions();
    setIsClearAlertOpen(false);
  }

  const openDeleteConfirm = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteAlertOpen(true);
  }

  const handleDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
    }
    setIsDeleteAlertOpen(false);
    setTransactionToDelete(null);
  }
  
  const handleExport = () => {
    const username = userProfile?.username || user?.displayName || "Pengguna";
    exportToPdf(transactions, username);
  }

  const handleOpenEditDialog = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsEditDialogOpen(true);
  }

  const handleSaveEdit = (updatedTransaction: Transaction) => {
    updateTransaction(updatedTransaction);
    setIsEditDialogOpen(false);
    setTransactionToEdit(null);
  }

  return (
    <>
    <Card className="transparent-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle className="font-headline text-xl">Riwayat Transaksi Hari Ini</CardTitle>
                <CardDescription>Daftar semua penjualan yang tercatat hari ini.</CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} disabled={transactions.length === 0}>
                    <FileText className="mr-2 h-4 w-4" />
                    Preview Laporan
                 </Button>
                 <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
                    <FileType className="mr-2 h-4 w-4" />
                    Ekspor ke PDF
                 </Button>
                 <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={transactions.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Riwayat
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini akan menghapus semua riwayat transaksi hari ini secara permanen. Data yang sudah dihapus tidak dapat dikembalikan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClear}>Ya, Hapus Semua</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.productName} <span className="text-muted-foreground">x{t.quantity}</span></TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(t.total)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(t.payments) ? t.payments.map((p, index) => (
                        <Badge key={index} variant="secondary">{p.method}</Badge>
                      )) : (
                        <Badge variant="secondary">Tidak diketahui</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(parseInt(t.timestamp)), 'HH:mm:ss')}</TableCell>
                  <TableCell className="text-right space-x-1">
                     <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(t)}>
                        <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(t.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        <span className="sr-only">Hapus</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Belum ada transaksi hari ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
       <ReportPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        transactions={transactions}
      />
    </Card>

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi Ini?</AlertDialogTitle>
            <AlertDialogDescription>
            Tindakan ini tidak dapat diurungkan. Ini akan menghapus transaksi ini dari riwayat Anda.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Ya, Hapus</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    {transactionToEdit && (
      <EditTransactionDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        transaction={transactionToEdit}
        products={products}
        onSave={handleSaveEdit}
      />
    )}
    </>
  );
}

"use client";

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
import type { Transaction } from "@/lib/types";
import { downloadFile, generateCsvReport, generateTxtReport } from "@/lib/reports";
import { FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";

interface TransactionsTableProps {
  transactions: Transaction[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

export function TransactionsTable({ transactions }: TransactionsTableProps) {

  const handleDownloadTxt = () => {
    const txtContent = generateTxtReport(transactions);
    const fileName = `laporan_penjualan_${format(new Date(), "yyyy-MM-dd")}.txt`;
    downloadFile(txtContent, fileName, "text/plain");
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsvReport(transactions);
    const fileName = `laporan_penjualan_${format(new Date(), "yyyy-MM-dd")}.csv`;
    downloadFile(csvContent, fileName, "text/csv");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle className="font-headline text-lg">Riwayat Transaksi</CardTitle>
                <CardDescription>Daftar semua penjualan yang tercatat hari ini.</CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
                    <FileText className="mr-2 h-4 w-4" />
                    TXT
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                </Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.productName} <span className="text-muted-foreground">x{t.quantity}</span></TableCell>
                  <TableCell className="text-right">{formatCurrency(t.total)}</TableCell>
                  <TableCell>{t.paymentMethod}</TableCell>
                  <TableCell>{format(new Date(t.timestamp), 'HH:mm:ss')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Belum ada transaksi hari ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}

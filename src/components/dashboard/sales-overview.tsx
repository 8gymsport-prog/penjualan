"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, QrCode, Wallet, Landmark } from "lucide-react";
import type { Transaction } from "@/lib/types";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

export function SalesOverview({ transactions }: SalesOverviewProps) {
  const summary = useMemo(() => {
    const initialState = {
      totalSales: 0,
      tunai: 0,
      qr: 0,
      transfer: 0,
    };

    if (!transactions) {
      return initialState;
    }

    return transactions.reduce((acc, t) => {
      acc.totalSales += t.total;
      if (t.payments) {
        t.payments.forEach(p => {
          if (p.method === "Tunai") acc.tunai += p.amount;
          if (p.method === "QR") acc.qr += p.amount;
          if (p.method === "Transfer") acc.transfer += p.amount;
        });
      }
      return acc;
    }, initialState);
  }, [transactions]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline text-primary">
            {formatCurrency(summary.totalSales)}
          </div>
          <p className="text-xs text-muted-foreground">Total pendapatan hari ini</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tunai</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline text-primary">
            {formatCurrency(summary.tunai)}
          </div>
          <p className="text-xs text-muted-foreground">Total pembayaran tunai</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">QR Code</CardTitle>
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline text-primary">
            {formatCurrency(summary.qr)}
          </div>
           <p className="text-xs text-muted-foreground">Total pembayaran QR</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transfer</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline text-primary">
            {formatCurrency(summary.transfer)}
          </div>
          <p className="text-xs text-muted-foreground">Total pembayaran transfer</p>
        </CardContent>
      </Card>
    </div>
  );
}

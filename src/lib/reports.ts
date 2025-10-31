import type { Transaction, PaymentMethod } from "./types";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  // Use a simpler format like 45k
  if (amount >= 1000) {
    return `${amount / 1000}k`;
  }
  return amount.toString();
};

const formatCurrencyWithIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };


export const generateTxtReport = (transactions: Transaction[]): string => {
  const now = new Date();
  let content = `Laporan Penjualan - 店\n`;
  content += `Tanggal Cetak: ${format(now, "yyyy-MM-dd HH:mm:ss")}\n\n`;

  // Group transactions by product
  const grouped: Record<string, { quantity: number; total: number; price: number, productName: string }> = {};
  transactions.forEach((t) => {
    if (!grouped[t.productId]) {
      grouped[t.productId] = {
        quantity: 0,
        total: 0,
        price: t.price,
        productName: t.productName,
      };
    }
    grouped[t.productId].quantity += t.quantity;
    grouped[t.productId].total += t.total;
  });


  // Rows from grouped transactions
  Object.values(grouped).forEach((p, index) => {
     content +=
      `${index + 1}. ${p.productName} = ${p.quantity}x${formatCurrency(p.price)}=${formatCurrency(p.total)}\n`;
  });

  // Summary
  const summary: Record<PaymentMethod, number> = { Tunai: 0, QR: 0, Transfer: 0 };
  let grandTotal = 0;

  transactions.forEach((t) => {
    summary[t.paymentMethod] += t.total;
    grandTotal += t.total;
  });

  content += "\n";
  content += `Total = ${formatCurrencyWithIDR(grandTotal)}\n\n`;

  if (summary.Tunai > 0) content += `Tunai = ${formatCurrencyWithIDR(summary.Tunai)}\n`;
  if (summary.QR > 0) content += `QR = ${formatCurrencyWithIDR(summary.QR)}\n`;
  if (summary.Transfer > 0) content += `Transfer = ${formatCurrencyWithIDR(summary.Transfer)}\n`;

  return content;
};

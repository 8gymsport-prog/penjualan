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
  let content = `Laporan Penjualan - Kassa Kilat\n`;
  content += `Tanggal Cetak: ${format(now, "yyyy-MM-dd HH:mm:ss")}\n\n`;

  // Rows
  transactions.forEach((t, index) => {
    content +=
      `${index + 1}. ${t.productName} = ${t.quantity}x${formatCurrency(t.price)}=${formatCurrency(t.total)}\n`;
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

export const generateCsvReport = (transactions: Transaction[]): string => {
  const headers = [
    "ID",
    "Timestamp",
    "Nama Produk",
    "Kuantitas",
    "Harga Satuan",
    "Total",
    "Metode Pembayaran",
  ];
  let csvContent = headers.join(",") + "\n";

  transactions.forEach((t) => {
    const row = [
      t.id,
      `"${format(new Date(t.timestamp), "yyyy-MM-dd HH:mm:ss")}"`,
      `"${t.productName}"`,
      t.quantity,
      t.price,
      t.total,
      t.paymentMethod,
    ];
    csvContent += row.join(",") + "\n";
  });

  return csvContent;
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
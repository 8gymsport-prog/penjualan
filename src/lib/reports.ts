import type { Transaction, PaymentMethod } from "./types";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const padEnd = (str: string, length: number) => {
  return str.padEnd(length, " ");
};

const padStart = (str: string, length: number) => {
    return str.padStart(length, " ");
};

export const generateTxtReport = (transactions: Transaction[]): string => {
  const now = new Date();
  let content = `Laporan Penjualan - Kassa Kilat\n`;
  content += `Tanggal Cetak: ${format(now, "yyyy-MM-dd HH:mm:ss")}\n\n`;

  const line = "=".repeat(80) + "\n";
  content += line;
  content += padStart("DETAIL TRANSAKSI", 49) + "\n";
  content += line;

  // Header
  content +=
    padEnd("Waktu", 21) +
    "| " +
    padEnd("Produk", 20) +
    "| " +
    padEnd("Qty", 5) +
    "| " +
    padEnd("Harga", 12) +
    "| " +
    padEnd("Total", 12) +
    "| " +
    "Metode\n";
  content += "-".repeat(80) + "\n";

  // Rows
  transactions.forEach((t) => {
    content +=
      padEnd(format(new Date(t.timestamp), "yyyy-MM-dd HH:mm"), 21) +
      "| " +
      padEnd(t.productName.substring(0, 18), 20) +
      "| " +
      padEnd(t.quantity.toString(), 5) +
      "| " +
      padEnd(formatCurrency(t.price), 12) +
      "| " +
      padEnd(formatCurrency(t.total), 12) +
      "| " +
      t.paymentMethod +
      "\n";
  });

  // Summary
  const summary: Record<PaymentMethod, number> = { Tunai: 0, QR: 0, Transfer: 0 };
  let grandTotal = 0;

  transactions.forEach((t) => {
    summary[t.paymentMethod] += t.total;
    grandTotal += t.total;
  });

  content += "\n" + line;
  content += padStart("RINGKASAN PEMBAYARAN", 51) + "\n";
  content += line;

  content += `Tunai   : ${formatCurrency(summary.Tunai)}\n`;
  content += `QR      : ${formatCurrency(summary.QR)}\n`;
  content += `Transfer: ${formatCurrency(summary.Transfer)}\n`;
  content += "-".repeat(40) + "\n";
  content += `TOTAL PENJUALAN: ${formatCurrency(grandTotal)}\n`;
  content += line;

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

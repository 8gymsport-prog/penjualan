import type { Transaction } from "./types";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

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
  const summary: Record<string, number> = { Tunai: 0, QR: 0, Transfer: 0 };
  let grandTotal = 0;

  transactions.forEach((t) => {
    if (Array.isArray(t.payments)) {
        t.payments.forEach(p => {
            if (!summary[p.method]) summary[p.method] = 0;
            summary[p.method] += p.amount;
        });
    }
    grandTotal += t.total;
  });

  content += "\n";
  content += `Total = ${formatCurrencyWithIDR(grandTotal)}\n\n`;

  if (summary.Tunai > 0) content += `Tunai = ${formatCurrencyWithIDR(summary.Tunai)}\n`;
  if (summary.QR > 0) content += `QR = ${formatCurrencyWithIDR(summary.QR)}\n`;
  if (summary.Transfer > 0) content += `Transfer = ${formatCurrencyWithIDR(summary.Transfer)}\n`;

  return content;
};

export const exportToExcel = (transactions: Transaction[], username: string) => {
    const now = new Date();
    const period = format(now, "MMMM yyyy");
    const fileName = `Laporan_Penjualan_${username}_${format(now, "yyyyMMdd")}.xlsx`;

    const dataForExcel = transactions.map((t, index) => {
        const totalPembayaran = Array.isArray(t.payments) ? t.payments.reduce((acc, p) => acc + p.amount, 0) : 0;
        return {
            "No": index + 1,
            "ID Transaksi": t.id,
            "Nama Produk": t.productName,
            "Total Penjualan": t.total,
            "Pembayaran": totalPembayaran,
            "Saldo Akhir": t.total - totalPembayaran,
            "Waktu": format(new Date(parseInt(t.timestamp)), 'yyyy-MM-dd HH:mm:ss'),
        };
    });

    const totalPenjualan = dataForExcel.reduce((sum, item) => sum + item['Total Penjualan'], 0);
    const totalPembayaran = dataForExcel.reduce((sum, item) => sum + item['Pembayaran'], 0);
    const totalSaldo = dataForExcel.reduce((sum, item) => sum + item['Saldo Akhir'], 0);

    const ws = XLSX.utils.json_to_sheet([]);

    // Add headers and title
    XLSX.utils.sheet_add_aoa(ws, [
        [`Laporan Penjualan - ${username}`],
        [`Periode: ${period}`]
    ], { origin: "A1" });


    // Add table data
    XLSX.utils.sheet_add_json(ws, dataForExcel, { origin: "A4", skipHeader: false });

    // Add total row
    XLSX.utils.sheet_add_aoa(ws, [
        ["", "", "Total", totalPenjualan, totalPembayaran, totalSaldo]
    ], { origin: -1 }); // -1 means append to the end
    
    // Styling and Merging
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Period
    ];

    // Set column widths
    ws['!cols'] = [
        { wch: 5 }, // No
        { wch: 38 }, // ID
        { wch: 20 }, // Nama Produk
        { wch: 15 }, // Total Penjualan
        { wch: 15 }, // Pembayaran
        { wch: 15 }, // Saldo Akhir
        { wch: 20 }, // Waktu
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");
    XLSX.writeFile(wb, fileName);
};

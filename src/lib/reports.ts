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
        const paymentDetails = {
            Tunai: 0,
            QR: 0,
            Transfer: 0
        };

        if (Array.isArray(t.payments)) {
            t.payments.forEach(p => {
                if (p.method in paymentDetails) {
                    paymentDetails[p.method as keyof typeof paymentDetails] += p.amount;
                }
            });
        }
        
        return {
            "No": index + 1,
            "ID Transaksi": t.id,
            "Waktu": format(new Date(parseInt(t.timestamp)), 'yyyy-MM-dd HH:mm:ss'),
            "Nama Produk": t.productName,
            "Kuantitas": t.quantity,
            "Harga Satuan": t.price,
            "Total Penjualan": t.total,
            "Tunai": paymentDetails.Tunai,
            "QR": paymentDetails.QR,
            "Transfer": paymentDetails.Transfer,
        };
    });

    const totalPenjualan = dataForExcel.reduce((sum, item) => sum + item['Total Penjualan'], 0);
    const totalTunai = dataForExcel.reduce((sum, item) => sum + item['Tunai'], 0);
    const totalQR = dataForExcel.reduce((sum, item) => sum + item['QR'], 0);
    const totalTransfer = dataForExcel.reduce((sum, item) => sum + item['Transfer'], 0);
    const totalKuantitas = dataForExcel.reduce((sum, item) => sum + item['Kuantitas'], 0);

    const ws = XLSX.utils.json_to_sheet([]);

    XLSX.utils.sheet_add_aoa(ws, [
        [`Laporan Penjualan - ${username}`],
        [`Periode: ${period}`]
    ], { origin: "A1" });

    XLSX.utils.sheet_add_json(ws, dataForExcel, { origin: "A4", skipHeader: false });
    
    // Add total row at the end
    const totalRow = [
        "", // No
        "", // ID
        "", // Waktu
        "Total", // Nama Produk
        totalKuantitas, // Kuantitas
        "", // Harga Satuan
        totalPenjualan, // Total Penjualan
        totalTunai, // Tunai
        totalQR, // QR
        totalTransfer // Transfer
    ];
    XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: -1 });

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    ];

    ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 38 },  // ID
        { wch: 20 },  // Waktu
        { wch: 25 },  // Nama Produk
        { wch: 10 },  // Kuantitas
        { wch: 15 },  // Harga Satuan
        { wch: 15 },  // Total Penjualan
        { wch: 15 },  // Tunai
        { wch: 15 },  // QR
        { wch: 15 },  // Transfer
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");
    XLSX.writeFile(wb, fileName);
};

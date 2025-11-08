import type { Transaction } from "./types";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

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

export const exportToPdf = (transactions: Transaction[], username: string) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const now = new Date();
    const period = format(now, "d MMMM yyyy");
    const fileName = `Laporan_Penjualan_${username}_${format(now, "yyyyMMdd")}.pdf`;

    const tableHead = [
      ["Waktu", "Produk", "Qty", "Harga", "Total", "Metode Pembayaran"]
    ];

    const tableBody = transactions.map(t => [
        format(new Date(parseInt(t.timestamp)), 'HH:mm:ss'),
        t.productName,
        t.quantity,
        formatCurrencyWithIDR(t.price),
        formatCurrencyWithIDR(t.total),
        t.payments.map(p => `${p.method} (${formatCurrencyWithIDR(p.amount)})`).join(', ')
    ]);
    
    // Summary Calculation
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTunai = transactions.flatMap(t => t.payments).filter(p => p.method === 'Tunai').reduce((sum, p) => sum + p.amount, 0);
    const totalQR = transactions.flatMap(t => t.payments).filter(p => p.method === 'QR').reduce((sum, p) => sum + p.amount, 0);
    const totalTransfer = transactions.flatMap(t => t.payments).filter(p => p.method === 'Transfer').reduce((sum, p) => sum + p.amount, 0);

    const tableFoot = [
        ["", "", "", "Total Penjualan", formatCurrencyWithIDR(totalSales), ""],
        ["", "", "", "Total Tunai", formatCurrencyWithIDR(totalTunai), ""],
        ["", "", "", "Total QR", formatCurrencyWithIDR(totalQR), ""],
        ["", "", "", "Total Transfer", formatCurrencyWithIDR(totalTransfer), ""],
    ];

    // Add Title
    doc.setFontSize(18);
    doc.text(`Laporan Penjualan - ${username}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Tanggal: ${period}`, 14, 29);

    // Add Table
    doc.autoTable({
        startY: 35,
        head: tableHead,
        body: tableBody,
        foot: tableFoot,
        theme: 'striped',
        headStyles: {
            fillColor: [37, 99, 235] // Primary color (blue-600)
        },
        footStyles: {
            fontStyle: 'bold',
        },
        didDrawPage: (data) => {
            // Add Footer
            const pageCount = doc.internal.pages.length;
            doc.setFontSize(10);
            doc.text(`Halaman ${data.pageNumber} dari ${pageCount - 1}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    doc.save(fileName);
};

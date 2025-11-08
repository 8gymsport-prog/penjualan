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
    const doc = new jsPDF({ orientation: "landscape" }) as jsPDFWithAutoTable;
    const now = new Date();
    const period = format(now, "d MMMM yyyy");
    const fileName = `Laporan_Penjualan_${username}_${format(now, "yyyyMMdd")}.pdf`;

    const tableHead = [
      ["No", "Waktu", "Nama Produk", "Kuantitas", "Harga Satuan", "Total Penjualan", "Tunai", "QR", "Transfer"]
    ];

    let totalQuantity = 0;
    let totalSales = 0;
    let totalTunai = 0;
    let totalQR = 0;
    let totalTransfer = 0;

    const tableBody = transactions.map((t, index) => {
        const paymentTunai = t.payments.find(p => p.method === 'Tunai')?.amount || 0;
        const paymentQR = t.payments.find(p => p.method === 'QR')?.amount || 0;
        const paymentTransfer = t.payments.find(p => p.method === 'Transfer')?.amount || 0;

        totalQuantity += t.quantity;
        totalSales += t.total;
        totalTunai += paymentTunai;
        totalQR += paymentQR;
        totalTransfer += paymentTransfer;

        return [
            index + 1,
            format(new Date(parseInt(t.timestamp)), 'yyyy-MM-dd HH:mm:ss'),
            t.productName,
            t.quantity,
            formatCurrencyWithIDR(t.price),
            formatCurrencyWithIDR(t.total),
            formatCurrencyWithIDR(paymentTunai),
            formatCurrencyWithIDR(paymentQR),
            formatCurrencyWithIDR(paymentTransfer),
        ];
    });
    
    const tableFoot = [
        ["", "", "Total", totalQuantity, "", formatCurrencyWithIDR(totalSales), formatCurrencyWithIDR(totalTunai), formatCurrencyWithIDR(totalQR), formatCurrencyWithIDR(totalTransfer)]
    ];

    // Add Title
    doc.setFontSize(18);
    doc.text(`Laporan Penjualan - ${username}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periode: ${period}`, 14, 29);

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
            fillColor: [244, 244, 245], // Muted color
            textColor: [0, 0, 0] // Explicitly set text color to black for footer
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
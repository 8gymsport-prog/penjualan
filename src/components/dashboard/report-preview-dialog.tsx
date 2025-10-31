"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Transaction } from "@/lib/types";
import { generateTxtReport } from "@/lib/reports";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface ReportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export function ReportPreviewDialog({ isOpen, onClose, transactions }: ReportPreviewDialogProps) {
  const { toast } = useToast();
  const reportContent = useMemo(() => generateTxtReport(transactions), [transactions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent).then(() => {
      toast({
        title: "Berhasil Disalin",
        description: "Laporan penjualan telah disalin ke clipboard.",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        variant: "destructive",
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin laporan ke clipboard.",
      });
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preview Laporan Penjualan</DialogTitle>
          <DialogDescription>
            Salin konten di bawah ini untuk dibagikan atau disimpan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            readOnly
            value={reportContent}
            className="h-64 resize-none font-mono text-sm"
          />
        </div>
        <DialogFooter className="sm:justify-between">
           <Button type="button" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button type="button" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Salin Laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

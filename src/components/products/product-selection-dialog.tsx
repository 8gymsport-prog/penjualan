"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ProductSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelect: (productId: string) => void;
}

export function ProductSelectionDialog({
  isOpen,
  onClose,
  products,
  onSelect,
}: ProductSelectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih Produk</DialogTitle>
          <DialogDescription>
            Cari dan pilih produk yang akan ditambahkan ke transaksi.
          </DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Cari produk..." />
          <CommandList>
            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => onSelect(product.id)}
                >
                  <div className="flex w-full justify-between items-center">
                    <span>{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.price)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

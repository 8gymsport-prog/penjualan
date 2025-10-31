"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama produk minimal 2 karakter." }),
  price: z.coerce.number().min(0, { message: "Harga harus angka positif." }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'userId'> | Product) => void;
  product?: Product;
}

export function ProductDialog({ isOpen, onClose, onSave, product }: ProductDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
    },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const isEditMode = !!product;

  useEffect(() => {
    if (isOpen) {
      form.reset(
        product
          ? { name: product.name, price: product.price }
          : { name: "", price: 0 }
      );
    }
  }, [isOpen, product, form]);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  async function onSubmit(values: FormValues) {
    setIsProcessing(true);
    if (isEditMode) {
      onSave({ ...product, ...values });
    } else {
      onSave(values);
    }
    // The parent component will handle closing the dialog
    setIsProcessing(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Perbarui detail produk Anda." : "Isi detail untuk produk baru Anda."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Produk</FormLabel>
                    <FormControl>
                      <Input placeholder="cth: Kopi Americano" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="15000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                Batal
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

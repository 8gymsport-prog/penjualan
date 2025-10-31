"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction, Product } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  productId: z.string().min(1, { message: "Silakan pilih produk." }),
  quantity: z.coerce.number().min(1, { message: "Kuantitas minimal 1." }),
  price: z.coerce.number(), // Price will be set automatically, no validation needed here
  paymentMethod: z.enum(["Tunai", "QR", "Transfer"]),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp" | "total" | "userId" | "productName" | "price">) => void;
  isProcessing: boolean;
  products: Product[];
}

export function TransactionForm({ addTransaction, isProcessing, products }: TransactionFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      price: 0,
      paymentMethod: "Tunai",
    },
  });

  const selectedProductId = form.watch("productId");

  useEffect(() => {
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (selectedProduct) {
      form.setValue("price", selectedProduct.price);
    }
  }, [selectedProductId, products, form]);


  function onSubmit(values: FormValues) {
    const { price, ...rest } = values; // Exclude price from submitted data
    addTransaction(rest);
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Tambah Transaksi Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Produk</FormLabel>
                     <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={products.length === 0}
                      >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={products.length === 0 ? "Belum ada produk" : "Pilih produk"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Satuan</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} readOnly className="bg-muted"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kuantitas</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metode Pembayaran</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih metode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tunai">Tunai</SelectItem>
                        <SelectItem value="QR">QR</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isProcessing || products.length === 0} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {isProcessing ? "Menambahkan..." : "Tambah Transaksi"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

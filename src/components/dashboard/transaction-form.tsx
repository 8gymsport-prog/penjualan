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
import type { PaymentMethod, Transaction } from "@/lib/types";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  productName: z.string().min(2, {
    message: "Nama produk minimal 2 karakter.",
  }),
  quantity: z.coerce.number().min(1, { message: "Kuantitas minimal 1." }),
  price: z.coerce.number().min(0, { message: "Harga tidak boleh negatif." }),
  paymentMethod: z.enum(["Tunai", "QR", "Transfer"]),
});

interface TransactionFormProps {
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp" | "total">) => void;
  isProcessing: boolean;
}

export function TransactionForm({ addTransaction, isProcessing }: TransactionFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      quantity: 1,
      price: 0,
      paymentMethod: "Tunai",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addTransaction(values);
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
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="cth: Kopi Susu" {...field} />
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Satuan</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="20000" {...field} />
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
            <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {isProcessing ? "Menambahkan..." : "Tambah Transaksi"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

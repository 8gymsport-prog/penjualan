"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import type { Transaction, Product, Payment, PaymentMethod } from "@/lib/types";
import { PlusCircle, Trash2, Plus, Minus } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

const paymentSchema = z.object({
  method: z.enum(["Tunai", "QR", "Transfer"]),
  amount: z.coerce.number().min(1, { message: "Jumlah harus diisi." }),
});

const formSchema = z.object({
  productId: z.string().min(1, { message: "Silakan pilih produk." }),
  quantity: z.coerce.number().min(1, { message: "Kuantitas minimal 1." }),
  price: z.coerce.number(), // Price will be set automatically, no validation needed here
  payments: z.array(paymentSchema).min(1, { message: "Minimal ada satu metode pembayaran." }),
}).refine(data => {
    const totalPaid = data.payments.reduce((acc, p) => acc + p.amount, 0);
    const totalDue = data.price * data.quantity;
    // Use a small tolerance for floating point comparisons
    return Math.abs(totalPaid - totalDue) < 0.01;
}, {
    message: "Total pembayaran harus sama dengan total harga.",
    path: ["payments"],
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
      payments: [{ method: "Tunai", amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const productOptions = useMemo(() => {
    return products.map(p => ({ label: p.name, value: p.id }));
  }, [products]);

  const selectedProductId = form.watch("productId");
  const quantity = form.watch("quantity");
  const payments = form.watch("payments");
  const totalDue = (form.getValues("price") * form.getValues("quantity")) || 0;
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const remainingAmount = totalDue - totalPaid;

  useEffect(() => {
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (selectedProduct) {
      form.setValue("price", selectedProduct.price);
      const newTotal = selectedProduct.price * quantity;
      // If only one payment method, auto-update its amount
      if (form.getValues("payments").length === 1) {
        form.setValue("payments.0.amount", newTotal);
      }
    } else {
        form.setValue("price", 0);
    }
  }, [selectedProductId, quantity, products, form]);


  function onSubmit(values: FormValues) {
    const { price, ...rest } = values; // Exclude price from submitted data
    addTransaction(rest);
    form.reset();
  }

  return (
    <Card className="transparent-card">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Tambah Transaksi Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product and Quantity */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Nama Produk</FormLabel>
                    <Combobox
                        options={productOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={products.length === 0 ? "Belum ada produk" : "Pilih atau cari produk..."}
                        searchPlaceholder="Cari produk..."
                        emptyPlaceholder="Produk tidak ditemukan."
                        disabled={products.length === 0}
                    />
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
                      <Input type="number" {...field} min={1}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Payment Methods */}
            <div className="space-y-4">
              <FormLabel>Metode Pembayaran</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`payments.${index}.method`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`payments.${index}.amount`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="number" placeholder="Jumlah" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ method: "Tunai", amount: remainingAmount > 0 ? remainingAmount : 0 })}
                disabled={remainingAmount <= 0}
                >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pembayaran
              </Button>
               {form.formState.errors.payments && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.payments.message}
                </p>
               )}
            </div>
             
             {/* Summary */}
            <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between font-medium">
                    <span>Total Tagihan:</span>
                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalDue)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Total Dibayar:</span>
                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalPaid)}</span>
                </div>
                 <div className={cn("flex justify-between font-semibold", remainingAmount !== 0 ? "text-destructive" : "text-primary")}>
                    <span>Sisa:</span>
                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(remainingAmount)}</span>
                </div>
            </div>

            <Button type="submit" disabled={isProcessing || products.length === 0 || remainingAmount !== 0} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {isProcessing ? "Menambahkan..." : "Tambah Transaksi"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

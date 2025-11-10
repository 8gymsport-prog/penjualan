"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction, Product } from "@/lib/types";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

const paymentSchema = z.object({
  method: z.enum(["Tunai", "QR", "Transfer"]),
  amount: z.coerce.number().min(0, { message: "Jumlah tidak boleh negatif." }),
});

const formSchema = z.object({
  productId: z.string().min(1, { message: "Silakan pilih produk." }),
  quantity: z.coerce.number().min(1, { message: "Kuantitas minimal 1." }),
  payments: z.array(paymentSchema).min(1, { message: "Minimal ada satu metode pembayaran." }),
}).refine(data => {
    const selectedProduct = products.find(p => p.id === data.productId);
    if (!selectedProduct) return false;
    const totalDue = selectedProduct.price * data.quantity;
    const totalPaid = data.payments.reduce((acc, p) => acc + p.amount, 0);
    return Math.abs(totalPaid - totalDue) < 0.01;
}, {
    message: "Total pembayaran harus sama dengan total tagihan.",
    path: ["payments"],
});

type FormValues = z.infer<typeof formSchema>;

interface EditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  products: Product[];
  onSave: (transaction: Transaction) => void;
}

// Dummy products for refine validation scope
let products: Product[] = [];

export function EditTransactionDialog({ isOpen, onClose, transaction, products: passedProducts, onSave }: EditTransactionDialogProps) {
  products = passedProducts; // Update products in the scope

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: transaction.productId,
      quantity: transaction.quantity,
      payments: transaction.payments,
    },
  });
  
  const productOptions = useMemo(() => {
    return passedProducts.map(p => ({ label: p.name, value: p.id }));
  }, [passedProducts]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const selectedProductId = form.watch("productId");
  const quantity = form.watch("quantity");
  const formPayments = form.watch("payments");
  
  const selectedProduct = passedProducts.find(p => p.id === selectedProductId);
  const totalDue = selectedProduct ? selectedProduct.price * quantity : 0;
  const totalPaid = formPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const remainingAmount = totalDue - totalPaid;

  useEffect(() => {
    form.reset({
      productId: transaction.productId,
      quantity: transaction.quantity,
      payments: transaction.payments,
    });
  }, [transaction, form]);
  
  function onSubmit(values: FormValues) {
    const updatedTransaction = { ...transaction, ...values };
    onSave(updatedTransaction);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
          <DialogDescription>
            Perbarui detail transaksi untuk "{transaction.productName}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Produk</FormLabel>
                    <Combobox
                        options={productOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih atau cari produk..."
                        searchPlaceholder="Cari produk..."
                        emptyPlaceholder="Produk tidak ditemukan."
                    />
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
                      <Input type="number" {...field} min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Pembayaran</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`payments.${index}.method`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Metode" />
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
            
            <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between font-medium">
                    <span>Total Tagihan:</span>
                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalDue)}</span>
                </div>
                 <div className={cn("flex justify-between", remainingAmount !== 0 && "text-destructive")}>
                    <span>Total Dibayar:</span>
                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalPaid)}</span>
                </div>
            </div>

            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

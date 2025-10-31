"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductsTable } from "@/components/products/products-table";
import type { Product } from "@/lib/types";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function ProductsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "products");
  }, [firestore, user]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleAddProduct = (product: Omit<Product, 'id' | 'userId'>) => {
    if (!firestore || !user) return;
    const newProduct = { ...product, id: uuidv4(), userId: user.uid };
    const productsCol = collection(firestore, "users", user.uid, "products");
    
    // We want a unique ID, so we create a new doc ref with our uuid
    const newDocRef = doc(productsCol, newProduct.id);

    // setDoc instead of addDoc to enforce our own ID
    addDoc(productsCol, newProduct)
      .then(() => {
        toast({ title: "Sukses", description: "Produk berhasil ditambahkan." });
      })
      .catch((err) => {
        console.error("Error adding product: ", err);
        const permissionError = new FirestorePermissionError({
          path: productsCol.path,
          operation: 'create',
          requestResourceData: newProduct,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Error", description: "Gagal menambahkan produk." });
      });
  };

  const handleUpdateProduct = (product: Product) => {
    if (!firestore || !user) return;
    const productRef = doc(firestore, "users", user.uid, "products", product.id);
    updateDoc(productRef, { name: product.name, price: product.price })
      .then(() => {
        toast({ title: "Sukses", description: "Produk berhasil diperbarui." });
      })
      .catch((err) => {
        console.error("Error updating product: ", err);
         const permissionError = new FirestorePermissionError({
          path: productRef.path,
          operation: 'update',
          requestResourceData: product,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui produk." });
      });
  };

  const handleDeleteProduct = (productId: string) => {
    if (!firestore || !user) return;
    const productRef = doc(firestore, "users", user.uid, "products", productId);
    deleteDoc(productRef)
      .then(() => {
        toast({ title: "Sukses", description: "Produk berhasil dihapus." });
      })
      .catch((err) => {
        console.error("Error deleting product: ", err);
        const permissionError = new FirestorePermissionError({
          path: productRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Error", description: "Gagal menghapus produk." });
      });
  };


  if (isUserLoading || isLoadingProducts || !user) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-80 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <ProductsTable
            products={products || []}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
        />
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";
import Image from "next/image";

export const metadata: Metadata = {
  title: "店",
  description: "Aplikasi kasir untuk mencatat penjualan dan membuat laporan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed inset-0 -z-20">
            <Image
              src="https://i.imgur.com/DxsgIqs.jpeg"
              alt="Misty mountain landscape"
              fill
              style={{ objectFit: 'cover' }}
              priority
              data-ai-hint="misty mountain"
            />
            <div className="absolute inset-0 bg-background/30 dark:bg-background/70 backdrop-blur-[2px]"></div>
          </div>
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

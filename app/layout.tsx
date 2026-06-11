import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import Chatbot from "@/components/Chatbot";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "SPARK",
  description:
    "SPARK — Self-Hosted Personal Access Remote Kit. Access files anywhere with ease and security.",
};

export const viewport: Viewport = {
  themeColor: "#050510",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#050510" }} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#050510" />
        {/* Blocking script — runs before paint, eliminates flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('portfolio-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {}
                document.documentElement.style.backgroundColor = '#050510';
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} antialiased`}
        style={{ backgroundColor: "#050510" }}
      >
        <AuthSessionProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
              <Chatbot />
            </ToastProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

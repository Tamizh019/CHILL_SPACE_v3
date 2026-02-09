import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import "./globals.css";
import { GlobalStoreProvider } from "@/context/GlobalStoreContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Chill Space',
    default: 'Chill Space - The Friendly Space',
  },
  description: "Connect without the noise. A new era of real-time conversation designed for clarity, simplicity, and focus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0c0c0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Chill Space" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo1.svg" />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${sora.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}
      >
        <GlobalStoreProvider>
          {children}
        </GlobalStoreProvider>
      </body>
    </html>
  );
}

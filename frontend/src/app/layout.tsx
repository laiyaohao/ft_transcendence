import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from './theme-provider'
import SidebarProvider from '../providers/sidebar-provider'
import ViewportProvider from "@/providers/viewport-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Academy",
  description: "Tutor and student learning workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>
            <CssBaseline />
            <ViewportProvider>
              <SidebarProvider>
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  {children}
                </div>
              </SidebarProvider>
            </ViewportProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

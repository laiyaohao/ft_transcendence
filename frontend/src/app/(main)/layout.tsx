import type { Metadata } from "next";
import AuthGuard from "./auth-guard";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <AuthGuard>
    //   {children}
    // </AuthGuard>
    <>{children}</>
  );
}

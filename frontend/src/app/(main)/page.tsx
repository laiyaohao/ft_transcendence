

export default function Page({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-testid="main-page">
      {children}
    </div>
  );
}
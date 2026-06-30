import "./globals.css";
export const metadata = {
  title: "Sentinel Dashboard",
  description: "Stellar Smart Contract Validation and Monitoring Dashboard",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
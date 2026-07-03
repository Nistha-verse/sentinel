import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
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
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
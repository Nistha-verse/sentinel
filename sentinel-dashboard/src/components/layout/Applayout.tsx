import {ReactNode} from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
interface AppLayoutProps {
  children: ReactNode;
}
export default function AppLayout({children}: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
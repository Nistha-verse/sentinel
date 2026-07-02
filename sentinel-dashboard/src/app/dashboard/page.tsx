import Applayout from "@/components/layout/Applayout";
export default function DashboardPage() {
  return (
    <Applayout>
      <div>
        <h1 className="text-2xl font-bold text-emerald-100">Dashboard</h1>
        <p className="text-zinc-400">
          Welcome to your Sentinel Security Dashboard.
        </p>
      </div>
    </Applayout>
  );
}
import Hero from '@/components/landing/Hero';
import Workflow from '@/components/landing/Workflow';
import Features from '@/components/landing/Features';
import DashboardPreview from '@/components/landing/DashboardPreview';
import CTA from '@/components/landing/CTA';
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Hero />
      <Workflow />
      <Features />
      <DashboardPreview />
      <CTA />
    </main>
  );
}
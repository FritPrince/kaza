import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden px-10 py-8">{children}</main>
      </div>
    </Providers>
  );
}

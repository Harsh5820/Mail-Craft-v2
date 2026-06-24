import AuthProvider from '@/components/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
import Toast from '@/components/ui/Toast';

export const metadata = {
  title: 'Dashboard | MailCraft',
  description: 'Manage your email campaigns, templates, and analytics.',
};

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-surface-950">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full">
          <div className="w-full max-w-7xl mx-auto p-6 lg:p-8 md:p-4 sm:p-3">
            {children}
            {/* Spacer for mobile bottom nav */}
            <div className="h-24 lg:hidden block w-full shrink-0" />
          </div>
        </main>
        <Toast />
      </div>
    </AuthProvider>
  );
}

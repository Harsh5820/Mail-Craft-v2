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
        <main className="flex-1 overflow-y-auto lg:ml-[260px] w-full lg:w-auto" style={{ marginLeft: '260px' }}>
          <div className="w-full max-w-7xl mx-auto p-6 lg:p-8 md:p-4 sm:p-3">
            {children}
          </div>
        </main>
        <Toast />
      </div>
    </AuthProvider>
  );
}

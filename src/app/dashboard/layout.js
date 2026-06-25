import AuthProvider from '@/components/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
import Toast from '@/components/ui/Toast';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Dashboard | MailCraft',
  description: 'Manage your email campaigns, templates, and analytics.',
};

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  let user = null;
  
  if (session?.user?.id) {
    await dbConnect();
    user = await User.findById(session.user.id).lean();
  }

  if (user && !user.onboardingCompleted) {
    return (
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-surface-950">
          <OnboardingWizard initialName={user.name} />
          <Toast />
        </div>
      </AuthProvider>
    );
  }

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

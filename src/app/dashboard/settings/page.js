'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Shield, CreditCard, Lock } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

/**
 * Derives a display-friendly plan label from profile API data.
 * Uses planInfo (from plan.service) as the authoritative source.
 */
function getPlanDisplayLabel(planInfo) {
  if (!planInfo) return null;
  if (planInfo.plan === 'free') return 'Free';

  const name = planInfo.planName || planInfo.plan;

  if (planInfo.status === 'expiring_soon' && planInfo.expiresAt) {
    const date = new Date(planInfo.expiresAt).toLocaleDateString();
    return `${name} – Expires soon (${date})`;
  }
  if (planInfo.expiresAt) {
    const date = new Date(planInfo.expiresAt).toLocaleDateString();
    return `${name} – Expires on ${date}`;
  }
  return `${name} – Active`;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [planInfo, setPlanInfo] = useState(null);
  const [userPlan, setUserPlan] = useState(null); // null = loading
  const [pendingRequest, setPendingRequest] = useState(null);
  const [upgradeForm, setUpgradeForm] = useState({ plan: 'daily', upiId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Fetch user plan data from authoritative profile API
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.plan) setUserPlan(data.plan);
        if (data.planInfo) setPlanInfo(data.planInfo);
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));

    // Fetch pending upgrade request
    fetch('/api/upgrade')
      .then((res) => res.json())
      .then((data) => {
        if (data.request) setPendingRequest(data.request);
      })
      .catch(console.error);
  }, []);

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upgradeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Upgrade request submitted!');
      setPendingRequest(data.request);
    } catch (err) {
      showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine if user currently has an active (non-free, non-expired) plan
  const isActivePremium = userPlan && userPlan !== 'free';
  const planLabel = profileLoading ? 'Loading...' : (getPlanDisplayLabel(planInfo) || 'Free');

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-100 mb-1">Settings</h1>
        <p className="text-sm text-surface-400">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <div className="card mb-6 p-0 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-surface-800/60 bg-surface-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-100">Account Details</h2>
              <p className="text-xs text-surface-400">Your core identity and current plan status.</p>
            </div>
          </div>
          <a href="/dashboard/profile" className="btn btn-secondary btn-sm">Edit Profile</a>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">Name</label>
            <p className="text-sm font-medium text-surface-100">{session?.user?.name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">Email</label>
            <p className="text-sm font-medium text-surface-100">{session?.user?.email || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">Current Plan</label>
            {profileLoading ? (
              <div className="h-6 w-24 rounded bg-surface-800 animate-shimmer" />
            ) : (
              <span className={`badge ${isActivePremium ? 'badge-primary' : 'bg-surface-800 text-surface-300'}`}>
                {planLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card mb-6 p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-surface-800/60 bg-surface-900/30">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Security & Privacy</h2>
            <p className="text-xs text-surface-400">How your data is protected.</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/30 border border-surface-800/50">
            <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-surface-200">Zero Permanent Storage</p>
              <p className="text-xs text-surface-500 mt-0.5">SMTP credentials are never stored permanently in our database.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/30 border border-surface-800/50">
            <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-surface-200">AES-256 Encryption</p>
              <p className="text-xs text-surface-500 mt-0.5">All campaign data is heavily encrypted during active sessions.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/30 border border-surface-800/50">
            <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-surface-200">Auto-Destruction</p>
              <p className="text-xs text-surface-500 mt-0.5">Sensitive data is wiped immediately after campaign completion.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/30 border border-surface-800/50">
            <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-surface-200">Audit Logging</p>
              <p className="text-xs text-surface-500 mt-0.5">Action logs are maintained with strictly masked sensitive data.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Info */}
      <div className="card mb-6 p-0 overflow-hidden border-primary-500/20">
        <div className="flex items-center gap-3 p-5 border-b border-surface-800/60 bg-gradient-to-r from-primary-600/10 to-transparent">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Subscription Plan</h2>
            <p className="text-xs text-primary-400/80">Upgrade to unlock more daily emails and premium features.</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { name: 'Free', price: '₹0', features: '20 emails/day', key: 'free' },
              { name: 'Daily', price: '₹10', duration: '/day', features: '100 emails/day', key: 'daily' },
              { name: 'Monthly', price: '₹1,000', duration: '/mo', features: '300 emails/day', key: 'monthly' },
            ].map((p) => {
              const isCurrent = userPlan === p.key;
              return (
                <div key={p.key} className={`relative p-5 rounded-xl border transition-all ${isCurrent ? 'border-primary-500 bg-primary-600/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-surface-800 bg-surface-900/50 hover:border-surface-700'}`}>
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-primary-500/30">
                      Current
                    </div>
                  )}
                  <p className="text-sm font-semibold text-surface-300 text-center mb-2">{p.name}</p>
                  <p className="text-2xl font-black text-surface-100 text-center mb-1">
                    {p.price}<span className="text-sm font-normal text-surface-500">{p.duration}</span>
                  </p>
                  <div className="h-px w-12 bg-surface-800 mx-auto my-3" />
                  <p className="text-xs text-surface-400 text-center">{p.features}</p>
                </div>
              );
            })}
          </div>

          {/* Upgrade Form */}
          <div className="max-w-xl mx-auto bg-surface-900/80 rounded-xl border border-surface-800 p-5">
            <h3 className="text-base font-semibold text-surface-100 mb-4">Request Upgrade</h3>

            {isActivePremium ? (
              <div className="p-4 rounded-lg bg-primary-600/10 border border-primary-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-300">Active Premium Plan Detected</p>
                  <p className="text-xs text-primary-400/80 mt-1">
                    {planLabel}. You can upgrade again after your current plan expires.
                  </p>
                </div>
              </div>
            ) : pendingRequest ? (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning animate-ping" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warning">Upgrade Request Pending</p>
                  <p className="text-xs text-warning/80 mt-1">
                    Your request for the <strong className="uppercase">{pendingRequest.plan}</strong> plan (UPI: {pendingRequest.upiId}) is being reviewed by the admin.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpgrade} className="space-y-5">
                <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                  <p className="text-sm font-semibold text-info mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment Instructions
                  </p>
                  <ol className="text-xs text-info/80 list-decimal pl-4 space-y-1.5 marker:text-info/50">
                    <li>Send the exact amount via UPI to the organization&apos;s UPI ID.</li>
                    <li>Copy the 12-digit UPI Transaction Reference ID.</li>
                    <li>Select your desired plan and paste the ID below.</li>
                    <li>Admin approval usually takes less than 2 hours.</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-200 mb-1.5">Select Plan</label>
                    <select
                      className="input py-2.5"
                      value={upgradeForm.plan}
                      onChange={(e) => setUpgradeForm({ ...upgradeForm, plan: e.target.value })}
                    >
                      <option value="daily">Daily - ₹10</option>
                      <option value="monthly">Monthly - ₹1,000</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-200 mb-1.5">Transaction ID</label>
                    <input
                      className="input py-2.5"
                      placeholder="e.g. 312345678901"
                      value={upgradeForm.upiId}
                      onChange={(e) => setUpgradeForm({ ...upgradeForm, upiId: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full py-2.5 shadow-lg shadow-primary-500/25"
                  disabled={submitting || !upgradeForm.upiId}
                >
                  {submitting ? 'Submitting Request...' : 'Submit Upgrade Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

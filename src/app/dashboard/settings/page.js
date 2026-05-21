'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Shield, CreditCard, Mail } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [userPlan, setUserPlan] = useState('free');
  const [pendingRequest, setPendingRequest] = useState(null);
  const [upgradeForm, setUpgradeForm] = useState({ plan: 'daily', upiId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch user plan data
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.plan) setUserPlan(data.plan);
      })
      .catch(console.error);

    // Fetch pending upgrade request
    fetch('/api/upgrade')
      .then(res => res.json())
      .then(data => {
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
        body: JSON.stringify(upgradeForm)
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

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-100 mb-1">Settings</h1>
        <p className="text-sm text-surface-400">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-surface-100">Profile</h2>
          </div>
          <a href="/dashboard/profile" className="text-xs text-primary-400 hover:underline">Edit Profile →</a>
        </div>
        <div className="space-y-3">
          <div><label className="block text-xs text-surface-500 mb-1">Name</label>
            <p className="text-sm text-surface-200">{session?.user?.name || '—'}</p></div>
          <div><label className="block text-xs text-surface-500 mb-1">Email</label>
            <p className="text-sm text-surface-200">{session?.user?.email || '—'}</p></div>
          <div><label className="block text-xs text-surface-500 mb-1">Plan</label>
            <span className="badge badge-primary capitalize">{userPlan}</span></div>
        </div>
      </div>

      {/* Security */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-success" />
          <h2 className="text-lg font-semibold text-surface-100">Security</h2>
        </div>
        <ul className="space-y-2 text-sm text-surface-300">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> SMTP credentials are never stored permanently</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> AES-256 encryption during active campaigns</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Auto-destruction after campaign completion</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Audit logging with masked sensitive data</li>
        </ul>
      </div>

      {/* Plan Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold text-surface-100">Your Plan</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Free', price: '₹0', features: '20 emails/day' },
            { name: 'Daily', price: '₹10/day', features: '100 emails/day' },
            { name: 'Monthly', price: '₹1,000/mo', features: '300 emails/day' },
          ].map((p, i) => (
            <div key={i} className={`p-4 rounded-lg border text-center ${userPlan === p.name.toLowerCase() ? 'border-primary-500 bg-primary-600/10' : 'border-surface-800 bg-surface-800/50'}`}>
              <p className="text-sm font-semibold text-surface-200">{p.name}</p>
              <p className="text-lg font-bold text-surface-100 my-1">{p.price}</p>
              <p className="text-xs text-surface-400">{p.features}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Form */}
      <div className="mt-6 pt-6 border-t border-surface-800">
        <h3 className="text-sm font-semibold text-surface-200 mb-3">Upgrade Your Plan</h3>

        {pendingRequest ? (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-warning">Upgrade Request Pending</p>
              <p className="text-xs text-warning/80">
                Your request for the <strong>{pendingRequest.plan}</strong> plan (UPI: {pendingRequest.upiId}) is being reviewed by admin.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpgrade} className="space-y-4">
            <div className="p-4 rounded-lg bg-info/10 border border-info/20 mb-4">
              <p className="text-sm text-info font-medium mb-1">How to upgrade:</p>
              <ol className="text-xs text-info/80 list-decimal pl-4 space-y-1">
                <li><strong>Daily Plan (₹10):</strong> 24 hours access, 100 emails/day</li>
                <li><strong>Monthly Plan (₹1,000):</strong> 30 days access, 300 emails/day</li>
                <li>Send payment via UPI to your organization's UPI ID</li>
                <li>Copy the UPI Transaction ID and submit below</li>
                <li>Admin approval usually within 24 hours</li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-surface-400 mb-1">Select Plan</label>
                <select
                  className="input"
                  value={upgradeForm.plan}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, plan: e.target.value })}
                >
                  <option value="daily">Daily - ₹10 (24 hours, 100 emails)</option>
                  <option value="monthly">Monthly - ₹1,000 (30 days, 300 emails)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">UPI Transaction ID</label>
                <input
                  className="input"
                  placeholder="e.g. 312345678901"
                  value={upgradeForm.upiId}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, upiId: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={submitting || !upgradeForm.upiId}
            >
              {submitting ? 'Submitting...' : 'Submit Upgrade Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

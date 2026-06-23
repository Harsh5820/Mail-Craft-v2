/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Send,
  FileText,
  CheckCircle2,
  XCircle,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchCategory, setLaunchCategory] = useState('Dev');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (res.ok) setAnalytics(data.analytics);
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const stats = [
    {
      label: 'Total Campaigns',
      value: analytics?.totalCampaigns || 0,
      icon: Send,
      color: 'text-primary-400',
      bg: 'bg-primary-600/15',
    },
    {
      label: 'Emails Sent',
      value: analytics?.totalSent || 0,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/15',
    },
    {
      label: 'Failed',
      value: analytics?.totalFailed || 0,
      icon: XCircle,
      color: 'text-danger',
      bg: 'bg-danger/15',
    },
    {
      label: 'Success Rate',
      value: `${analytics?.successRate || 0}%`,
      icon: TrendingUp,
      color: 'text-warning',
      bg: 'bg-warning/15',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-100 mb-1">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-surface-400 text-sm">
          Here&apos;s an overview of your email campaigns.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-surface-500 font-medium">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-surface-100">
                {loading ? '—' : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <button onClick={async () => {
          setShowLaunchModal(true);
          setTemplatesLoading(true);
          try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            setTemplates(data.templates || []);
          } catch(e) {}
          setTemplatesLoading(false);
        }} className="glass-card p-6 flex items-center gap-4 group text-left w-full cursor-pointer hover:bg-surface-800/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary-400 group-hover:text-primary-300 transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-surface-100 mb-1">Launch Daily Campaign</h3>
            <p className="text-xs text-surface-400">1-click auto-send to latest batch</p>
          </div>
        </button>

        <Link href="/dashboard/campaigns/new" className="glass-card p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-surface-100 mb-1">New Campaign</h3>
            <p className="text-xs text-surface-400">Start sending personalized emails to recruiters</p>
          </div>
        </Link>

        <Link href="/dashboard/templates" className="glass-card p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-surface-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-surface-100 mb-1">Manage Templates</h3>
            <p className="text-xs text-surface-400">Create and edit reusable email templates</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-100">Recent Campaigns</h2>
          <Link href="/dashboard/campaigns" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-surface-800 animate-shimmer" />
            ))}
          </div>
        ) : analytics?.recentActivity?.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentActivity.map((campaign, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary-600/10 flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">{campaign.name}</p>
                  <p className="text-xs text-surface-500">
                    {campaign.sentCount}/{campaign.totalEmails} sent
                  </p>
                </div>
                <span className={`badge badge-${
                  campaign.status === 'completed' ? 'success' :
                  campaign.status === 'running' ? 'info' :
                  campaign.status === 'failed' ? 'danger' :
                  campaign.status === 'paused' ? 'warning' : 'neutral'
                }`}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-surface-600 mx-auto mb-3" />
            <p className="text-surface-400 text-sm">No campaigns yet</p>
            <Link href="/dashboard/campaigns/new" className="btn btn-primary btn-sm mt-4">
              Create your first campaign
            </Link>
          </div>
        )}
      </div>

      {/* Launch Daily Modal */}
      {showLaunchModal && (
        <div className="modal-overlay" onClick={() => setShowLaunchModal(false)}>
          <div className="modal-content max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-surface-100 mb-2">Launch Daily Campaign</h2>
            <p className="text-sm text-surface-400 mb-6">Select a category and template to start your daily outreach.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-surface-300 mb-2">Target Category</label>
              <select 
                className="input py-2 text-sm w-full" 
                value={launchCategory} 
                onChange={(e) => setLaunchCategory(e.target.value)}
              >
                <option value="Dev">Dev</option>
                <option value="HR">HR</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Design">Design</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <label className="block text-sm font-medium text-surface-300 mb-2">Select Template</label>
            {templatesLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-800 rounded-lg animate-shimmer" />)}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-6 border border-surface-800 rounded-lg">
                <p className="text-sm text-surface-400 mb-4">You don&apos;t have any templates yet.</p>
                <Link href="/dashboard/templates" className="btn btn-primary btn-sm">Create One</Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {templates.map(t => (
                  <button 
                    key={t._id} 
                    onClick={() => {
                      router.push(`/dashboard/campaigns/new?magic=true&templateId=${t._id}&category=${encodeURIComponent(launchCategory)}`);
                    }}
                    className="w-full text-left p-4 rounded-lg border border-surface-800 hover:border-primary-500/50 bg-surface-800/50 hover:bg-primary-600/10 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-surface-200 group-hover:text-primary-300 transition-colors">{t.name}</h3>
                      <p className="text-xs text-surface-500 mt-1 truncate max-w-[250px]">{t.subject}</p>
                    </div>
                    <Send className="w-4 h-4 text-surface-600 group-hover:text-primary-400 transition-colors" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowLaunchModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

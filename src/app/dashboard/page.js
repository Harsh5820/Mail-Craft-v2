'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/campaigns/new" className="glass-card p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-surface-100 mb-1">New Campaign</h3>
            <p className="text-sm text-surface-400">Start sending personalized emails to recruiters</p>
          </div>
          <ArrowRight className="w-5 h-5 text-surface-500 group-hover:text-primary-400 transition-colors" />
        </Link>

        <Link href="/dashboard/templates" className="glass-card p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-surface-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-surface-100 mb-1">Manage Templates</h3>
            <p className="text-sm text-surface-400">Create and edit reusable email templates</p>
          </div>
          <ArrowRight className="w-5 h-5 text-surface-500 group-hover:text-primary-400 transition-colors" />
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
    </div>
  );
}

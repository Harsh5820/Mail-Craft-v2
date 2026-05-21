'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Send, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => { if (d.analytics) setAnalytics(d.analytics); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-fade-in"><div className="h-64 rounded-xl bg-surface-800 animate-shimmer" /></div>;

  const stats = [
    { l: 'Total Campaigns', v: analytics?.totalCampaigns || 0, icon: Send, c: 'text-primary-400', bg: 'bg-primary-600/15' },
    { l: 'Emails Sent', v: analytics?.totalSent || 0, icon: CheckCircle2, c: 'text-success', bg: 'bg-success/15' },
    { l: 'Failed', v: analytics?.totalFailed || 0, icon: XCircle, c: 'text-danger', bg: 'bg-danger/15' },
    { l: 'Success Rate', v: `${analytics?.successRate || 0}%`, icon: TrendingUp, c: 'text-warning', bg: 'bg-warning/15' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-100 mb-1">Analytics</h1>
        <p className="text-sm text-surface-400">Track your email campaign performance.</p>
      </div>

      <div className="p-4 mb-8 rounded-xl bg-info/10 border border-info/20 flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-info">Analytics Algorithm in Beta</h3>
          <p className="text-xs text-info/80 mt-1">
            Please note that our tracking algorithm is currently in Beta and may not be 100% accurate. The final version will be released soon.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (<div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-surface-500 font-medium">{s.l}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${s.c}`} /></div>
            </div>
            <p className="text-2xl font-bold text-surface-100">{s.v}</p>
          </div>);
        })}
      </div>

      {/* Visual bar chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-surface-100 mb-6">Delivery Overview</h2>
        <div className="space-y-4">
          {[
            { l: 'Sent', v: analytics?.totalSent || 0, c: 'bg-success', max: analytics?.totalEmails || 1 },
            { l: 'Failed', v: analytics?.totalFailed || 0, c: 'bg-danger', max: analytics?.totalEmails || 1 },
          ].map((bar, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-300">{bar.l}</span>
                <span className="text-sm font-mono text-surface-400">{bar.v}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-800">
                <div className={`h-full rounded-full ${bar.c} transition-all duration-700`}
                     style={{ width: `${Math.min((bar.v / bar.max) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

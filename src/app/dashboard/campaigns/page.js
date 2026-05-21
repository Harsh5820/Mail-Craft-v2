'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, Plus, Trash2, Eye, Pause, Play, XCircle, Clock } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

const statusConfig = {
  draft: { badge: 'badge-neutral', label: 'Draft' },
  running: { badge: 'badge-info', label: 'Running' },
  paused: { badge: 'badge-warning', label: 'Paused' },
  completed: { badge: 'badge-success', label: 'Completed' },
  failed: { badge: 'badge-danger', label: 'Failed' },
  cancelled: { badge: 'badge-danger', label: 'Cancelled' },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns);
    } catch (err) {
      showToast('Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`Campaign ${action}d`);
      fetchCampaigns();
    } catch (err) {
      showToast(`Failed to ${action} campaign`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign and all its logs?')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showToast('Campaign deleted');
      fetchCampaigns();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 mb-1">Campaigns</h1>
          <p className="text-sm text-surface-400">Manage and track your email campaigns.</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-800 animate-shimmer" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-16">
          <Send className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-200 mb-2">No campaigns yet</h3>
          <p className="text-sm text-surface-400 mb-6">Create your first campaign to start sending emails.</p>
          <Link href="/dashboard/campaigns/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Create Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const config = statusConfig[c.status] || statusConfig.draft;
            const progress = c.totalEmails > 0 ? Math.round(((c.sentCount + c.failedCount) / c.totalEmails) * 100) : 0;

            return (
              <div key={c._id} className="glass-card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-primary-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-surface-100 truncate">{c.name}</h3>
                      <span className={`badge ${config.badge}`}>{config.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-surface-500">
                      <span>Template: {c.templateId?.name || 'Unknown'}</span>
                      <span>{c.sentCount}/{c.totalEmails} sent</span>
                      {c.failedCount > 0 && <span className="text-danger">{c.failedCount} failed</span>}
                    </div>

                    {/* Progress bar */}
                    {c.status === 'running' && (
                      <div className="mt-2">
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/dashboard/campaigns/${c._id}`} className="btn btn-ghost btn-sm" title="View details">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {c.status === 'running' && (
                      <button onClick={() => handleAction(c._id, 'pause')} className="btn btn-ghost btn-sm" title="Pause">
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {c.status === 'paused' && (
                      <button onClick={() => handleAction(c._id, 'resume')} className="btn btn-ghost btn-sm" title="Resume">
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(c.status === 'running' || c.status === 'paused') && (
                      <button onClick={() => handleAction(c._id, 'cancel')} className="btn btn-ghost btn-sm text-danger" title="Cancel">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(c.status !== 'running') && (
                      <button onClick={() => handleDelete(c._id)} className="btn btn-ghost btn-sm text-danger" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

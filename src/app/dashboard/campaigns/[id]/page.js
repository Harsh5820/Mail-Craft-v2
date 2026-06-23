/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Send, Pause, Play, XCircle, CheckCircle2,
  Clock, AlertCircle, RefreshCw, Trash2
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

/**
 * Confirmation modal for destructive actions.
 */
function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-surface-100 mb-2">{title}</h2>
        <p className="text-sm text-surface-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn btn-secondary btn-sm" disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger btn-sm" disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [campaign, setCampaign] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [campaignRes, progressRes] = await Promise.all([
        fetch(`/api/campaigns/${id}`),
        fetch(`/api/campaigns/${id}/progress`),
      ]);
      const cData = await campaignRes.json();
      const pData = await progressRes.json();

      if (campaignRes.ok) setCampaign(cData.campaign);
      if (progressRes.ok) setProgress(pData.progress);
    } catch (err) {
      console.error('Failed to fetch campaign data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}/progress`);
      const data = await res.json();
      if (res.ok) setProgress(data.progress);
    } catch (err) {
      console.error('Failed to fetch progress');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchProgress, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (action) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`Campaign ${action}d`);
      fetchProgress();
    } catch (err) {
      showToast(err.message || `Failed to ${action}`, 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete campaign');

      showToast(`Campaign "${campaign?.name || 'Campaign'}" deleted successfully`);
      setShowDeleteModal(false);
      router.push('/dashboard/campaigns');
    } catch (err) {
      showToast(err.message || 'Failed to delete campaign', 'error');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="animate-fade-in">
      <div className="h-64 rounded-xl bg-surface-800 animate-shimmer" />
    </div>
  );

  if (!progress) return (
    <div className="text-center py-20">
      <p className="text-surface-400">Campaign not found</p>
      <button onClick={() => router.push('/dashboard/campaigns')} className="btn btn-ghost btn-sm mt-4">
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns
      </button>
    </div>
  );

  const pct = progress.progress || 0;
  const isRunning = progress.status === 'running';
  const isPaused = progress.status === 'paused';
  const canDelete = progress.status !== 'running';

  // Show delete button if user is owner or admin
  const isOwnerOrAdmin =
    session?.user?.role === 'admin' ||
    (campaign && session?.user?.id && campaign.userId?.toString() === session.user.id);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-surface-100 truncate">
            {campaign?.name || 'Campaign Progress'}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isRunning && (
            <button onClick={() => handleAction('pause')} className="btn btn-secondary btn-sm">
              <Pause className="w-4 h-4" /> Pause
            </button>
          )}
          {isPaused && (
            <button onClick={() => handleAction('resume')} className="btn btn-primary btn-sm">
              <Play className="w-4 h-4" /> Resume
            </button>
          )}
          {(isRunning || isPaused) && (
            <button onClick={() => handleAction('cancel')} className="btn btn-danger btn-sm">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
          {/* Delete button — only shown when campaign is not running and user has permission */}
          {canDelete && isOwnerOrAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger btn-sm"
              title="Delete campaign"
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`badge badge-${
            progress.status === 'completed' ? 'success'
            : progress.status === 'running' ? 'info'
            : progress.status === 'paused' ? 'warning'
            : progress.status === 'failed' ? 'danger'
            : 'neutral'
          }`}>
            {progress.status?.toUpperCase()}
          </span>
          <span className="text-sm text-surface-400">{pct}% complete</span>
        </div>
        <div className="progress-bar mb-6">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: 'Total', v: progress.totalEmails, icon: Send, c: 'text-primary-400' },
            { l: 'Sent', v: progress.sentCount, icon: CheckCircle2, c: 'text-success' },
            { l: 'Failed', v: progress.failedCount, icon: AlertCircle, c: 'text-danger' },
            { l: 'Pending', v: progress.pendingCount, icon: Clock, c: 'text-warning' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.l} className="text-center p-4 rounded-lg bg-surface-800/50">
                <Icon className={`w-5 h-5 mx-auto mb-2 ${s.c}`} />
                <p className="text-2xl font-bold text-surface-100">{s.v ?? 0}</p>
                <p className="text-xs text-surface-500">{s.l}</p>
              </div>
            );
          })}
        </div>

        {progress.errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
            <p className="text-xs text-danger">{progress.errorMessage}</p>
          </div>
        )}

        {isRunning && (
          <div className="mt-4 p-3 rounded-lg bg-info/10 border border-info/20 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-info animate-spin" />
            <p className="text-xs text-info">Sending in progress... Auto-refreshing every 5 seconds.</p>
          </div>
        )}
      </div>

      {/* Recent Logs */}
      <div className="card">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Recent Activity</h2>
        {progress.recentLogs?.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {progress.recentLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 text-sm">
                {log.status === 'sent'
                  ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-danger shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-surface-200 truncate">{log.recipientEmail}</p>
                  <p className="text-xs text-surface-500">{log.company} — {log.recipientName}</p>
                </div>
                <span className={`badge ${log.status === 'sent' ? 'badge-success' : 'badge-danger'} text-[10px]`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-400 text-center py-8">No activity yet</p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Campaign"
          message={`Are you sure you want to delete the campaign "${campaign?.name || 'this campaign'}"? This will also delete all email logs. This action cannot be undone.`}
          confirmLabel="Delete Campaign"
          onConfirm={handleDelete}
          onCancel={() => !deleting && setShowDeleteModal(false)}
          loading={deleting}
        />
      )}
    </div>
  );
}

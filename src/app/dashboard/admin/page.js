'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, CheckCircle, XCircle, Briefcase, Upload,
  Trash2, ChevronLeft, ChevronRight, AlertCircle, X,
  CheckCircle2, Mail
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────
function formatUploadDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

// ─────────────────────────────────────────────────
// Confirmation Modal
// ─────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={!loading ? onCancel : undefined}>
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

// ─────────────────────────────────────────────────
// Upload Stats Panel
// ─────────────────────────────────────────────────
function UploadStatsPanel({ stats, invalidEmails, onDismiss }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <h3 className="text-sm font-semibold text-surface-100">Upload Results</h3>
        </div>
        <button onClick={onDismiss} className="text-surface-500 hover:text-surface-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        {[
          { label: 'Total', value: stats.total, color: 'text-surface-200' },
          { label: 'Valid', value: stats.valid, color: 'text-info' },
          { label: 'Invalid', value: stats.invalid, color: 'text-danger' },
          { label: 'Duplicates', value: stats.inSubmissionDuplicates + stats.dbDuplicates, color: 'text-warning' },
          { label: 'Uploaded', value: stats.uploaded, color: 'text-success' },
        ].map((s) => (
          <div key={s.label} className="p-2 rounded-lg bg-surface-900">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-surface-500">{s.label}</p>
          </div>
        ))}
      </div>

      {invalidEmails?.length > 0 && (
        <div className="rounded-lg bg-danger/5 border border-danger/20 p-3">
          <p className="text-xs font-medium text-danger mb-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Invalid emails (not stored):
          </p>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {invalidEmails.map((email, i) => (
              <p key={i} className="text-xs font-mono text-danger/80">{email}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Plan Requests Section (existing functionality)
// ─────────────────────────────────────────────────
function PlanRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/requests');
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch {
      console.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (requestId, action) => {
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Request ${action} successfully`);
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  if (loading) {
    return <div className="animate-pulse text-surface-400 py-8 text-center text-sm">Loading requests...</div>;
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-surface-100 mb-4">Pending Plan Requests</h2>
      {requests.length === 0 ? (
        <p className="text-sm text-surface-400 py-8 text-center">No pending requests.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Email</th><th>Current Plan</th>
                <th>Requested Plan</th><th>UPI ID</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td>{req.userId?.name}</td>
                  <td className="text-primary-300">{req.userId?.email}</td>
                  <td><span className="badge badge-neutral">{req.userId?.plan}</span></td>
                  <td><span className="badge badge-primary">{req.plan}</span></td>
                  <td className="font-mono text-xs">{req.upiId}</td>
                  <td className="text-xs text-surface-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(req._id, 'approved')}
                        className="btn btn-sm btn-ghost text-success hover:bg-success/10"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(req._id, 'rejected')}
                        className="btn btn-sm btn-ghost text-danger hover:bg-danger/10"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Recruiter Email Management Section (redesigned)
// ─────────────────────────────────────────────────
function RecruiterEmailsSection() {
  // Upload state
  const [emailText, setEmailText] = useState('');
  const [category, setCategory] = useState('Other');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { stats, invalidEmails }
  const [uploadError, setUploadError] = useState(null);

  // Batch list state
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [batchLoading, setBatchLoading] = useState(true);

  // Selection & delete state
  const [selected, setSelected] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState(null); // { type: 'single'|'bulk', id?, count? }
  const [deleting, setDeleting] = useState(false);

  const fetchBatches = useCallback(async () => {
    setBatchLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      const res = await fetch(`/api/recruiter-emails?${params}`);
      const data = await res.json();
      if (res.ok) {
        setBatches(data.batches || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      console.error('Failed to fetch batches');
    } finally {
      setBatchLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // ── Upload handler ──
  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError(null);
    setUploadResult(null);

    // Frontend guard: prevent empty submission
    if (!emailText.trim() || emailText.replace(/[,\s]/g, '').length === 0) {
      setUploadError('Please paste at least one email address before uploading.');
      return;
    }

    setUploading(true);
    try {
      const res = await fetch('/api/recruiter-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText, category }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Backend returned validation error — show stats if available
        if (data.stats) {
          setUploadResult({ stats: data.stats, invalidEmails: data.invalidEmails || [] });
        }
        setUploadError(data.error || 'Upload failed');
        return;
      }

      // Success — show stats, clear textarea
      setUploadResult({ stats: data.stats, invalidEmails: data.invalidEmails || [] });
      setEmailText(''); // only clear on success
      showToast(data.message);
      fetchBatches();
    } catch (err) {
      setUploadError(err.message || 'An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  // ── Delete handlers ──
  const handleDeleteSingle = async () => {
    if (!deleteModal?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recruiter-emails/${deleteModal.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Batch deleted successfully');
      setDeleteModal(null);
      setSelected((s) => { const ns = new Set(s); ns.delete(deleteModal.id); return ns; });
      fetchBatches();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const ids = [...selected];
      const res = await fetch('/api/recruiter-emails/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      setSelected(new Set());
      setDeleteModal(null);
      fetchBatches();
    } catch (err) {
      showToast(err.message || 'Bulk delete failed', 'error');
    } finally {
      setDeleting(false); }
  };

  const toggleSelect = (id) => {
    setSelected((s) => {
      const ns = new Set(s);
      if (ns.has(id)) ns.delete(id); else ns.add(id);
      return ns;
    });
  };

  const allOnPageSelected =
    batches.length > 0 && batches.every((b) => selected.has(b._id?.toString() || b.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(batches.map((b) => b._id?.toString() || b.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Upload Card ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Mail className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-surface-100">Upload Recruiter Emails</h2>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label htmlFor="recruiter-email-textarea" className="block text-sm font-medium text-surface-300 mb-2">
                Recruiter Emails
              </label>
              <textarea
                id="recruiter-email-textarea"
                className="input font-mono text-sm leading-relaxed"
                style={{ minHeight: '140px', resize: 'vertical' }}
                placeholder={
                  'recruiter1@company.com, recruiter2@company.com, recruiter3@company.com\n\nPaste email addresses separated by commas.\nSpaces, empty values, and duplicates are handled automatically.'
                }
                value={emailText}
                onChange={(e) => {
                  setEmailText(e.target.value);
                  if (uploadError) setUploadError(null);
                }}
                disabled={uploading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Category
              </label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
              >
                <option value="PM">Product Management (PM)</option>
                <option value="AI">Artificial Intelligence (AI)</option>
                <option value="Dev">Development (Dev)</option>
                <option value="Data">Data Science (Data)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Frontend validation message */}
          {uploadError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
              <p className="text-xs text-danger">{uploadError}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !emailText.trim()}
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Emails
                </>
              )}
            </button>
            {emailText.trim() && (
              <p className="text-xs text-surface-500">
                ~{emailText.split(',').filter((t) => t.trim()).length} tokens detected
              </p>
            )}
          </div>
        </form>

        {/* Upload result stats */}
        {uploadResult && (
          <div className="mt-4">
            <UploadStatsPanel
              stats={uploadResult.stats}
              invalidEmails={uploadResult.invalidEmails}
              onDismiss={() => setUploadResult(null)}
            />
          </div>
        )}
      </div>

      {/* ── Batch List Card ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Upload Batches</h2>
            <p className="text-xs text-surface-400">{total} batch{total !== 1 ? 'es' : ''} total</p>
          </div>
          {selected.size > 0 && (
            <button
              onClick={() => setDeleteModal({ type: 'bulk', count: selected.size })}
              className="btn btn-danger btn-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selected.size} selected
            </button>
          )}
        </div>

        {batchLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-surface-800 animate-shimmer" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-8">
            No upload batches yet. Use the form above to upload recruiter emails.
          </p>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-surface-600"
                        aria-label="Select all batches on this page"
                      />
                    </th>
                    <th>Upload Date</th>
                    <th>Category</th>
                    <th>Email Count</th>
                    <th>Preview</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const batchId = batch._id?.toString() || batch.id;
                    return (
                      <tr key={batchId} className={selected.has(batchId) ? 'bg-primary-600/5' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(batchId)}
                            onChange={() => toggleSelect(batchId)}
                            className="rounded border-surface-600"
                          />
                        </td>
                        <td className="font-medium text-surface-200">
                          {formatUploadDate(batch.uploadedAt)}
                          {batch.label === 'migrated_legacy' && (
                            <span className="ml-2 badge badge-neutral text-[10px]">legacy</span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-neutral">{batch.category || 'Other'}</span>
                        </td>
                        <td>
                          <span className="badge badge-primary">
                            {batch.emailCount} email{batch.emailCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="text-xs text-surface-500 font-mono max-w-xs truncate">
                          {batch.emails?.slice(0, 2).join(', ')}
                          {batch.emails?.length > 2 && ` +${batch.emails.length - 2} more`}
                        </td>
                        <td>
                          <button
                            onClick={() => setDeleteModal({ type: 'single', id: batchId, date: formatUploadDate(batch.uploadedAt) })}
                            className="btn btn-ghost btn-sm text-danger hover:bg-danger/10"
                            title="Delete this batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-surface-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <ConfirmModal
          title={deleteModal.type === 'bulk' ? `Delete ${deleteModal.count} Batches` : 'Delete Batch'}
          message={
            deleteModal.type === 'bulk'
              ? `Are you sure you want to delete ${deleteModal.count} selected upload batch${deleteModal.count !== 1 ? 'es' : ''}? All emails in those batches will be permanently removed.`
              : `Are you sure you want to delete the batch uploaded on "${deleteModal.date}"? All emails in this batch will be permanently removed.`
          }
          confirmLabel={deleteModal.type === 'bulk' ? `Delete ${deleteModal.count} Batches` : 'Delete Batch'}
          onConfirm={deleteModal.type === 'bulk' ? handleBulkDelete : handleDeleteSingle}
          onCancel={() => !deleting && setDeleteModal(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Admin Page (tabbed)
// ─────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="animate-pulse text-surface-400 py-8 text-center text-sm">
        Loading Admin Panel...
      </div>
    );
  }
  if (session?.user?.role !== 'admin') return null;

  const tabs = [
    { key: 'requests', label: 'Plan Requests', icon: ShieldAlert },
    { key: 'recruiter', label: 'Recruiter Emails', icon: Briefcase },
  ];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-100 mb-1">Admin Dashboard</h1>
          <p className="text-sm text-surface-400">Manage plan upgrade requests and recruiter emails.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-surface-900 rounded-xl border border-surface-800 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-primary-600 text-white'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'requests' && <PlanRequestsSection />}
      {activeTab === 'recruiter' && <RecruiterEmailsSection />}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, CheckCircle, XCircle, Briefcase, Upload, Plus,
  Trash2, Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Building2, Mail, User, X
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

// ============================================================
// CSV Parser (client-side, no extra dependency)
// ============================================================
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [], error: 'CSV file is empty or has no data rows.' };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const requiredHeaders = ['company_name', 'recruiter_name', 'recruiter_email', 'job_role'];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { headers, rows: [], error: `Missing required CSV headers: ${missing.join(', ')}` };
  }

  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  });

  return { headers, rows, error: null };
}

// ============================================================
// Confirmation Modal
// ============================================================
function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={!loading ? onCancel : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-surface-100 mb-2">{title}</h2>
        <p className="text-sm text-surface-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger btn-sm" disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Plan Requests Section (existing functionality)
// ============================================================
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

  if (loading) return <div className="animate-pulse text-surface-400 py-8 text-center">Loading requests...</div>;

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
                      <button onClick={() => handleAction(req._id, 'approved')} className="btn btn-sm btn-ghost text-success hover:bg-success/10">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleAction(req._id, 'rejected')} className="btn btn-sm btn-ghost text-danger hover:bg-danger/10">
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

// ============================================================
// Recruiter Email Management Section (new)
// ============================================================
function RecruiterEmailsSection({ adminId }) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState(null); // { type: 'single'|'bulk', id?, count? }
  const [deleting, setDeleting] = useState(false);

  // Add form
  const [addForm, setAddForm] = useState({ company_name: '', recruiter_name: '', recruiter_email: '', job_role: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // CSV upload
  const [csvResult, setCsvResult] = useState(null); // { stats, errors }
  const [csvLoading, setCsvLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) {
        params.set('company_name', debouncedSearch);
      }
      const res = await fetch(`/api/recruiter-emails?${params}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch { console.error('Failed to fetch'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch('/api/recruiter-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Recruiter email added!');
      setAddForm({ company_name: '', recruiter_name: '', recruiter_email: '', job_role: '' });
      setShowAddForm(false);
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to add', 'error');
    } finally { setAddLoading(false); }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvResult(null);
    setCsvLoading(true);

    try {
      const text = await file.text();
      const { rows, error } = parseCSV(text);

      if (error) {
        showToast(error, 'error');
        return;
      }

      const res = await fetch('/api/recruiter-emails/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCsvResult({ stats: data.stats, message: data.message });
      showToast(data.message);
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'CSV upload failed', 'error');
    } finally {
      setCsvLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteSingle = async () => {
    if (!deleteModal?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recruiter-emails/${deleteModal.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Record deleted');
      setDeleteModal(null);
      setSelected((s) => { const ns = new Set(s); ns.delete(deleteModal.id); return ns; });
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally { setDeleting(false); }
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
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Bulk delete failed', 'error');
    } finally { setDeleting(false); }
  };

  const toggleSelect = (id) => {
    setSelected((s) => {
      const ns = new Set(s);
      if (ns.has(id)) ns.delete(id); else ns.add(id);
      return ns;
    });
  };

  const toggleSelectAll = () => {
    if (records.every((r) => selected.has(r._id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map((r) => r._id)));
    }
  };

  const allOnPageSelected = records.length > 0 && records.every((r) => selected.has(r._id));

  return (
    <div className="space-y-4">
      {/* Top Actions Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Recruiter Email Database</h2>
            <p className="text-xs text-surface-400">{total.toLocaleString()} records total</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowAddForm((v) => !v)} className="btn btn-secondary btn-sm">
              <Plus className="w-4 h-4" /> Add One
            </button>
            <label className={`btn btn-primary btn-sm cursor-pointer ${csvLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" />
              {csvLoading ? 'Uploading...' : 'Upload CSV'}
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} disabled={csvLoading} />
            </label>
            {selected.size > 0 && (
              <button
                onClick={() => setDeleteModal({ type: 'bulk', count: selected.size })}
                className="btn btn-danger btn-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete {selected.size} selected
              </button>
            )}
          </div>
        </div>

        {/* CSV template hint */}
        <p className="text-xs text-surface-500 mb-4">
          CSV format: <code className="bg-surface-800 px-1 py-0.5 rounded text-surface-300">company_name,recruiter_name,recruiter_email,job_role</code>
        </p>

        {/* CSV Results */}
        {csvResult && (
          <div className="mb-4 p-4 rounded-xl border border-surface-700 bg-surface-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-100">Upload Results</h3>
              <button onClick={() => setCsvResult(null)} className="text-surface-500 hover:text-surface-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { l: 'Valid', v: csvResult.stats.valid, c: 'text-info' },
                { l: 'Invalid', v: csvResult.stats.invalid, c: 'text-danger' },
                { l: 'Duplicates', v: csvResult.stats.duplicate, c: 'text-warning' },
                { l: 'Uploaded', v: csvResult.stats.uploaded, c: 'text-success' },
                { l: 'Failed', v: csvResult.stats.failed, c: 'text-danger' },
              ].map((s) => (
                <div key={s.l} className="p-2 rounded-lg bg-surface-900">
                  <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
                  <p className="text-xs text-surface-500">{s.l}</p>
                </div>
              ))}
            </div>
            {csvResult.stats.errors?.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {csvResult.stats.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-danger">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Row {e.row}: {e.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-xl border border-surface-700 bg-surface-800/40 space-y-3">
            <h3 className="text-sm font-semibold text-surface-100 mb-2">Add Recruiter Email</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-surface-400 mb-1">Company Name *</label>
                <input className="input" placeholder="Google Inc." required
                  value={addForm.company_name} onChange={(e) => setAddForm((f) => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Recruiter Name *</label>
                <input className="input" placeholder="John Smith" required
                  value={addForm.recruiter_name} onChange={(e) => setAddForm((f) => ({ ...f, recruiter_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Recruiter Email *</label>
                <input className="input" type="email" placeholder="recruiter@company.com" required
                  value={addForm.recruiter_email} onChange={(e) => setAddForm((f) => ({ ...f, recruiter_email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Job Role *</label>
                <input className="input" placeholder="Software Engineer" required
                  value={addForm.job_role} onChange={(e) => setAddForm((f) => ({ ...f, job_role: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add Record'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            className="input pl-9"
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded bg-surface-800 animate-shimmer" />)}
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-8">No recruiter emails found.</p>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-surface-600"
                        title="Select all on this page"
                      />
                    </th>
                    <th>Company</th>
                    <th>Recruiter</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id} className={selected.has(r._id) ? 'bg-primary-600/5' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(r._id)}
                          onChange={() => toggleSelect(r._id)}
                          className="rounded border-surface-600"
                        />
                      </td>
                      <td className="font-medium text-surface-100">{r.company_name}</td>
                      <td className="text-surface-200">{r.recruiter_name}</td>
                      <td className="text-primary-300 text-sm">{r.recruiter_email}</td>
                      <td className="text-surface-400 text-sm">{r.job_role}</td>
                      <td className="text-xs text-surface-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => setDeleteModal({ type: 'single', id: r._id, name: r.recruiter_email })}
                          className="btn btn-ghost btn-sm text-danger hover:bg-danger/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-surface-400">
                  Page {page} of {totalPages} ({total.toLocaleString()} records)
                </p>
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
          title={deleteModal.type === 'bulk' ? `Delete ${deleteModal.count} Records` : 'Delete Record'}
          message={
            deleteModal.type === 'bulk'
              ? `Are you sure you want to delete ${deleteModal.count} selected recruiter email record(s)? This cannot be undone.`
              : `Are you sure you want to delete "${deleteModal.name}"? This cannot be undone.`
          }
          confirmLabel={deleteModal.type === 'bulk' ? `Delete ${deleteModal.count} Records` : 'Delete'}
          onConfirm={deleteModal.type === 'bulk' ? handleBulkDelete : handleDeleteSingle}
          onCancel={() => !deleting && setDeleteModal(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ============================================================
// Admin Page (tabbed)
// ============================================================
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

  if (status === 'loading') return <div className="animate-pulse text-surface-400 py-8 text-center">Loading Admin Panel...</div>;
  if (session?.user?.role !== 'admin') return null;

  const tabs = [
    { key: 'requests', label: 'Plan Requests', icon: ShieldAlert },
    { key: 'recruiter', label: 'Recruiter Emails', icon: Briefcase },
  ];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-100 mb-1">Admin Dashboard</h1>
          <p className="text-sm text-surface-400">Manage plan upgrade requests, users, and recruiter emails.</p>
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
      {activeTab === 'recruiter' && <RecruiterEmailsSection adminId={session?.user?.id} />}
    </div>
  );
}

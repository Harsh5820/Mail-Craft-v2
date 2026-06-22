'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Briefcase, Search, Lock, ChevronLeft, ChevronRight, Building2, Mail, User, Briefcase as RoleIcon } from 'lucide-react';
import Link from 'next/link';

export default function RecruiterEmailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [filters, setFilters] = useState({
    company_name: '',
    recruiter_name: '',
    recruiter_email: '',
    job_role: '',
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce filters by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(debouncedFilters).filter(([, v]) => v.trim())
        ),
      });

      const res = await fetch(`/api/recruiter-emails?${params.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setAccessDenied(false);
      }
    } catch (err) {
      console.error('Failed to fetch recruiter emails:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedFilters]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRecords();
    }
  }, [status, fetchRecords]);

  if (status === 'loading') {
    return (
      <div className="animate-fade-in space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-800 animate-shimmer" />
        ))}
      </div>
    );
  }

  // Access denied — show upgrade prompt
  if (accessDenied) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-warning" />
        </div>
        <h1 className="text-2xl font-bold text-surface-100 mb-3">Premium Feature</h1>
        <p className="text-surface-400 mb-2 text-sm">
          Recruiter email contacts are only available to users with an active premium plan.
        </p>
        <p className="text-surface-500 text-xs mb-8">
          Upgrade to the Daily or Monthly plan to access {total > 0 ? `${total.toLocaleString()} recruiter contacts` : 'recruiter contacts'}.
        </p>
        <Link href="/dashboard/settings" className="btn btn-primary">
          Upgrade Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary-600/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-surface-100">Recruiter Contacts</h1>
          </div>
          <p className="text-sm text-surface-400 pl-12">
            {loading ? 'Loading...' : `${total.toLocaleString()} recruiter email${total !== 1 ? 's' : ''} available`}
          </p>
        </div>
      </div>

      {/* Search Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              className="input pl-9"
              placeholder="Company name..."
              value={filters.company_name}
              onChange={(e) => setFilters((f) => ({ ...f, company_name: e.target.value }))}
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              className="input pl-9"
              placeholder="Recruiter name..."
              value={filters.recruiter_name}
              onChange={(e) => setFilters((f) => ({ ...f, recruiter_name: e.target.value }))}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              className="input pl-9"
              placeholder="Recruiter email..."
              value={filters.recruiter_email}
              onChange={(e) => setFilters((f) => ({ ...f, recruiter_email: e.target.value }))}
            />
          </div>
          <div className="relative">
            <RoleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              className="input pl-9"
              placeholder="Job role..."
              value={filters.job_role}
              onChange={(e) => setFilters((f) => ({ ...f, job_role: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-surface-800 animate-shimmer" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center py-16">
          <Search className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-200 mb-2">No records found</h3>
          <p className="text-sm text-surface-400">
            {Object.values(debouncedFilters).some(Boolean)
              ? 'Try adjusting your search filters.'
              : 'No recruiter emails have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-container mb-4">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Recruiter Name</th>
                  <th>Email</th>
                  <th>Job Role</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td className="font-medium text-surface-100">{r.company_name}</td>
                    <td className="text-surface-200">{r.recruiter_name}</td>
                    <td>
                      <a
                        href={`mailto:${r.recruiter_email}`}
                        className="text-primary-400 hover:underline text-sm"
                      >
                        {r.recruiter_email}
                      </a>
                    </td>
                    <td className="text-surface-300">{r.job_role}</td>
                    <td className="text-xs text-surface-500">
                      {new Date(r.createdAt).toLocaleDateString()}
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
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total.toLocaleString()} records
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost btn-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-surface-300">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-ghost btn-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

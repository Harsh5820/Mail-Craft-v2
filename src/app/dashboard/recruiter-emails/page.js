'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Briefcase, Lock, Copy, Check, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

/**
 * Format a UTC date string as "23 June 2026" (Indian/British readable).
 * Uses the actual server-supplied uploadedAt timestamp.
 */
function formatUploadDate(isoString) {
  if (!isoString) return 'Unknown date';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ─────────────────────────────────────────────────
// EmailBatchCard — one card per upload batch
// ─────────────────────────────────────────────────
function EmailBatchCard({ batch }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const handleCopy = async () => {
    const realEmails = batch.emails.filter(e => e !== '__LOCKED__');
    const csvString = realEmails.join(', ');

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available in this browser.');
      }
      await navigator.clipboard.writeText(csvString);

      // Success state
      setCopied(true);
      showToast(`${realEmails.length} email${realEmails.length !== 1 ? 's' : ''} copied to clipboard`);

      // Restore button after 2 seconds
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Failure state — do NOT show "Copied" if it failed
      showToast(err.message || 'Failed to copy to clipboard', 'error');
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimeout(copyTimerRef.current);
  }, []);

  const emailCount = batch.emails.length;
  // Show scrollbar only when more than 8 emails
  const needsScroll = emailCount > 8;

  return (
    <div className="animate-fade-in">
      {/* Upload Date Header — above the card */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
          Uploaded on {formatUploadDate(batch.uploadedAt)}
        </p>
        <span className="badge badge-neutral text-[10px] uppercase tracking-wide">
          {batch.category || 'Other'}
        </span>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Sticky subheader: email count + copy button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/60 bg-surface-900/80 backdrop-blur-sm sticky top-0 z-10">
          <span className="text-sm font-medium text-surface-300">
            {emailCount} {emailCount === 1 ? 'email' : 'emails'}
          </span>
          <button
            onClick={handleCopy}
            disabled={copied}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              copied
                ? 'bg-success/20 text-success cursor-default'
                : 'bg-primary-600/15 text-primary-400 hover:bg-primary-600/25 active:scale-95'
            }`}
            title="Copy all emails as comma-separated list"
            aria-label={`Copy ${emailCount} emails from this batch`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Scrollable email list — max ~8 rows, then scroll */}
        <div
          className="px-4 py-2 overflow-y-auto"
          style={{ maxHeight: needsScroll ? '17rem' : 'none' }}
          aria-label="Email address list"
        >
          <ul className="divide-y divide-surface-800/30">
            {batch.emails.map((email, idx) => {
              const isLocked = email === '__LOCKED__';
              return (
                <li
                  key={idx}
                  className={`py-2 text-sm font-mono break-all leading-relaxed flex items-center gap-2 ${
                    isLocked ? 'text-surface-500 select-none' : 'text-surface-200 select-all'
                  }`}
                >
                  {isLocked ? (
                    <div className="flex items-center gap-2 w-full">
                      <Lock className="w-3.5 h-3.5 text-warning/70 shrink-0" />
                      <span className="blur-sm opacity-50 select-none flex-1 overflow-hidden">hidden.email@example.com</span>
                      <span className="text-[10px] text-warning/80 font-sans uppercase tracking-wider ml-auto bg-warning/10 px-2 py-0.5 rounded-full shrink-0">Premium</span>
                    </div>
                  ) : (
                    email
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Skeleton loader cards
// ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div>
      <div className="h-4 w-36 rounded bg-surface-800 animate-shimmer mb-2" />
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-800/60 flex items-center justify-between">
          <div className="h-4 w-20 rounded bg-surface-800 animate-shimmer" />
          <div className="h-7 w-16 rounded-lg bg-surface-800 animate-shimmer" />
        </div>
        <div className="px-4 py-3 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded bg-surface-800 animate-shimmer" style={{ width: `${60 + i * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────
export default function RecruiterEmailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(true);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchBatches = useCallback(async () => {
    setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      const res = await fetch(`/api/recruiter-emails?${params}`);

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load recruiter emails');
      }

      setBatches(data.batches || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setIsPremium(data.isPremium);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBatches();
    }
  }, [status, fetchBatches]);

  // ── Loading (session) ──
  if (status === 'loading') {
    return (
      <div className="animate-fade-in space-y-6 max-w-2xl">
        {[1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // ── Access denied — premium required (removed, replaced by limited view) ──

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary-600/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100">Recruiter Contacts</h1>
        </div>
        <p className="text-sm text-surface-400 pl-12">
          {loading
            ? 'Loading...'
            : `${total} upload batch${total !== 1 ? 'es' : ''} available`}
        </p>
      </div>

      {/* Upgrade Banner for Free Users */}
      {!loading && !isPremium && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-warning/20 bg-gradient-to-r from-warning/10 to-transparent mb-6">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-semibold text-warning">Limited View (Free Plan)</p>
              <p className="text-xs text-surface-400">Upgrade to Premium to unlock all recruiter emails.</p>
            </div>
          </div>
          <Link href="/dashboard/settings" className="btn btn-sm bg-warning/20 text-warning hover:bg-warning/30 border-0">
            Upgrade
          </Link>
        </div>
      )}

      {/* Loading batches */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        // ── Error state ──
        <div className="card text-center py-16">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-200 mb-2">Failed to Load</h3>
          <p className="text-sm text-surface-400 mb-6">{error}</p>
          <button
            onClick={fetchBatches}
            className="btn btn-primary btn-sm mx-auto flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : batches.length === 0 ? (
        // ── Empty state ──
        <div className="card text-center py-16">
          <Briefcase className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-200 mb-2">No Recruiter Emails Yet</h3>
          <p className="text-sm text-surface-400">
            No recruiter emails are currently available. Check back later.
          </p>
        </div>
      ) : (
        // ── Batch cards ──
        <>
          <div className="space-y-6">
            {batches.map((batch) => (
              <EmailBatchCard key={batch.id} batch={batch} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-surface-800">
              <p className="text-xs text-surface-400">
                Page {page} of {totalPages} &middot; {total} batch{total !== 1 ? 'es' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost btn-sm"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-ghost btn-sm"
                  aria-label="Next page"
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

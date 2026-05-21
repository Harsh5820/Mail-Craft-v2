'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowLeft, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import Toast, { showToast } from '@/components/ui/Toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Real-time password validation criteria
  const hasMinLength = form.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const passwordsMatch = form.password && form.password === form.confirmPassword;

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No security token found.');
    }
  }, [token]);

  // Handle the countdown decrement interval
  useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [success]);

  // Handle the redirection side-effect when countdown finishes
  useEffect(() => {
    if (success && countdown <= 0) {
      router.push('/login');
    }
  }, [success, countdown, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Please request another forgot password link.');
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('Password does not meet validation criteria');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      showToast('Password reset successfully! 🔑');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-surface-100">MailCraft</span>
        </Link>
        <h1 className="text-2xl font-bold text-surface-100 mb-2">New password</h1>
        <p className="text-sm text-surface-400">Update your account credentials</p>
      </div>

      {/* Card */}
      <div className="glass-card p-8">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 mb-6 text-sm text-danger animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">New Password</label>
              <input
                id="reset-password"
                type="password"
                className="input"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                disabled={!token}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm New Password</label>
              <input
                id="reset-confirm-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                disabled={!token}
              />
            </div>

            {/* Criteria checklist */}
            <div className="bg-surface-900/50 rounded-xl border border-surface-800 p-4 space-y-2 text-xs">
              <span className="font-semibold text-surface-300 block mb-1">Password Requirements:</span>
              <div className="flex items-center gap-2 transition-colors duration-200">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <X className="w-3.5 h-3.5 text-surface-500" />
                )}
                <span className={hasMinLength ? 'text-success' : 'text-surface-400'}>
                  At least 8 characters long
                </span>
              </div>
              <div className="flex items-center gap-2 transition-colors duration-200">
                {hasUppercase ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <X className="w-3.5 h-3.5 text-surface-500" />
                )}
                <span className={hasUppercase ? 'text-success' : 'text-surface-400'}>
                  Contains at least one uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 transition-colors duration-200">
                {hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <X className="w-3.5 h-3.5 text-surface-500" />
                )}
                <span className={hasNumber ? 'text-success' : 'text-surface-400'}>
                  Contains at least one number
                </span>
              </div>
              <div className="flex items-center gap-2 transition-colors duration-200">
                {passwordsMatch ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <X className="w-3.5 h-3.5 text-surface-500" />
                )}
                <span className={passwordsMatch ? 'text-success' : 'text-surface-400'}>
                  Passwords match
                </span>
              </div>
            </div>

            <button
              id="reset-submit"
              type="submit"
              className="btn btn-primary w-full btn-lg group transition-all duration-300 active:scale-[0.98]"
              disabled={loading || !token || !hasMinLength || !hasUppercase || !hasNumber || !passwordsMatch}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Password...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Save & Reset Password
                </span>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4 animate-scale-up">
            <div className="w-16 h-16 bg-success/15 border border-success/30 rounded-full flex items-center justify-center mx-auto mb-2 text-success shadow-lg shadow-success/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-surface-100">Password Reset Complete</h3>
            <p className="text-sm text-surface-400 leading-relaxed max-w-sm mx-auto">
              Your password has been successfully updated!
            </p>
            <p className="text-xs text-primary-400/80 mt-2 font-medium">
              Redirecting you to the sign-in screen in {countdown} seconds...
            </p>
          </div>
        )}
      </div>

      {/* Back Link */}
      <p className="text-center text-sm text-surface-400 mt-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-surface-400 hover:text-surface-200 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="w-full max-w-md animate-pulse p-8 glass-card text-center text-surface-300">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      Loading recovery session details...
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 gradient-bg-hero relative">
      <Toast />
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

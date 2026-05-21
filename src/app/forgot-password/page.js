'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Toast, { showToast } from '@/components/ui/Toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
      showToast('Reset email sent successfully! 🚀');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      showToast(err.message || 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 gradient-bg-hero relative">
      <Toast />
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-surface-100">MailCraft</span>
          </Link>
          <h1 className="text-2xl font-bold text-surface-100 mb-2">Reset password</h1>
          <p className="text-sm text-surface-400">Secure your MailCraft account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 mb-6 text-sm text-danger animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input animate-focus"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="btn btn-primary w-full btn-lg group transition-all duration-300 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Link...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send Reset Link
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-success/15 border border-success/30 rounded-full flex items-center justify-center mx-auto mb-2 text-success shadow-lg shadow-success/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-surface-100">Check your inbox</h3>
              <p className="text-sm text-surface-400 leading-relaxed max-w-sm mx-auto">
                We have sent a secure password reset link to <strong className="text-surface-200">{email}</strong>. The link is valid for 1 hour.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Resend reset link
                </button>
              </div>
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, CheckCircle2, AlertCircle, Award, Target, ChevronRight, BarChart, Lock } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function AtsCheckerPage() {
  const { data: session } = useSession();
  const isPremium = session?.user?.plan !== 'free' || session?.user?.role === 'admin';
  
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || resumeText.length < 50) {
      showToast('Please paste your full resume text (min 50 characters).', 'error');
      return;
    }
    if (!targetRole.trim()) {
      showToast('Please enter a target role.', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setResult(data);
      showToast(`Score calculated! (${data.remainingChecks} checks remaining this month)`);
    } catch (err) {
      showToast(err.message || 'Failed to check ATS score', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success border-success/30 bg-success/10';
    if (score >= 60) return 'text-warning border-warning/30 bg-warning/10';
    return 'text-danger border-danger/30 bg-danger/10';
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-100 mb-1">ATS Resume Score Checker</h1>
          <p className="text-sm text-surface-400">Optimize your resume for applicant tracking systems.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="card h-fit">
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-400" /> Target Role
              </label>
              <input
                className="input"
                placeholder="e.g., Senior React Developer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-400" /> Paste Resume Text
              </label>
              <textarea
                className="input font-mono text-xs leading-relaxed"
                style={{ minHeight: '250px', resize: 'vertical' }}
                placeholder="Paste the full text of your resume here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
              <p className="text-xs text-warning flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Limit: 15 checks per month.
              </p>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading || !resumeText || !targetRole}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><BarChart className="w-4 h-4" /> Calculate ATS Score</>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <div className="animate-slide-up space-y-4">
              {/* Score Gauge */}
              <div className="card text-center py-8 border-2 bg-surface-900 border-surface-800 transition-all duration-500 relative overflow-hidden">
                <p className="text-sm font-medium uppercase tracking-wider mb-6 opacity-80">ATS Match Score</p>
                
                <div className="relative w-56 h-32 mx-auto flex items-end justify-center">
                  <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 200 120">
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    {/* Background track */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    {/* Progress arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={80 * Math.PI}
                      strokeDashoffset={(80 * Math.PI) * (1 - (result.score / 100))}
                      style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </svg>
                  
                  {/* Score text inside the gauge */}
                  <div className="flex flex-col items-center mb-1 z-10">
                    <div className="text-6xl font-black leading-none" style={{ color: result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                      {result.score}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                      {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Average' : 'Needs Work'}
                    </div>
                  </div>
                </div>

                <p className="text-sm opacity-80 px-4 mt-6 max-w-md mx-auto leading-relaxed">{result.analysis}</p>
              </div>

              {/* Strengths */}
              <div className="card border border-success/20 bg-success/5">
                <h3 className="text-sm font-bold text-success flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4" /> Key Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths?.map((item, i) => (
                    <li key={i} className="text-sm text-surface-200 flex items-start gap-2">
                      <span className="text-success mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="card border border-warning/20 bg-warning/5">
                <h3 className="text-sm font-bold text-warning flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4" /> Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {result.improvements?.slice(0, isPremium ? undefined : 3).map((item, i) => (
                    <li key={i} className="text-sm text-surface-200 flex items-start gap-2">
                      <span className="text-warning mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {!isPremium && (
                  <div className="mt-4 pt-4 border-t border-warning/20 flex flex-col items-center text-center relative overflow-hidden">
                    {/* If we only have 3 or fewer items, inject some fake blurred ones so it looks full */}
                    {result.improvements?.length <= 3 && (
                       <div className="w-full space-y-3 mb-4 px-2 opacity-40 blur-[2px] pointer-events-none select-none">
                         <div className="flex items-start gap-2">
                           <span className="text-warning mt-0.5">•</span>
                           <div className="h-4 bg-warning/20 rounded w-full mt-1" />
                         </div>
                         <div className="flex items-start gap-2">
                           <span className="text-warning mt-0.5">•</span>
                           <div className="h-4 bg-warning/20 rounded w-5/6 mt-1" />
                         </div>
                       </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-warning/10 via-warning/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 w-full px-4">
                      <p className="text-sm font-medium text-warning mb-3 blur-[0.5px]">
                        {result.improvements?.length > 3 
                          ? `And ${result.improvements.length - 3} more critical insights...`
                          : "Unlock the remaining critical ATS insights..."}
                      </p>
                      <Link href="/dashboard/settings" className="btn bg-gradient-to-r from-warning to-yellow-500 text-yellow-950 hover:from-yellow-400 hover:to-yellow-500 w-full flex items-center justify-center gap-2 shadow-xl shadow-warning/20 border-none font-bold">
                        <Lock className="w-4 h-4" />
                        Unlock Premium to see all
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed border-2 border-surface-700 bg-surface-800/30">
              <Award className="w-16 h-16 text-surface-600 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-surface-300 mb-2">Ready to analyze</h3>
              <p className="text-sm text-surface-500 max-w-sm">
                Paste your resume and target role on the left to see how well you match the job description.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

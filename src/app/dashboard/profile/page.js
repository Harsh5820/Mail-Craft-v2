/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  User, Briefcase, Link2, Code2, Globe, Phone,
  MapPin, Award, Save, CheckCircle2, Loader2, Sparkles, Zap, Clock, AlertCircle
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('free');
  const [planExpiresAt, setPlanExpiresAt] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [dailyEmails, setDailyEmails] = useState(null);
  const [profile, setProfile] = useState({
    skills: '',
    experience: '',
    linkedin: '',
    github: '',
    portfolio: '',
    contact_number_1: '',
    contact_number_2: '',
    location: '',
    headline: '',
    interests: [],
  });
  const [referralCode, setReferralCode] = useState('');

  const [timeLeft, setTimeLeft] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok) {
        setName(data.name || '');
        setPlan(data.plan || 'free');
        setPlanExpiresAt(data.planExpiresAt);
        setPlanInfo(data.planInfo);
        setDailyEmails(data.dailyEmails);
        setReferralCode(data.referralCode || '');
        setProfile(prev => ({ ...prev, ...data.profile, interests: data.profile?.interests || [] }));
      }
    } catch (err) {
      showToast('Failed to load profile', 'error');
    } finally {
      setTimeout(() => setLoading(false), 0);
    }
  };

  useEffect(() => {
    if (!planExpiresAt || plan === 'free') {
      setTimeout(() => setTimeLeft(''), 0);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(planExpiresAt).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft('Expired');
        // Trigger auto refresh to downgrade
        setTimeout(() => fetchProfile(), 0);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' ') + ' left');
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [planExpiresAt, plan]);



  useEffect(() => {
    fetchProfile();
  }, []);

  const updateField = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Profile saved! Your info will auto-fill in campaigns. ✨');
      setHasChanges(false);
    } catch (err) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-surface-800 animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const completionFields = [
    name,
    profile.skills,
    profile.experience,
    profile.linkedin,
    profile.portfolio,
    profile.github,
    profile.contact_number_1,
    profile.contact_number_2,
    profile.location,
    profile.headline,
  ];
  const filledCount = completionFields.filter(f => f?.trim()).length;
  const completionPct = Math.round((filledCount / completionFields.length) * 100);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary-500/20">
            {name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Your Profile</h1>
            <p className="text-sm text-surface-400">Save once, auto-fill every campaign.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="btn btn-primary"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Profile</>
          )}
        </button>
      </div>

      {/* Plan Info - Enhanced */}
      <div className={`card mb-6 border ${planInfo?.status === 'expiring_soon' ? 'border-warning/50 bg-gradient-to-r from-warning-600/10 to-warning-500/5' : planInfo?.status === 'expired' ? 'border-danger/50 bg-gradient-to-r from-danger-600/10 to-danger-500/5' : 'border-primary-500/30 bg-gradient-to-r from-primary-600/10 to-primary-500/5'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary-400" />
              <p className="text-xs font-medium text-surface-400">Active Plan</p>
            </div>
            <p className="text-xl font-bold text-surface-100 capitalize">{plan}</p>
            {plan !== 'free' && (
              <p className="text-xs text-surface-500 mt-2">
                ₹{plan === 'daily' ? '10' : '1000'} {plan === 'daily' ? 'per day' : 'per month'}
              </p>
            )}
          </div>

          {/* Daily Email Usage */}
          {dailyEmails && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-info" />
                <p className="text-xs font-medium text-surface-400">Today&apos;s Usage</p>
              </div>
              <p className="text-2xl font-bold text-surface-100">
                {dailyEmails.used}/{dailyEmails.allowed}
              </p>
              <p className="text-xs text-surface-500 mt-1">
                {dailyEmails.remaining} remaining
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-surface-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                  style={{ width: `${(dailyEmails.used / dailyEmails.allowed) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Expiry Info */}
          {planExpiresAt && plan !== 'free' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-warning animate-pulse" />
                <p className="text-xs font-medium text-surface-400">Time Remaining</p>
              </div>
              <p className="text-lg font-black text-warning animate-pulse">
                {timeLeft || 'Calculating...'}
              </p>
              <p className="text-xs text-surface-500 mt-1">
                Expiry: <span className="font-semibold text-surface-300">{new Date(planExpiresAt).toLocaleString()}</span>
              </p>
              {planInfo?.status === 'expiring_soon' && (
                <p className="text-xs text-warning mt-2 font-semibold">⚠️ Expiring soon (under 24 hours)!</p>
              )}
            </div>
          )}
        </div>

        {plan === 'free' && (
          <div className="mt-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
            <p className="text-xs text-surface-300">
              Upgrade to <span className="font-semibold">Daily (₹10/day)</span> for 100 emails/day or <span className="font-semibold">Monthly (₹1000/month)</span> for 300 emails/day.
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <a href="/dashboard/settings" className="btn btn-primary btn-sm">
            {plan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
          </a>
          {plan !== 'free' && (
            <button
              onClick={fetchProfile}
              className="btn btn-ghost btn-sm"
              title="Refresh plan info"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-surface-200">Profile Completion</span>
          </div>
          <span className={`text-sm font-bold ${completionPct === 100 ? 'text-success' : completionPct >= 60 ? 'text-warning' : 'text-danger'}`}>
            {completionPct}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionPct}%`,
              background: completionPct === 100 ? 'var(--color-success)' : completionPct >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
            }}
          />
        </div>
        <p className="text-xs text-surface-500 mt-2">
          {completionPct === 100
            ? '🎉 All set! Your profile will auto-fill in every campaign.'
            : `Fill ${completionFields.length - filledCount} more field${completionFields.length - filledCount > 1 ? 's' : ''} so campaigns launch faster.`}
        </p>
      </div>

      {/* Referral Program */}
      <div className="card mb-6 border border-primary-500/20 bg-gradient-to-br from-primary-600/5 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary-600/15 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Refer & Earn Premium</h2>
            <p className="text-xs text-surface-400">Get free premium days for inviting friends.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm text-surface-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <p>They register: <strong className="text-surface-100">You get 1 Day Free</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <p>They subscribe: <strong className="text-surface-100">You get 10 Days Free</strong></p>
            </div>
          </div>
          <div className="bg-surface-900/50 p-4 rounded-xl border border-surface-800">
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Your Referral Link</label>
            <div className="flex items-center gap-2">
              <input 
                className="input text-xs font-mono" 
                value={referralCode ? `${window.location.origin}/register?ref=${referralCode}` : 'Loading...'} 
                readOnly 
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`);
                  showToast('Referral link copied!');
                }}
                className="btn btn-secondary btn-sm shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interests Selection */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-info" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Your Interests</h2>
            <p className="text-xs text-surface-400">Select domains to see personalized recruiter emails.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['PM', 'AI', 'Dev', 'Data', 'Other'].map(category => {
            const isSelected = profile.interests?.includes(category);
            return (
              <button
                key={category}
                onClick={() => {
                  const newInterests = isSelected
                    ? profile.interests.filter(i => i !== category)
                    : [...(profile.interests || []), category];
                  updateField('interests', newInterests);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  isSelected
                    ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                    : 'bg-surface-800/50 border-surface-700 text-surface-400 hover:text-surface-200 hover:border-surface-600'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Basic Info */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary-600/15 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-400" />
          </div>
          <h2 className="text-lg font-semibold text-surface-100">Basic Info</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Full Name</label>
            <input
              className="input"
              placeholder="Nilesh Raut"
              value={name}
              onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Email</label>
            <input className="input opacity-60" value={session?.user?.email || ''} disabled />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Headline / Title</label>
            <input
              className="input"
              placeholder="Full Stack Developer | React & Node.js"
              value={profile.headline}
              onChange={(e) => updateField('headline', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              <MapPin className="w-3 h-3 inline mr-1" />Location
            </label>
            <input
              className="input"
              placeholder="Mumbai, India"
              value={profile.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              <Phone className="w-3 h-3 inline mr-1" />Contact Number 1
            </label>
            <input
              className="input"
              placeholder="+91 99999 99999"
              value={profile.contact_number_1}
              onChange={(e) => updateField('contact_number_1', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              <Phone className="w-3 h-3 inline mr-1" />Contact Number 2
            </label>
            <input
              className="input"
              placeholder="Alternate contact number"
              value={profile.contact_number_2}
              onChange={(e) => updateField('contact_number_2', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-info" />
          </div>
          <h2 className="text-lg font-semibold text-surface-100">Professional Details</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              <Award className="w-3 h-3 inline mr-1" />Skills
            </label>
            <input
              className="input"
              placeholder="React, Node.js, MongoDB, TypeScript, Python"
              value={profile.skills}
              onChange={(e) => updateField('skills', e.target.value)}
            />
            <p className="text-[10px] text-surface-600 mt-1">Comma-separated. These fill the {'{{skills}}'} placeholder in templates.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Experience</label>
            <input
              className="input"
              placeholder="3 years in Full Stack Development"
              value={profile.experience}
              onChange={(e) => updateField('experience', e.target.value)}
            />
            <p className="text-[10px] text-surface-600 mt-1">Fills the {'{{experience}}'} placeholder in templates.</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-success" />
          </div>
          <h2 className="text-lg font-semibold text-surface-100">Links</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              <Link2 className="w-3 h-3 inline mr-1" />LinkedIn
            </label>
            <input
              className="input"
              placeholder="https://linkedin.com/in/yourprofile"
              value={profile.linkedin}
              onChange={(e) => updateField('linkedin', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              <Code2 className="w-3 h-3 inline mr-1" />GitHub
            </label>
            <input
              className="input"
              placeholder="https://github.com/yourusername"
              value={profile.github}
              onChange={(e) => updateField('github', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              <Globe className="w-3 h-3 inline mr-1" />Portfolio / Website
            </label>
            <input
              className="input"
              placeholder="https://yourportfolio.com"
              value={profile.portfolio}
              onChange={(e) => updateField('portfolio', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Save Bottom Bar */}
      {hasChanges && (
        <div className="sticky bottom-4 p-4 rounded-xl bg-surface-900/95 backdrop-blur-lg border border-surface-700 flex items-center justify-between shadow-2xl animate-fade-in">
          <p className="text-sm text-surface-300">You have unsaved changes</p>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

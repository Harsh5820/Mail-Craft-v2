'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, FileText, Upload, Eye, Lock, Send,
  CheckCircle2, AlertCircle, X,
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

const STEPS = [
  { num: 1, label: 'Template', icon: FileText },
  { num: 2, label: 'Recipients', icon: Upload },
  { num: 3, label: 'Preview', icon: Eye },
  { num: 4, label: 'Credentials', icon: Lock },
  { num: 5, label: 'Launch', icon: Send },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [csvData, setCsvData] = useState([]);
  const [csvStats, setCsvStats] = useState(null);
  const [csvErrors, setCsvErrors] = useState([]);
  const [inputMode, setInputMode] = useState('csv');
  const [emailText, setEmailText] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [credentials, setCredentials] = useState({ email: '', appPassword: '' });
  const [senderInfo, setSenderInfo] = useState({ name: '', skills: '', portfolio: '', linkedin: '', experience: '', github: '', contact_number_1: '', contact_number_2: '' });
  const [resumeBase64, setResumeBase64] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [userPlan, setUserPlan] = useState('free');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok && data.profile) {
        const p = data.profile;
        setSenderInfo({
          name: data.name || '',
          skills: p.skills || '',
          portfolio: p.portfolio || '',
          linkedin: p.linkedin || '',
          experience: p.experience || '',
          github: p.github || '',
          contact_number_1: p.contact_number_1 || '',
          contact_number_2: p.contact_number_2 || '',
        });
        // Auto-fill Gmail from user email
        if (data.email) setCredentials(prev => ({ ...prev, email: data.email }));
        setUserPlan(data.plan || 'free');
        setProfileLoaded(true);
      }
    } catch (err) {
      // Silently fail — user can fill manually
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (res.ok) setTemplates(data.templates);
    } catch (err) { showToast('Failed to load templates', 'error'); }
    finally { setTemplatesLoading(false); }
  };

  useEffect(() => {
    fetchTemplates();
    fetchProfile();
  }, []);

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = await fetch('/api/csv/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text, mode: 'csv' }),
      });
      const data = await res.json();
      setCsvData(data.data || []); setCsvStats(data.stats || null); setCsvErrors(data.errors || []);
      if (data.valid) showToast(`${data.stats.valid} valid recipients found!`);
      else showToast('Some issues found in CSV', 'error');
    } catch (err) { showToast('Failed to validate CSV', 'error'); }
  };

  const handleEmailsPaste = async () => {
    if (!emailText.trim()) return;
    try {
      const res = await fetch('/api/csv/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: emailText, mode: 'emails' }),
      });
      const data = await res.json();
      setCsvData(data.data || []); setCsvStats(data.stats || null); setCsvErrors(data.errors || []);
      if (data.valid) showToast(`${data.stats.valid} valid emails found!`);
      else showToast('Some issues found', 'error');
    } catch (err) { showToast('Failed to validate emails', 'error'); }
  };

  const handleLaunch = async () => {
    setLoading(true);

    try {
      const createRes = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: campaignName || `Campaign ${new Date().toLocaleDateString()}`, 
          templateId: selectedTemplate._id, 
          csvData,
          resumeFileName
        }),
      });
      
      let createData;
      try {
        createData = await createRes.json();
      } catch (parseError) {
        if (!createRes.ok) throw new Error('Payload too large. Please upload a smaller Resume file (Max 1MB).');
        throw new Error('Invalid response from server during creation');
      }
      
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create campaign');
      const campaignId = createData.campaign._id;
      
      // Auto-append @gmail.com if user only typed username
      const gmailEmail = credentials.email.includes('@') 
        ? credentials.email.trim() 
        : `${credentials.email.trim()}@gmail.com`;
      
      const startRes = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: gmailEmail, 
          appPassword: credentials.appPassword, 
          senderName: senderInfo.name, 
          ...senderInfo,
          scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          resumeBase64: !isScheduled ? resumeBase64 : undefined,
          resumeFileName: !isScheduled ? resumeFileName : undefined
        }),
      });
      
      let startData;
      try {
        startData = await startRes.json();
      } catch (parseError) {
        throw new Error('Invalid response from server during start');
      }
      
      if (!startRes.ok) throw new Error(startData.error || 'Failed to start campaign');
      
      showToast('Campaign launched! 🚀');
      router.push(`/dashboard/campaigns/${campaignId}`);
    } catch (err) { 
      showToast(err.message || 'Failed to launch', 'error'); 
    }
    finally { setLoading(false); }
  };

  const canProceed = () => {
    if (step === 1) return selectedTemplate !== null;
    if (step === 2) return csvData.length > 0;
    if (step === 3) return campaignName.trim().length > 0;
    if (step === 4) return credentials.email && credentials.appPassword && senderInfo.name;
    if (step === 5 && isScheduled) return !!scheduledAt;
    return true;
  };

  const renderPreview = () => {
    if (!csvData[0] || !selectedTemplate) return null;
    let html = selectedTemplate.html, subject = selectedTemplate.subject;
    const d = { ...csvData[0], ...senderInfo, user_name: senderInfo.name };
    for (const [k, v] of Object.entries(d)) {
      const r = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
      html = html.replace(r, v || `[${k}]`); subject = subject.replace(r, v || `[${k}]`);
    }
    return { html, subject };
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm"><ArrowLeft className="w-4 h-4" /></button>
        <div><h1 className="text-2xl font-bold text-surface-100">New Campaign</h1><p className="text-sm text-surface-400">Step {step} of 5</p></div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s) => {
          const Icon = s.icon; const isActive = step === s.num; const isDone = step > s.num;
          return (<div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-600/15 text-primary-400' : isDone ? 'bg-success/10 text-success' : 'text-surface-500'}`}>
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}<span className="hidden sm:inline">{s.label}</span>
            </div>
            {s.num < 5 && <div className={`w-6 h-px ${isDone ? 'bg-success' : 'bg-surface-700'}`} />}
          </div>);
        })}
      </div>

      <div className="card mb-6">
        {step === 1 && (<div>
          <h2 className="text-lg font-semibold text-surface-100 mb-4">Choose a Template</h2>
          {templatesLoading ? <div className="h-20 rounded-lg bg-surface-800 animate-shimmer" /> : templates.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-surface-400 mb-4">No templates. Create one first.</p>
              <button onClick={() => router.push('/dashboard/templates')} className="btn btn-primary btn-sm">Create Template</button></div>
          ) : (<div className="space-y-3">{templates.map((t) => (
            <button key={t._id} onClick={() => setSelectedTemplate(t)} className={`w-full text-left p-4 rounded-lg border transition-all ${selectedTemplate?._id === t._id ? 'border-primary-500 bg-primary-600/10' : 'border-surface-800 hover:border-surface-700 bg-surface-800/50'}`}>
              <h3 className="text-sm font-semibold text-surface-200">{t.name}</h3>
              <p className="text-xs text-surface-400 mt-1 truncate">Subject: {t.subject}</p>
            </button>))}</div>)}
        </div>)}

        {step === 2 && (<div>
          <h2 className="text-lg font-semibold text-surface-100 mb-4">Add Recipients</h2>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => { setInputMode('csv'); setCsvData([]); setCsvStats(null); setCsvErrors([]); }}
              className={`btn btn-sm ${inputMode === 'csv' ? 'btn-primary' : 'btn-secondary'}`}>
              <Upload className="w-3.5 h-3.5" /> Upload CSV
            </button>
            <button onClick={() => { setInputMode('emails'); setCsvData([]); setCsvStats(null); setCsvErrors([]); }}
              className={`btn btn-sm ${inputMode === 'emails' ? 'btn-primary' : 'btn-secondary'}`}>
              <FileText className="w-3.5 h-3.5" /> Paste Emails
            </button>
          </div>

          {inputMode === 'csv' && (<div>
            <p className="text-xs text-surface-400 mb-3">Columns: <code className="text-primary-300">company_name, recruiter_email, recruiter_name, job_role</code></p>
            <label className="block w-full p-8 border-2 border-dashed border-surface-700 rounded-xl text-center cursor-pointer hover:border-primary-500 transition-colors">
              <Upload className="w-8 h-8 text-surface-500 mx-auto mb-3" /><p className="text-sm text-surface-300">Click to upload CSV file</p>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          </div>)}

          {inputMode === 'emails' && (<div>
            <p className="text-xs text-surface-400 mb-3">Paste email addresses separated by commas, newlines, or semicolons. Only emails needed — no names or companies.</p>
            <textarea
              className="input min-h-[150px] font-mono text-xs"
              placeholder={"recruiter1@google.com, hr@microsoft.com\njobs@amazon.com; talent@meta.com"}
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
            />
            <button onClick={handleEmailsPaste} className="btn btn-primary btn-sm mt-3" disabled={!emailText.trim()}>
              Validate Emails
            </button>
          </div>)}

          {csvStats && (<div className="mt-4 grid grid-cols-4 gap-3">
            {[{ l: 'Total', v: csvStats.total, c: '' }, { l: 'Valid', v: csvStats.valid, c: 'text-success' }, { l: 'Invalid', v: csvStats.invalid, c: 'text-danger' }, { l: 'Dupes', v: csvStats.duplicates, c: 'text-warning' }].map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-surface-800 text-center"><p className={`text-lg font-bold ${s.c || 'text-surface-100'}`}>{s.v}</p><p className="text-xs text-surface-500">{s.l}</p></div>
            ))}</div>)}

          {csvErrors.length > 0 && (<div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
            <p className="text-xs font-medium text-danger mb-2">Issues:</p>
            <ul className="text-xs text-danger/80 space-y-1 max-h-32 overflow-y-auto">
              {csvErrors.slice(0, 10).map((err, i) => <li key={i}>• {err}</li>)}
            </ul></div>)}

          {csvData.length > 0 && (<div className="mt-4 table-container"><table><thead><tr><th>#</th><th>Email</th>{inputMode === 'csv' && <><th>Company</th><th>Name</th><th>Role</th></>}</tr></thead><tbody>
            {csvData.slice(0, 8).map((row, i) => (<tr key={i}><td>{i + 1}</td><td className="text-primary-300">{row.recruiter_email}</td>{inputMode === 'csv' && <><td>{row.company_name}</td><td>{row.recruiter_name}</td><td>{row.job_role}</td></>}</tr>))}
          </tbody></table>{csvData.length > 8 && <p className="text-xs text-surface-500 text-center py-2">...+{csvData.length - 8} more</p>}</div>)}
        </div>)}

        {step === 3 && (<div>
          <h2 className="text-lg font-semibold text-surface-100 mb-4">Preview & Name</h2>
          <div className="mb-6"><label className="block text-sm font-medium text-surface-300 mb-1.5">Campaign Name</label>
            <input className="input" placeholder="e.g., Frontend Dev Outreach" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} required /></div>
          {(() => { const p = renderPreview(); if (!p) return null; return (<div className="space-y-3">
            <div className="p-3 rounded-lg bg-surface-800/50"><p className="text-xs text-surface-500">To: {csvData[0].recruiter_email}</p><p className="text-xs text-surface-500">Subject: {p.subject}</p></div>
            <div className="p-4 rounded-lg bg-white text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: p.html }} /></div>); })()}
        </div>)}

        {step === 4 && (<div>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Gmail Credentials</h2>
          {profileLoaded && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-600/10 border border-primary-500/20 mb-4">
              <CheckCircle2 className="w-4 h-4 text-primary-400" /><p className="text-xs text-primary-300">Auto-filled from your profile. Only the App Password needs to be entered.</p>
            </div>
          )}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 mb-6">
            <Lock className="w-4 h-4 text-success" /><p className="text-xs text-success">Credentials are encrypted & auto-destroyed after sending.</p></div>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-surface-300 mb-1">Gmail Address</label>
              <input type="email" className="input" placeholder="username or you@gmail.com" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-surface-300 mb-1">Google App Password <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-primary-400 text-xs ml-1">Get one →</a></label>
              <input type="password" className="input" placeholder="xxxx xxxx xxxx xxxx" value={credentials.appPassword} onChange={(e) => setCredentials({ ...credentials, appPassword: e.target.value })} /></div>
            <hr className="border-surface-800" /><h3 className="text-sm font-semibold text-surface-300">Your Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs text-surface-400 mb-1">Name *</label><input className="input" value={senderInfo.name} onChange={(e) => setSenderInfo({ ...senderInfo, name: e.target.value })} /></div>
              <div><label className="block text-xs text-surface-400 mb-1">Skills</label><input className="input" placeholder="React, Node" value={senderInfo.skills} onChange={(e) => setSenderInfo({ ...senderInfo, skills: e.target.value })} /></div>
              <div><label className="block text-xs text-surface-400 mb-1">Experience</label><input className="input" placeholder="3 years" value={senderInfo.experience} onChange={(e) => setSenderInfo({ ...senderInfo, experience: e.target.value })} /></div>
              <div><label className="block text-xs text-surface-400 mb-1">LinkedIn</label><input className="input" value={senderInfo.linkedin} onChange={(e) => setSenderInfo({ ...senderInfo, linkedin: e.target.value })} /></div>
              <div><label className="block text-xs text-surface-400 mb-1">Portfolio</label><input className="input" value={senderInfo.portfolio} onChange={(e) => setSenderInfo({ ...senderInfo, portfolio: e.target.value })} /></div>
              <div><label className="block text-xs text-surface-400 mb-1">GitHub</label><input className="input" placeholder="https://github.com/username" value={senderInfo.github} onChange={(e) => setSenderInfo({ ...senderInfo, github: e.target.value })} /></div>
              <div><label className="block text-xs text-surface-400 mb-1">Contact #1</label><input className="input" placeholder="+91 99999 99999" value={senderInfo.contact_number_1} onChange={(e) => setSenderInfo({ ...senderInfo, contact_number_1: e.target.value })} /></div>
              <div><label className="block text-xs text-surface-400 mb-1">Contact #2</label><input className="input" placeholder="Alternate number" value={senderInfo.contact_number_2} onChange={(e) => setSenderInfo({ ...senderInfo, contact_number_2: e.target.value })} /></div>
            </div>
            
            <hr className="border-surface-800" /><h3 className="text-sm font-semibold text-surface-300">Attachments (Optional)</h3>
            <div>
              <label className="block w-full p-4 border-2 border-dashed border-surface-700 rounded-xl text-center cursor-pointer hover:border-primary-500 transition-colors bg-surface-800/30">
                <p className="text-sm text-surface-300">
                  {resumeFileName ? <><CheckCircle2 className="w-4 h-4 inline text-success mr-2" /> {resumeFileName}</> : 'Click to attach your Resume (PDF/DOC)'}
                </p>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 1024 * 1024) {
                      showToast('File too large. Max 1MB.', 'error');
                      return;
                    }
                    setResumeFileName(file.name);
                    const reader = new FileReader();
                    reader.onloadend = () => setResumeBase64(reader.result);
                    reader.readAsDataURL(file);
                    e.target.value = ''; // Reset input so same file can be selected again
                  }} 
                />
              </label>
              {resumeFileName && (
                <button onClick={() => { setResumeFileName(''); setResumeBase64(''); }} className="text-xs text-danger mt-2 hover:underline">
                  Remove attachment
                </button>
              )}
            </div>
          </div>
        </div>)}

        {step === 5 && (<div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 animate-pulse-glow"><Send className="w-7 h-7 text-white" /></div>
          <h2 className="text-2xl font-bold text-surface-100 mb-2">Ready to Launch</h2>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left my-6">
            {[{ l: 'Template', v: selectedTemplate?.name }, { l: 'Recipients', v: `${csvData.length} emails` }, { l: 'Campaign', v: campaignName }, { l: 'Sender', v: senderInfo.name }].map((i, k) => (
              <div key={k} className="p-3 rounded-lg bg-surface-800/50"><p className="text-xs text-surface-500">{i.l}</p><p className="text-sm font-medium text-surface-200">{i.v}</p></div>))}
          </div>
          
          <div className="max-w-md mx-auto mb-6 text-left p-4 rounded-xl border border-surface-700 bg-surface-800/30">
            <h3 className="text-sm font-medium text-surface-200 mb-3">When should we send this?</h3>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!isScheduled} onChange={() => setIsScheduled(false)} className="text-primary-500 bg-surface-900 border-surface-700 focus:ring-primary-500" />
                <span className="text-sm text-surface-300">Send Now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={isScheduled} onChange={() => setIsScheduled(true)} disabled={userPlan === 'free'} className="text-primary-500 bg-surface-900 border-surface-700 focus:ring-primary-500 disabled:opacity-50" />
                <span className={`text-sm ${userPlan === 'free' ? 'text-surface-500' : 'text-surface-300'}`}>
                  Schedule for Later {userPlan === 'free' && <span className="text-[10px] bg-primary-600/20 text-primary-400 px-1.5 py-0.5 rounded ml-1">Premium</span>}
                </span>
              </label>
            </div>
            
            {isScheduled && (
              <div className="animate-slide-up">
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Select Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="input text-sm" 
                  value={scheduledAt} 
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)} // Min 5 mins from now
                />
                <p className="text-xs text-surface-500 mt-2">Maximum 7 days in advance. Requires active Premium plan.</p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 max-w-md mx-auto mb-6">
            <p className="text-xs text-warning">⏱ Anti-spam delays will be applied. Campaign may take hours.</p></div>
          <button onClick={handleLaunch} className="btn btn-primary btn-lg" disabled={loading || (isScheduled && !scheduledAt)}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isScheduled ? 'Scheduling...' : 'Launching...'}</> : <>{isScheduled ? 'Schedule Campaign' : 'Launch Campaign'} <Send className="w-4 h-4" /></>}
          </button>
        </div>)}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setStep(Math.max(1, step - 1))} className="btn btn-secondary" disabled={step === 1}><ArrowLeft className="w-4 h-4" /> Back</button>
        {step < 5 && <button onClick={() => setStep(Math.min(5, step + 1))} className="btn btn-primary" disabled={!canProceed()}>Continue <ArrowRight className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}

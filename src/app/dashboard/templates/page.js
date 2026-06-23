/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Copy, Trash2, Edit3, Eye, X } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', html: '' });
  const [saving, setSaving] = useState(false);
  const [aiObjective, setAiObjective] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok && data.profile) {
        setUserProfile({ name: data.name, ...data.profile });
      }
    } catch (err) {}
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (res.ok) setTemplates(data.templates);
    } catch (err) {
      showToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchProfile();
  }, []);

  const renderLivePreview = () => {
    let { html, subject } = form;
    const d = {
      user_name: userProfile?.name || '[Your Name]',
      skills: userProfile?.skills || '[Your Skills]',
      experience: userProfile?.experience || '[Your Experience]',
      portfolio: userProfile?.portfolio || '[Portfolio URL]',
      linkedin: userProfile?.linkedin || '[LinkedIn URL]',
      github: userProfile?.github || '[GitHub URL]',
      contact_number_1: userProfile?.contact_number_1 || '[Contact]',
      contact_number_2: userProfile?.contact_number_2 || '',
      company_name: 'Acme Corp',
      recruiter_name: 'Alex',
      job_role: 'Senior Developer'
    };
    
    for (const [k, v] of Object.entries(d)) {
      const r = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
      html = html.replace(r, v);
      subject = subject.replace(r, v);
    }
    return { html, subject };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingTemplate
        ? `/api/templates/${editingTemplate._id}`
        : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(editingTemplate ? 'Template updated!' : 'Template created!');
      setShowModal(false);
      setEditingTemplate(null);
      setForm({ name: '', subject: '', html: '' });
      fetchTemplates();
    } catch (err) {
      showToast(err.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate');
      showToast('Template duplicated!');
      fetchTemplates();
    } catch (err) {
      showToast('Failed to duplicate template', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Template deleted');
      fetchTemplates();
    } catch (err) {
      showToast('Failed to delete template', 'error');
    }
  };

  const openEdit = (template) => {
    setEditingTemplate(template);
    setForm({ name: template.name, subject: template.subject, html: template.html });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setForm({
      name: '',
      subject: 'Application for {{job_role}} at {{company_name}}',
      html: `<p>Dear {{recruiter_name}},</p>
<p>I am writing to express my interest in the <strong>{{job_role}}</strong> position at <strong>{{company_name}}</strong>.</p>
<p>With my experience in {{skills}}, I believe I would be a strong fit for this role.</p>
<p>Please find my resume attached for your review. I would welcome the opportunity to discuss how my background aligns with your team's needs.</p>
<p>Best regards,<br/>{{user_name}}</p>
<p><a href="{{linkedin}}">LinkedIn</a> | <a href="{{github}}">GitHub</a> | <a href="{{portfolio}}">Portfolio</a></p>`,
    });
    setAiObjective('');
    setShowModal(true);
  };

  const handleAIGenerate = async () => {
    if (!aiObjective.trim() || aiObjective.trim().length < 10) {
      showToast('Please provide a descriptive objective (min 10 characters)', 'error');
      return;
    }
    
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: aiObjective }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setForm(prev => ({
        ...prev,
        subject: data.subject,
        html: data.html,
      }));
      showToast(`Template generated! (${data.remainingGenerations} generations left today)`);
    } catch (err) {
      showToast(err.message || 'Failed to generate template', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 mb-1">Email Templates</h1>
          <p className="text-sm text-surface-400">
            Create reusable templates with placeholders like {'{{company_name}}'}, {'{{recruiter_name}}'}, etc.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Placeholder Variables Reference */}
      <div className="card mb-6 p-4">
        <p className="text-xs font-medium text-surface-400 light:text-surface-300 mb-2">Available Placeholders:</p>
        <div className="flex flex-wrap gap-2">
          {['company_name', 'recruiter_name', 'recruiter_email', 'job_role', 'user_name', 'skills', 'github', 'portfolio', 'linkedin', 'experience', 'contact_number_1', 'contact_number_2'].map((p) => (
            <code key={p} className="px-2 py-0.5 rounded bg-primary-600/10 text-primary-300 light:text-surface-200 text-xs font-mono">
              {`{{${p}}}`}
            </code>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-surface-800 animate-shimmer" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-200 mb-2">No templates yet</h3>
          <p className="text-sm text-surface-400 mb-6">Create your first email template to get started.</p>
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t._id} className="glass-card p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-surface-100 truncate flex-1">{t.name}</h3>
              </div>
              <p className="text-xs text-surface-400 mb-2 truncate">
                Subject: {t.subject}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.placeholders?.slice(0, 4).map((p) => (
                  <span key={p} className="badge badge-primary text-[10px]">{p}</span>
                ))}
                {t.placeholders?.length > 4 && (
                  <span className="badge badge-neutral text-[10px]">+{t.placeholders.length - 4}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-surface-800">
                <button onClick={() => setPreviewTemplate(t)} className="btn btn-ghost btn-sm flex-1" title="Preview">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button onClick={() => openEdit(t)} className="btn btn-ghost btn-sm" title="Edit">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDuplicate(t._id)} className="btn btn-ghost btn-sm" title="Duplicate">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(t._id)} className="btn btn-ghost btn-sm text-danger" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-surface-100">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Form Side */}
              <form onSubmit={handleSave} className="flex-1 space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Template Name</label>
                <input
                  className="input"
                  placeholder="e.g., Frontend Developer Application"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* AI Generator Section */}
              <div className="p-4 rounded-xl border border-primary-500/20 bg-gradient-to-br from-primary-600/10 to-transparent">
                <label className="block text-sm font-medium text-primary-300 mb-1.5 flex items-center gap-2">
                  ✨ Write with Gemini (Premium)
                </label>
                <p className="text-xs text-surface-400 mb-3">Describe the role, company, or tone you want, and AI will write the template using your profile.</p>
                <div className="flex gap-2">
                  <input
                    className="input text-sm flex-1"
                    placeholder="e.g., A casual outreach for a Senior React dev role at an AI startup..."
                    value={aiObjective}
                    onChange={(e) => setAiObjective(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={handleAIGenerate} 
                    disabled={generatingAI || !aiObjective.trim()} 
                    className="btn btn-primary whitespace-nowrap"
                  >
                    {generatingAI ? 'Generating...' : 'Generate (Limit: 2/day)'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Subject</label>
                <input
                  className="input"
                  placeholder="Application for {{job_role}} at {{company_name}}"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Body (HTML)</label>
                <textarea
                  className="input min-h-[250px] font-mono text-xs leading-relaxed"
                  placeholder="Write your email body with placeholders..."
                  value={form.html}
                  onChange={(e) => setForm({ ...form, html: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
              </form>

              {/* Live Preview Side */}
              <div className="flex-1 bg-surface-800/30 rounded-xl p-5 border border-surface-700 flex flex-col">
                <h3 className="text-sm font-semibold text-primary-400 mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Live Preview
                </h3>
                {(() => {
                  const p = renderLivePreview();
                  return (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="p-3 rounded-lg bg-surface-800/80">
                        <p className="text-xs text-surface-500 mb-1">Subject</p>
                        <p className="text-sm font-medium text-surface-200">{p.subject || '—'}</p>
                      </div>
                      <div 
                        className="p-4 rounded-lg bg-white text-gray-800 text-sm leading-relaxed flex-1 overflow-y-auto min-h-[250px]"
                        dangerouslySetInnerHTML={{ __html: p.html || '<p class="text-gray-400">Email body preview...</p>' }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-surface-100">Preview: {previewTemplate.name}</h2>
              <button onClick={() => setPreviewTemplate(null)} className="text-surface-400 hover:text-surface-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-surface-800/50">
                <p className="text-xs text-surface-500 mb-1">Subject</p>
                <p className="text-sm text-surface-200">{previewTemplate.subject}</p>
              </div>
              <div className="p-4 rounded-lg bg-white text-gray-800 text-sm leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

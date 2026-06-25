'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Phone, Globe, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

export default function OnboardingWizard({ initialName = '' }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialName,
    headline: '',
    location: '',
    contact_number_1: '',
    contact_number_2: '',
    linkedin: '',
    github: '',
    portfolio: '',
    skills: '',
    experience: '',
    interests: '',
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleFinish = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    const { name, ...profileData } = formData;
    const updatePayload = {
      name,
      profile: profileData,
      onboardingCompleted: true
    };
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      
      if (!res.ok) throw new Error('Failed to save profile');
      
      showToast('Welcome to MailCraft!', 'success');
      // Hard reload to refresh layout state
      window.location.href = '/dashboard';
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(false);
    }
  };

  const skipAndFinish = async () => {
    // If they skip completely, just mark onboardingCompleted: true
    try {
      setLoading(true);
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      window.location.href = '/dashboard';
    } catch (err) {
      showToast('Failed to complete onboarding', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 sm:px-6">
      <div className="w-full max-w-2xl bg-surface-900 border border-surface-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Progress Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-sm">
                ✨
              </span>
              Setup your Profile
            </h1>
            <div className="text-sm font-semibold text-surface-500">
              Step {step} of 4
            </div>
          </div>
          
          <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden flex">
            <div className="bg-primary-500 h-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={(e) => { e.preventDefault(); step === 4 ? handleFinish() : handleNext(); }}>
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-100">Basic Info</h2>
                    <p className="text-xs text-surface-400">Tell us a bit about yourself.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name</label>
                  <input className="input" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Headline / Title</label>
                  <input className="input" value={formData.headline} onChange={e => updateField('headline', e.target.value)} placeholder="Senior Software Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Location</label>
                  <input className="input" value={formData.location} onChange={e => updateField('location', e.target.value)} placeholder="San Francisco, CA" />
                </div>
              </div>
            )}

            {/* STEP 2: Contact Details */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-100">Contact Info</h2>
                    <p className="text-xs text-surface-400">How recruiters can reach you.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Personal No</label>
                  <input type="tel" className="input" value={formData.contact_number_1} onChange={e => updateField('contact_number_1', e.target.value)} placeholder="+1 234 567 890" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Alternative No (Optional)</label>
                  <input type="tel" className="input" value={formData.contact_number_2} onChange={e => updateField('contact_number_2', e.target.value)} placeholder="Alternative contact" />
                </div>
              </div>
            )}

            {/* STEP 3: Web Presence */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-100">Web Presence</h2>
                    <p className="text-xs text-surface-400">Add your online portfolios.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">LinkedIn URL</label>
                  <input type="url" className="input" value={formData.linkedin} onChange={e => updateField('linkedin', e.target.value)} placeholder="https://linkedin.com/in/username" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">GitHub URL</label>
                  <input type="url" className="input" value={formData.github} onChange={e => updateField('github', e.target.value)} placeholder="https://github.com/username" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Portfolio / Website</label>
                  <input type="url" className="input" value={formData.portfolio} onChange={e => updateField('portfolio', e.target.value)} placeholder="https://yourportfolio.com" />
                </div>
              </div>
            )}

            {/* STEP 4: Expertise */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-100">Expertise</h2>
                    <p className="text-xs text-surface-400">Power your AI-generated templates.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Top Skills</label>
                  <input className="input" value={formData.skills} onChange={e => updateField('skills', e.target.value)} placeholder="React, Node.js, Python..." />
                  <p className="text-[10px] text-surface-500 mt-1">Comma separated.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Experience Summary</label>
                  <textarea className="input" rows="3" value={formData.experience} onChange={e => updateField('experience', e.target.value)} placeholder="5 years building scalable web apps..." />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-surface-800">
              <button 
                type="button" 
                onClick={skipAndFinish}
                className="text-sm font-medium text-surface-400 hover:text-surface-200 transition-colors"
                disabled={loading}
              >
                Skip all
              </button>
              
              <div className="flex gap-3">
                {step > 1 && (
                  <button 
                    type="button" 
                    onClick={() => setStep(step - 1)}
                    className="btn border border-surface-700 bg-surface-800 hover:bg-surface-700 text-surface-200"
                    disabled={loading}
                  >
                    Back
                  </button>
                )}
                
                {step < 4 ? (
                  <button type="submit" className="btn btn-primary flex items-center gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleFinish} disabled={loading} className="btn bg-success text-white hover:bg-success/90 flex items-center gap-2">
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Complete Setup <CheckCircle2 className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import {
  Mail,
  Shield,
  Zap,
  BarChart3,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Smart Templates',
    desc: 'Create reusable email templates with dynamic placeholders like {{company_name}}, {{recruiter_name}}, and more.',
  },
  {
    icon: Shield,
    title: 'Zero Storage',
    desc: 'Your Gmail credentials are never stored. They exist only during active sending and are destroyed immediately after.',
  },
  {
    icon: Clock,
    title: 'Anti-Spam Engine',
    desc: 'Randomized delays, batch sending, and cooldown periods mimic human behavior to protect your deliverability.',
  },
  {
    icon: Zap,
    title: 'CSV Upload',
    desc: 'Upload recruiter lists as CSV. Automatic validation, duplicate detection, and email format checking.',
  },
  {
    icon: BarChart3,
    title: 'Live Tracking',
    desc: 'Watch your campaign progress in real-time. Sent, pending, failed — all tracked automatically.',
  },
  {
    icon: Sparkles,
    title: 'Pause & Resume',
    desc: 'Full control over your campaigns. Pause anytime, resume when ready. No emails are lost.',
  },
];

const steps = [
  { num: '01', title: 'Create Template', desc: 'Design your email with placeholders for personalization.' },
  { num: '02', title: 'Upload CSV', desc: 'Add your recruiter list with company names and emails.' },
  { num: '03', title: 'Preview & Send', desc: 'Review personalized emails, enter credentials, and launch.' },
  { num: '04', title: 'Track Progress', desc: 'Monitor real-time sending with anti-spam protection.' },
];

const pricing = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['20 emails/day', '2 templates', '3 campaigns/month', 'Basic analytics'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Daily',
    price: '₹10',
    period: '/day',
    features: ['100 emails/day', '50 templates', '30 campaigns/month', 'Priority sending', 'Resume attachment'],
    cta: 'Get Daily',
    popular: false,
  },
  {
    name: 'Monthly',
    price: '₹1,000',
    period: '/month',
    features: ['300 emails/day', 'Unlimited templates', 'Unlimited campaigns', 'Advanced analytics', 'Priority support', 'API access'],
    cta: 'Go Monthly',
    popular: true,
  },
];

import { getSession } from '@/lib/auth';

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-100">MailCraft</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-surface-400 hover:text-surface-200 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-surface-400 hover:text-surface-200 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm text-surface-400 hover:text-surface-200 transition-colors">Pricing</a>
            <a href="#security" className="text-sm text-surface-400 hover:text-surface-200 transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 px-6 gradient-bg-hero overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[128px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-400/10 rounded-full blur-[96px] animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-600/10 border border-primary-500/20 mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs font-medium text-primary-300">Professional Recruiter Outreach Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            <span className="gradient-text-hero">Send Smarter,</span>
            <br />
            <span className="text-surface-100">Land Faster</span>
          </h1>

          <p className="text-lg md:text-xl text-surface-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Personalized job application emails at scale. Anti-spam protection, reusable templates,
            and real-time tracking — all with zero credential storage.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {session?.user ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href="/register" className="btn btn-primary btn-lg">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              See How It Works
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-surface-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> No spam</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> No card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> Credentials never stored</span>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-100 mb-4">Everything You Need</h2>
            <p className="text-surface-400 max-w-xl mx-auto">
              Professional outreach tools designed with security and deliverability as the top priority.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass-card p-6 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 px-6 bg-surface-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-100 mb-4">How It Works</h2>
            <p className="text-surface-400">Four simple steps to professional recruiter outreach.</p>
          </div>

          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-6 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {s.num}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-100 mb-1">{s.title}</h3>
                  <p className="text-surface-400 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECURITY ===== */}
      <section id="security" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 text-center">
            <Shield className="w-12 h-12 text-primary-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-surface-100 mb-4">Security First</h2>
            <p className="text-surface-400 max-w-xl mx-auto mb-8">
              Your credentials are never permanently stored. They exist only during active sending,
              remain encrypted in memory, and are automatically destroyed after campaign completion.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                { title: 'Zero Storage', desc: 'Credentials destroyed after each campaign' },
                { title: 'Encrypted Memory', desc: 'AES-256 encryption during active sending' },
                { title: 'Audit Logs', desc: 'Every action tracked, sensitive data masked' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-surface-800/50">
                  <h4 className="text-sm font-semibold text-primary-300 mb-1">{item.title}</h4>
                  <p className="text-xs text-surface-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 px-6 bg-surface-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-100 mb-4">Simple Pricing</h2>
            <p className="text-surface-400">Start free. Upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <div
                key={i}
                className={`glass-card p-8 relative ${plan.popular ? 'border-primary-500/50 animate-pulse-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-600 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-surface-100 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-surface-100">{plan.price}</span>
                  <span className="text-surface-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-surface-300">
                      <CheckCircle2 className="w-4 h-4 text-primary-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-6 border-t border-surface-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-semibold text-surface-300">MailCraft</span>
          </div>
          <p className="text-xs text-surface-500">
            © {new Date().getFullYear()} MailCraft. Built for professional job seekers.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs text-surface-400 hover:text-surface-200 transition-colors">Login</Link>
            <Link href="/register" className="text-xs text-surface-400 hover:text-surface-200 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Case Management",
    description: "Organize investigations with structured case files, timelines, and activity logs.",
    icon: "🗂",
  },
  {
    title: "OSINT Pipeline",
    description: "Run automated open-source intelligence queries across multiple data providers.",
    icon: "🔍",
  },
  {
    title: "Digital Evidence Tracking",
    description: "Securely upload, tag, and chain-of-custody track all digital evidence.",
    icon: "🧩",
  },
  {
    title: "AI Assistant (AURA)",
    description: "Conversational AI that surfaces insights, summarizes cases, and aids analysis.",
    icon: "🤖",
  },
  {
    title: "PDF Report Generation",
    description: "Generate professional, branded investigation reports in one click.",
    icon: "📄",
  },
  {
    title: "Role-Based Access Control",
    description: "Fine-grained permissions for analysts, investigators, and administrators.",
    icon: "🔐",
  },
];

const stack = [
  { name: "Django", category: "Backend" },
  { name: "DRF", category: "API" },
  { name: "PostgreSQL", category: "Database" },
  { name: "JWT", category: "Auth" },
  { name: "Next.js", category: "Frontend" },
  { name: "TypeScript", category: "Language" },
  { name: "Stripe", category: "Billing" },
  { name: "Anthropic API", category: "AI" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">

      {/* Nav */}
      <nav className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Image src="/logo.png" alt="ShadowSight" width={140} height={48} className="object-contain" priority />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 rounded-md bg-[#C4922A] hover:bg-[#A67822] text-white font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-28 flex flex-col items-center text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#C4922A]/30 bg-[#C4922A]/10 text-[#C4922A] text-xs font-medium mb-8 tracking-widest uppercase">
          Intelligence Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          ShadowSight <span className="text-[#C4922A]">Intelligence</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 tracking-[0.25em] uppercase font-light mb-10">
          Precision. Intelligence. Truth.
        </p>
        <p className="text-gray-500 max-w-xl text-base mb-12 leading-relaxed">
          A unified platform for investigators, analysts, and security professionals — combining case management, OSINT automation, and AI-powered insights.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="px-8 py-3 rounded-md bg-[#C4922A] hover:bg-[#A67822] text-white font-semibold text-sm transition-colors tracking-wide"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded-md border border-[#333] hover:border-[#C4922A]/50 text-gray-300 hover:text-white font-semibold text-sm transition-colors tracking-wide"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#C4922A]/30 to-transparent" />
      </div>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Built for Modern Investigations</h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Every tool an investigator needs — purpose-built and integrated into one secure platform.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-6 hover:border-[#C4922A]/40 transition-colors"
            >
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#C4922A]/30 to-transparent" />
      </div>

      {/* Tech Stack */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Enterprise-Grade Stack</h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Reliable, scalable technologies chosen for security and performance.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {stack.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#222] bg-[#0d0d0d] hover:border-[#C4922A]/40 transition-colors"
            >
              <span className="text-xs text-[#C4922A] font-medium tracking-wider uppercase">{s.category}</span>
              <span className="text-gray-300 text-sm font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-[#C4922A]/20 bg-gradient-to-br from-[#0d0d0d] to-[#111] p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Create your account and begin managing investigations with the precision your work demands.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 rounded-md bg-[#C4922A] hover:bg-[#A67822] text-white font-semibold text-sm transition-colors tracking-wide"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/logo.png" alt="ShadowSight" width={100} height={34} className="object-contain opacity-60" />
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} ShadowSight Intelligence. All rights reserved.
          </p>
          <a
            href="https://github.com/butlerboy94/shadowsight-backend"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-[#C4922A] text-xs transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

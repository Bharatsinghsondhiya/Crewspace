import { ReactNode } from "react";
import { Link } from "wouter";
import { Shield, Zap, Users, ArrowLeft } from "lucide-react";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent relative overflow-hidden">

      {/* LEFT — Form Panel */}
      <div className="flex-1 flex flex-col p-4 md:p-8 z-20 relative overflow-y-auto min-h-screen">
        
        {/* Back to Home Button - Placed neatly at the top */}
        <div className="w-full flex justify-start mt-2 mb-8 md:mb-0 md:absolute md:top-8 md:left-8 z-50 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Purple glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md max-h-[600px] bg-gradient-to-tr from-purple-700/20 via-violet-900/25 to-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 mb-12 md:mb-0">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-black tracking-tight text-white uppercase">{title}</h1>
              <p className="text-white/70 text-base font-medium">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>

      {/* RIGHT — Branding / Galaxy Panel */}
      <div className="hidden md:flex flex-1 relative flex-col justify-center items-center p-12 overflow-hidden z-10">
        {/* Cosmic galaxy orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-950/60 to-black/80" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-800/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[160px] pointer-events-none" />

        {/* Starfield dots */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        <div className="z-20 w-full max-w-sm space-y-10 flex flex-col items-center text-center relative">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-purple-400/30">
              <span className="text-white text-2xl font-black leading-none">C</span>
            </div>
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-200 to-fuchsia-300">Crewspace</span>
          </div>

          <p className="text-xl font-light text-white/80 leading-relaxed">
            All your work,<br />organized in one space.
          </p>

          <div className="w-full space-y-4 text-left">
            <div className="flex items-start gap-4 p-4 rounded-2xl border border-purple-500/15"
              style={{ background: "rgba(139,92,246,0.06)" }}>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-white/90 font-semibold text-sm">Secure & Reliable</p>
                <p className="text-white/45 text-xs mt-0.5">Enterprise-grade security for your data</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl border border-purple-500/15"
              style={{ background: "rgba(139,92,246,0.06)" }}>
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white/90 font-semibold text-sm">Fast & Efficient</p>
                <p className="text-white/45 text-xs mt-0.5">Built for performance and speed</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl border border-purple-500/15"
              style={{ background: "rgba(139,92,246,0.06)" }}>
              <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div>
                <p className="text-white/90 font-semibold text-sm">Team Collaboration</p>
                <p className="text-white/45 text-xs mt-0.5">Work together seamlessly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

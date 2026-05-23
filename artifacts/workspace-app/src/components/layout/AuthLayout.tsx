import { ReactNode } from "react";
import { Link } from "wouter";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 z-20 relative overflow-hidden">
        {/* Deep, rich glow behind the form for high text contrast */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-[600px] bg-gradient-to-tr from-primary/20 via-fuchsia-900/30 to-indigo-900/30 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md space-y-6 bg-black/40 backdrop-blur-3xl p-8 md:p-10 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden md:flex flex-1 relative flex-col justify-center items-center p-12 overflow-hidden z-10">
        <div className="z-20 w-full max-w-md space-y-12 flex flex-col items-center text-center">
          <div>
            <div className="flex items-center justify-center gap-3 text-4xl font-bold text-white mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-primary-foreground text-2xl leading-none">C</span>
              </div>
              Crewspace
            </div>
            <p className="text-2xl font-medium text-white/90 leading-relaxed">
              Industrial-grade workspace for power teams.
            </p>
          </div>
          <div className="w-full p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl relative text-left">
            <p className="text-white/80 italic text-lg leading-relaxed relative z-10">
              "Crewspace gave us the control we needed to orchestrate 50+ projects simultaneously without dropping a single task."
            </p>
            <div className="mt-6 font-semibold text-sm text-primary uppercase tracking-wider">
              — Director of Operations, Nexus Systems
            </div>
          </div>
        </div>
        {/* Neon glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from "wouter";
import {
  Command as CommandIcon, CheckCircle2, Circle, Play, Calendar,
  Inbox, Hash, ArrowRight, Zap, RefreshCw, Layers,
  Terminal, Check, Activity, Link as LinkIcon, Lock
} from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-8 border-b border-purple-500/20 pb-4">
    <span className="text-purple-400 font-mono text-lg font-light">⟩</span>
    <h2 className="text-lg md:text-xl font-medium text-white tracking-tight">{title}</h2>
  </div>
);

const AnimatedHeroUI = () => {
  const [activeTask, setActiveTask] = useState(0);
  const [timer, setTimer] = useState(25 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTask((prev) => (prev + 1) % 4);
      setTimer((prev) => (prev > 0 ? prev - 1 : 25 * 60));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tasks = [
    { id: 1, title: "Draft Q3 roadmap", project: "Strategy", status: "in-progress" },
    { id: 2, title: "Review product copy", project: "Marketing", status: "todo" },
    { id: 3, title: "Sync with engineering", project: "Meetings", status: "todo" },
    { id: 4, title: "Finalize design system", project: "Design", status: "done" },
  ];

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-16 rounded-xl border border-purple-500/30 bg-[#0a051a]/80 backdrop-blur-xl shadow-2xl overflow-hidden font-mono text-sm shadow-purple-500/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-black/40">
        <div className="flex space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>
        <div className="text-purple-300/70 text-xs flex items-center gap-2">
          <Activity size={12} className="text-purple-400" />
          System Active
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 h-[400px]">
        {/* Sidebar */}
        <div className="hidden md:block border-r border-purple-500/20 p-4 bg-black/20">
          <div className="text-purple-300/50 text-xs mb-4 uppercase tracking-wider">Views</div>
          <div className="space-y-2 text-purple-200/70">
            <div className="flex items-center gap-2 text-white bg-purple-500/20 border border-purple-500/20 px-2 py-1.5 rounded"><Inbox size={14} /> Inbox</div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:text-white transition-colors"><Calendar size={14} /> Today</div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:text-white transition-colors"><Layers size={14} /> Projects</div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:text-white transition-colors"><Activity size={14} /> Review</div>
          </div>
          
          <div className="text-purple-300/50 text-xs mb-4 mt-8 uppercase tracking-wider">Focus Engine</div>
          <div className="flex items-center justify-center p-4 border border-purple-500/30 rounded-full bg-purple-950/30 relative">
            <div className="absolute inset-0 rounded-full border border-purple-400/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"></div>
            <span className="text-purple-300 font-medium text-lg tracking-widest drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
              {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-2 p-6 bg-transparent">
          <div className="text-purple-300/50 text-xs mb-6 uppercase tracking-wider flex justify-between">
            <span>Today's Flow</span>
            <span className="text-purple-300/70 border border-purple-500/20 px-2 py-0.5 rounded bg-black/20">⌘ K</span>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tasks.map((task, idx) => {
                const isActive = activeTask === idx;
                const isDone = task.status === 'done' || (activeTask > idx && activeTask !== 3);
                
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${isActive ? 'border-purple-400/40 bg-purple-500/10' : 'border-white/5 bg-white/5'} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-purple-400" />
                      ) : isActive ? (
                        <Play size={16} className="text-purple-300" />
                      ) : (
                        <Circle size={16} className="text-white/30" />
                      )}
                      <span className={`${isDone ? 'text-white/40 line-through' : 'text-white/90'}`}>
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isActive ? 'border-purple-400/40 text-purple-300 bg-purple-500/10' : 'border-white/10 text-white/50'}`}>
                        {task.project}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          
          {/* Animated terminal logs */}
          <div className="mt-8 border-t border-purple-500/20 pt-4">
            <div className="text-purple-300/60 text-[10px] space-y-1">
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.5}}>» syncing calendar events...</motion.div>
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.5}}>» auto-tagging 2 new notes</motion.div>
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 2.5}}>» focus session logged (25m)</motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FloatingBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      {/* Moving code/productivity symbols */}
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.03, 0.15, 0.03] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[10%] text-purple-400 font-mono text-2xl"
      >
        {`{ }`}
      </motion.div>
      <motion.div
        animate={{ y: [0, 30, 0], opacity: [0.03, 0.15, 0.03] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[60%] left-[5%] text-fuchsia-400 font-mono text-3xl"
      >
        ⌘
      </motion.div>
      <motion.div
        animate={{ y: [0, -40, 0], rotate: [0, 90, 0], opacity: [0.03, 0.12, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[15%] right-[15%] text-violet-400"
      >
        <CommandIcon size={48} />
      </motion.div>
      <motion.div
        animate={{ y: [0, 25, 0], opacity: [0.03, 0.15, 0.03] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-[70%] right-[10%] text-purple-400 font-mono text-4xl font-light"
      >
        /
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.12, 0.03] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-[40%] right-[5%] text-white"
      >
        <CheckCircle2 size={32} />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.12, 0.03], y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute top-[35%] left-[15%] text-indigo-400"
      >
        <Layers size={40} />
      </motion.div>
    </div>
  );
};

export default function Landing() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="h-screen w-full overflow-y-auto bg-transparent scroll-smooth relative">
      <FloatingBackground />
      <div className="min-h-full flex flex-col text-white font-sans selection:bg-purple-500/30 relative z-10">
        {/* Simple Inline Navbar */}
        <nav className="w-full border-b border-white/5 bg-transparent sticky top-0 z-50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-violet-700 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-purple-400/30">
                <span className="text-white text-base sm:text-lg font-black leading-none">C</span>
              </div>
              <span className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-200 to-fuchsia-300 hidden sm:inline-block">Crewspace</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setLocation('/login')}
                className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors px-2 sm:px-0"
              >
                Log in
              </button>
              <button 
                onClick={() => setLocation('/signup')}
                className="text-xs sm:text-sm font-medium bg-purple-600/20 border border-purple-500/50 text-purple-100 px-3 sm:px-4 py-1.5 rounded hover:bg-purple-600/40 transition-colors"
              >
                Get Access
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-grow pt-24 pb-32">
          {/* HERO SECTION */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto mb-32">
            <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-mono mb-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                v2.0 OS Live
              </div>
              <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight leading-tight">
                Your personal operating <br /> system for focused work.
              </h1>
              <p className="text-base sm:text-lg text-white/60 max-w-xl leading-relaxed px-4 sm:px-0">
                Plan less. Execute better. Review everything. A calm, keyboard-first command center for your tasks, routines, notes, and deep work.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-4 w-full sm:w-auto px-6 sm:px-0">
                <button 
                  onClick={() => setLocation('/login')}
                  className="w-full sm:w-auto h-12 sm:h-11 px-6 rounded-lg bg-white text-black hover:bg-white/90 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Initialize Workspace <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => setOpen(true)}
                  className="w-full sm:w-auto h-12 sm:h-11 px-6 rounded-lg border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30 text-purple-100 text-sm font-medium transition-colors font-mono flex items-center justify-center gap-2"
                >
                  <CommandIcon size={14} className="sm:hidden" /> ⌘ K to explore
                </button>
              </div>
            </div>
            
            <AnimatedHeroUI />
          </section>

          {/* MAIN CAPABILITIES */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto mb-32 grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <SectionHeader title="Daily Flow" />
              <div className="space-y-6">
                <p className="text-white/60 leading-relaxed text-base">
                  Turn chaotic task lists into a streamlined execution pipeline. The system auto-prioritizes your inbox, schedules deep work blocks, and tracks momentum.
                </p>
                <div className="border border-white/10 bg-white/5 p-5 rounded-xl font-mono text-sm space-y-3 shadow-lg">
                  <div className="flex justify-between items-center text-white/50 border-b border-white/10 pb-2">
                    <span>pipeline.status</span>
                    <span className="text-purple-400">optimal</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Check size={14} className="text-white/40" />
                    <span>Morning Routine</span>
                    <span className="ml-auto text-white/40">08:00</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Activity size={14} className="text-purple-400" />
                    <span>Deep Work: Strategy</span>
                    <span className="ml-auto text-purple-400">09:30</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Circle size={14} className="text-white/40" />
                    <span>Inbox Zero</span>
                    <span className="ml-auto text-white/40">11:00</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <SectionHeader title="Focus Engine" />
              <div className="space-y-6">
                <p className="text-white/60 leading-relaxed text-base">
                  Drop into deep work instantly. Built-in timers, notification muting, and ambient soundscapes engineered for flow state.
                </p>
                <div className="border border-white/10 bg-white/5 p-5 rounded-xl shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full border border-purple-500/40 flex items-center justify-center bg-purple-500/10">
                      <Play size={20} className="text-purple-400 ml-1" />
                    </div>
                    <div>
                      <div className="text-white/90 font-medium">Writing Documentation</div>
                      <div className="text-white/50 text-sm font-mono">45m block • Do Not Disturb</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }} 
                      animate={{ width: "65%" }} 
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Your Second Brain" />
              <div className="space-y-6">
                <p className="text-white/60 leading-relaxed text-base">
                  Notes that act like a database. Link thoughts, meetings, and references directly to tasks. Nothing gets lost.
                </p>
                <div className="border border-white/10 bg-white/5 p-5 rounded-xl font-mono text-sm shadow-lg">
                  <div className="text-purple-300/80 mb-3 flex items-center gap-2">
                    <Hash size={14} /> project-alpha-launch
                  </div>
                  <div className="pl-4 border-l border-purple-500/20 space-y-2">
                    <div className="text-white/80 flex items-center gap-2"><LinkIcon size={12} className="text-white/40" /> Meeting Notes: Sync</div>
                    <div className="text-white/80 flex items-center gap-2"><CheckCircle2 size={12} className="text-purple-400" /> Draft announcement</div>
                    <div className="text-white/80 flex items-center gap-2"><Circle size={12} className="text-white/40" /> Review metrics</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Weekly Review" />
              <div className="space-y-6">
                <p className="text-white/60 leading-relaxed text-base">
                  Close the loop every Sunday. The system aggregates completed tasks, highlights bottlenecks, and helps you plan the week ahead.
                </p>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="border border-white/10 bg-white/5 p-4 rounded-xl text-center shadow-lg">
                    <div className="text-2xl text-white/90 mb-1">42</div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">Tasks Done</div>
                  </div>
                  <div className="border border-purple-500/20 bg-purple-500/5 p-4 rounded-xl text-center shadow-lg">
                    <div className="text-2xl text-purple-400 mb-1 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">14h</div>
                    <div className="text-xs text-purple-300/60 uppercase tracking-wider">Deep Work</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* INTEGRATIONS */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto mb-32">
            <SectionHeader title="Works With Your Stack" />
            <div className="flex flex-wrap gap-3 mt-6">
              {['Google Calendar', 'Notion', 'GitHub', 'Linear', 'Slack', 'Obsidian', 'Todoist', 'Figma'].map(tool => (
                <div key={tool} className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 text-sm font-mono flex items-center gap-2 hover:border-purple-500/40 hover:text-white hover:bg-purple-500/10 transition-all cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  {tool}
                </div>
              ))}
            </div>
          </section>

          {/* REAL LIFE SYSTEMS */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto mb-32">
            <SectionHeader title="Real-Life Productivity Systems" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {[
                { title: "Founder Dashboard", desc: "Daily operating flow, investor updates, product roadmap sync." },
                { title: "Deep Work Routine", desc: "4-hour focus blocks, strict notification muting, habit tracking." },
                { title: "Student Workspace", desc: "Exam planning, spaced repetition notes, assignment deadlines." }
              ].map(sys => (
                <div key={sys.title} className="p-5 border border-white/5 bg-white/5 rounded-xl group hover:bg-purple-500/10 hover:border-purple-500/30 transition-all shadow-lg">
                  <h3 className="text-white/90 font-medium mb-2">{sys.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{sys.desc}</p>
                  <div className="text-white/40 text-xs font-mono flex items-center gap-1 group-hover:text-purple-400 transition-colors">
                    Load Blueprint <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FOOTER CTA */}
          <section className="px-6 md:px-12 max-w-3xl mx-auto text-center border-t border-white/10 pt-24">
            <Terminal size={32} className="mx-auto text-purple-400/50 mb-6" />
            <h2 className="text-3xl font-medium text-white tracking-tight mb-4">Start your engine.</h2>
            <p className="text-white/60 mb-8">Join thousands of ambitious individuals building their ideal workflow.</p>
            <div className="flex max-w-md mx-auto items-center shadow-2xl shadow-purple-500/10 rounded-lg overflow-hidden border border-white/10">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-black/40 h-12 px-4 text-sm font-mono focus:outline-none focus:bg-black/60 text-white placeholder:text-white/30 transition-colors"
              />
              <button className="h-12 px-6 bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors">
                Get Access
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-white/40 text-xs font-mono">
              <span className="flex items-center gap-1"><Lock size={12} /> Privacy First</span>
              <span className="flex items-center gap-1"><RefreshCw size={12} /> Auto-Sync</span>
              <span className="flex items-center gap-1"><Zap size={12} /> Local-First Fast</span>
            </div>
          </section>

        </main>

        {/* Simple Footer */}
        <footer className="py-8 border-t border-white/5 text-center text-white/30 text-xs sm:text-sm font-mono bg-transparent">
          &copy; {new Date().getFullYear()} Crewspace. All rights reserved.
        </footer>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => setLocation('/login')} className="cursor-pointer">
              <ArrowRight className="mr-2 h-4 w-4" />
              <span>Login to your workspace</span>
            </CommandItem>
            <CommandItem onSelect={() => setLocation('/signup')} className="cursor-pointer">
              <Zap className="mr-2 h-4 w-4" />
              <span>Create new account</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Features">
            <CommandItem onSelect={() => setOpen(false)} className="cursor-pointer">
              <Terminal className="mr-2 h-4 w-4" />
              <span>Focus Engine</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)} className="cursor-pointer">
              <Layers className="mr-2 h-4 w-4" />
              <span>Project Management</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)} className="cursor-pointer">
              <Hash className="mr-2 h-4 w-4" />
              <span>Knowledge Graph</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

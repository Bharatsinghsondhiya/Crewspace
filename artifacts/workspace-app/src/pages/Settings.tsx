import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, BellRing, Shield, LayoutDashboard } from "lucide-react";

export default function Settings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppMentions, setInAppMentions] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setEmailNotifs(localStorage.getItem("emailNotifs") !== "false");
    setInAppMentions(localStorage.getItem("inAppMentions") !== "false");
    setMarketing(localStorage.getItem("marketing") === "true");
    setCompactMode(localStorage.getItem("compactMode") === "true");
  }, []);

  // Save to localStorage
  const handleToggle = (key: string, setter: (val: boolean) => void, val: boolean) => {
    setter(val);
    localStorage.setItem(key, String(val));
    
    // If compact mode changes, add/remove class to body for actual functionality
    if (key === "compactMode") {
      if (val) document.body.classList.add("compact-ui");
      else document.body.classList.remove("compact-ui");
    }
  };

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-white/50 mt-2 text-sm md:text-base">Manage your application preferences and configurations.</p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <CardHeader className="border-b border-white/5 pb-6">
            <CardTitle className="text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-indigo-400" /> Interface Preferences
            </CardTitle>
            <CardDescription className="text-white/40">Customize how you interact with the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <Label htmlFor="compact-mode" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-white font-medium">Compact Layout</span>
                <span className="font-normal text-sm text-white/50">Reduce padding and margins to fit more content on screen.</span>
              </Label>
              <Switch 
                id="compact-mode" 
                checked={compactMode} 
                onCheckedChange={(v) => handleToggle("compactMode", setCompactMode, v)} 
                className="data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-white/20" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-all pointer-events-none" />
          <CardHeader className="border-b border-white/5 pb-6">
            <CardTitle className="text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-fuchsia-400" /> Notifications
            </CardTitle>
            <CardDescription className="text-white/40">Control when and how you receive alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <Label htmlFor="email-notifs" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-white font-medium">Email Notifications</span>
                <span className="font-normal text-sm text-white/50">Receive daily digests and critical alerts via email.</span>
              </Label>
              <Switch 
                id="email-notifs" 
                checked={emailNotifs} 
                onCheckedChange={(v) => handleToggle("emailNotifs", setEmailNotifs, v)} 
                className="data-[state=checked]:bg-fuchsia-500 data-[state=unchecked]:bg-white/20" 
              />
            </div>
            
            <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <Label htmlFor="push-notifs" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-white font-medium">In-App Mentions</span>
                <span className="font-normal text-sm text-white/50">Notify me immediately when I am assigned to a task.</span>
              </Label>
              <Switch 
                id="push-notifs" 
                checked={inAppMentions} 
                onCheckedChange={(v) => handleToggle("inAppMentions", setInAppMentions, v)} 
                className="data-[state=checked]:bg-fuchsia-500 data-[state=unchecked]:bg-white/20" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden relative group opacity-80 hover:opacity-100 transition-opacity">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <CardHeader className="border-b border-white/5 pb-6">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" /> Privacy & Marketing
            </CardTitle>
            <CardDescription className="text-white/40">Manage your promotional settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <Label htmlFor="marketing" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-white font-medium">Marketing Updates</span>
                <span className="font-normal text-sm text-white/50">Receive news about new features and platform updates.</span>
              </Label>
              <Switch 
                id="marketing" 
                checked={marketing} 
                onCheckedChange={(v) => handleToggle("marketing", setMarketing, v)} 
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

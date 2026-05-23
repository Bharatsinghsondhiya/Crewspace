import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";

export default function Settings() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const handleThemeChange = (value: "light" | "dark") => {
    setTheme(value);
    if (value === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your app preferences.</p>
      </div>

      <div className="grid gap-8">
        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how Crewspace looks.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:shadow-[0_0_15px_rgba(var(--primary),0.3)] cursor-pointer transition-all"
                >
                  <div className="w-full h-20 bg-slate-200 rounded-md mb-3 flex flex-col gap-2 p-2">
                    <div className="w-full h-4 bg-white rounded shadow-sm" />
                    <div className="w-2/3 h-4 bg-white rounded shadow-sm" />
                  </div>
                  Light
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:shadow-[0_0_15px_rgba(var(--primary),0.3)] cursor-pointer transition-all"
                >
                  <div className="w-full h-20 bg-slate-950 rounded-md mb-3 flex flex-col gap-2 p-2 border border-white/5">
                    <div className="w-full h-4 bg-slate-800 rounded shadow-sm" />
                    <div className="w-2/3 h-4 bg-slate-800 rounded shadow-sm" />
                  </div>
                  Dark
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Control when and how you receive alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-notifs" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal text-sm text-muted-foreground">Receive daily digests and critical alerts via email.</span>
              </Label>
              <Switch id="email-notifs" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="push-notifs" className="flex flex-col space-y-1">
                <span>In-App Mentions</span>
                <span className="font-normal text-sm text-muted-foreground">Notify me when I am assigned to a task.</span>
              </Label>
              <Switch id="push-notifs" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="marketing" className="flex flex-col space-y-1">
                <span>Marketing Updates</span>
                <span className="font-normal text-sm text-muted-foreground">Receive news about new features.</span>
              </Label>
              <Switch id="marketing" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

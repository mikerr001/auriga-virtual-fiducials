import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Camera, 
  Ruler, 
  Database, 
  BarChart, 
  ClipboardList,
  TestTube2
} from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: Activity },
    { href: "/calibration", label: "Calibration", icon: Camera },
    { href: "/estimation", label: "Estimation", icon: Ruler },
    { href: "/datasets", label: "Datasets", icon: Database },
    { href: "/evaluation", label: "Evaluation", icon: BarChart },
    { href: "/research-debt", label: "Research Debt", icon: ClipboardList },
    { href: "/validation", label: "Validation", icon: TestTube2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            <span className="font-mono font-bold tracking-tight">AURIGA VFE</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground font-mono">
          <div>SYS: ONLINE</div>
          <div>NET: LOCAL</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

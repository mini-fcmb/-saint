// src/pages/Admin Dashboard/page.tsx
import * as React from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Grid2X2,
  Link2,
  MessageSquare,
  MonitorPlay,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Users,
  User2,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Circle,
  TrendingUp,
  Zap,
} from "lucide-react";
import Logo from "../../assets/logo.png";

// ============================================
// DATA
// ============================================
const NAV = [
  "Dashboard",
  "Projects",
  "Team",
  "Time",
  "Reports",
  "Files",
  "Settings",
];

const BARS = [
  { day: "M", value: 46 },
  { day: "T", value: 72 },
  { day: "W", value: 38 },
  { day: "T", value: 88 },
  { day: "F", value: 56 },
  { day: "S", value: 30 },
  { day: "S", value: 64 },
];

const FILES = [
  { name: "Presentation.pdf", meta: "2.4 MB · Today" },
  { name: "Feedback #1", meta: "1.1 MB · Yesterday" },
  { name: "Brand assets", meta: "18 MB · Mon" },
];

const TASKS = [
  { title: "Design review", time: "09:00", icon: MonitorPlay, done: true },
  { title: "Client sync call", time: "11:30", icon: Zap, done: true },
  { title: "Onboarding docs", time: "14:00", icon: RefreshCw, done: false },
  { title: "Sprint planning", time: "16:15", icon: Link2, done: false },
];

const PROGRESS_SEGMENTS = [
  { label: "Task", pct: 42, tone: "bg-[#007BFF] text-white" },
  { label: "", pct: 25, tone: "bg-[#12151A] text-white/60" },
  { label: "", pct: 0, tone: "bg-white/15 text-white/40" },
];

const ACTIVITY = [
  { name: "Design system", value: 82 },
  { name: "Mobile app", value: 54 },
  { name: "Website revamp", value: 37 },
];

// ============================================
// SUB-COMPONENTS
// ============================================

// Stat Card
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="min-w-0">
    <p className="text-3xl font-semibold tracking-tight text-[#1A1D21]">
      <span className="text-[#6B7280]/60">≈</span> {value}
    </p>
    <p className="truncate text-[11px] text-[#6B7280]">{label}</p>
  </div>
);

// Dashboard Action Button Component
const ActionButton = ({
  title,
  width,
  icon: Icon,
}: {
  title: string;
  width: string;
  icon?: React.ElementType;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-medium text-[#6B7280] tracking-wide uppercase">
      {title}
    </span>
    <button
      className={`h-10 rounded-full border border-[#E8EAF0] bg-gradient-to-r from-[#38BDF8] via-[#007BFF] to-[#0056B3] hover:border-[#007BFF] hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 group`}
      style={{ width }}
    >
      {Icon && (
        <Icon className="h-4 w-4 text-[#000] group-hover:text-[#888] transition-colors" />
      )}
    </button>
  </div>
);

// Dashboard Controls Section
const DashboardControls = () => (
  <div className="flex items-end justify-between px-3 pb-3">
    <div className="flex items-end gap-6">
      <ActionButton title="Create" width="80px" icon={Plus} />
      <ActionButton title="Projects" width="80px" icon={Grid2X2} />
      <ActionButton title="Team" width="100px" icon={Users} />
      <ActionButton title="Settings" width="150px" icon={Settings} />
    </div>

    <div className="flex shrink-0 items-end gap-10 pb-[1px]">
      <StatCard value="92" label="Projects" />
      <StatCard value="75" label="Members" />
      <StatCard value="315" label="Tasks done" />
    </div>
  </div>
);

// Top Navigation Bar
const TopBar = () => (
  <div className="flex items-center px-3 py-3 bg-white">
    {/* Logo */}
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={Logo}
        style={{
          borderRadius: "50%",
          width: "50px",
          height: "50px",
        }}
      />

      <span className="brand-name text-[#1A1D21] font-semibold font-medium text-[20px] tracking-tight">
        SXaint
      </span>
    </div>

    {/* Push everything after logo to the right */}
    <div className="ml-auto flex items-center">
      {/* Navbar */}
      <nav className="h-14 flex items-center gap-0.5 mr-[5px] bg-[#F7F8FC] rounded-full px-1.5 py-1">
        {NAV.map((item, index) => (
          <button
            key={item}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs text-[15px] font-medium transition-colors whitespace-nowrap ${
              index === 0
                ? "bg-[#007BFF] text-white shadow-sm"
                : "text-[#6B7280] hover:text-[#1A1D21]"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Settings buttons */}
      <div className="flex items-center gap-[2px]">
        <button className="flex h-14 items-center gap-2 rounded-full border border-[#E8EAF0] bg-white px-5 text-[#6B7280] transition-colors hover:text-[#1A1D21]">
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>

        <button className="grid h-14 w-14 place-items-center rounded-full border border-[#E8EAF0] bg-white text-[#6B7280] transition-colors hover:text-[#1A1D21]">
          <Bell className="h-5 w-5" />
        </button>

        <button className="grid h-14 w-14 place-items-center rounded-full border border-[#E8EAF0] bg-white text-[#6B7280] transition-colors hover:text-[#1A1D21]">
          <User2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
);

// Welcome Section
const WelcomeSection = () => (
  <div className="px-3 pt-9 pb-3">
    <h1 className="text-[30px] font-semibold tracking-tight text-[#1A1D21]">
      Welcome in, Nixtio
    </h1>
  </div>
);

// Profile Card - 360x270
const ProfileCard = () => (
  <div className="w-[360px] h-[270px] rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
    <div className="relative h-[150px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="https://ui-avatars.com/api/?name=Adam+Miller&size=80&background=007BFF&color=fff&bold=true"
          alt="Profile"
          className="h-20 w-20 rounded-full border-2 border-white shadow-md"
        />
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-[#1A1D21]">
          Adam Miller
        </p>
        <p className="truncate text-sm text-[#6B7280]">Product Designer</p>
      </div>
      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#007BFF]">
        Active
      </span>
    </div>
    <div className="mt-auto flex items-center gap-6 border-t border-[#E8EAF0] pt-4">
      <div>
        <p className="text-sm font-semibold text-[#1A1D21]">12</p>
        <p className="text-[11px] text-[#6B7280]">Projects</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1A1D21]">8</p>
        <p className="text-[11px] text-[#6B7280]">Tasks</p>
      </div>
    </div>
  </div>
);

// Progress Card - 360x270
const ProgressCard = () => (
  <div className="w-[360px] h-[270px] rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
    <div className="flex items-center justify-between">
      <p className="text-[13px] font-medium text-[#6B7280]">Progress</p>
      <ChevronDown className="h-4 w-4 text-[#6B7280]" />
    </div>
    <p className="mt-2 text-[34px] font-semibold tracking-tight text-[#1A1D21]">
      6.1 h <span className="text-sm font-normal text-[#6B7280]">/ week</span>
    </p>
    <div className="mt-6 flex items-end gap-1.5 flex-1">
      {BARS.map((bar, index) => (
        <div
          key={index}
          className="flex min-w-0 flex-1 flex-col items-center gap-2"
        >
          <div
            className={`w-full rounded-[6px] transition-all duration-500 ${
              index === 3 ? "bg-[#007BFF]" : "bg-[#007BFF]/20"
            }`}
            style={{ height: `${Math.round(bar.value * 0.9)}px` }}
          />
          <span className="text-[11px] font-medium text-[#6B7280]">
            {bar.day}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Time Tracked Card - 360x270
const TimeTrackedCard = () => (
  <div className="w-[360px] h-[270px] rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
    <div className="flex items-center justify-between">
      <p className="text-[13px] font-medium text-[#6B7280]">Time tracked</p>
      <Clock className="h-4 w-4 text-[#6B7280]" />
    </div>
    <div className="flex flex-col items-center justify-center flex-1">
      <p className="rounded-2xl bg-gradient-to-r from-[#38BDF8] via-[#007BFF] to-[#0056B3] px-6 py-3 text-[34px] font-semibold tracking-tight text-white tabular-nums shadow-sm">
        03:45
      </p>
      <div className="mt-5 flex items-center gap-3">
        <button className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-[#38BDF8] via-[#007BFF] to-[#0056B3] text-white transition-all hover:bg-[#0066CC] hover:scale-105 active:scale-95">
          <Play className="h-4 w-4" />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-[#E8EAF0] bg-white text-[#6B7280] transition-all hover:border-[#007BFF] hover:text-[#007BFF] hover:scale-105 active:scale-95">
          <Pause className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-[11px] text-[#6B7280]">Today · Design sprint</p>
    </div>
  </div>
);

// Tasks Sidebar - 470px width, stretches to fill the full height of both rows
// Structured as 3 stacked containers inside the main panel:
//   1) header text block (~20% of panel height)
//   2) fixed 100px progress bar row
//   3) remaining space down to the bottom (2px bottom padding) holding the task list
const doneCount = TASKS.filter((t) => t.done).length;

const TasksSidebar = () => (
  // MAIN CONTAINER
  <div className="w-[470px] h-[540px] flex flex-col rounded-[40px] bg-[#1A1D21] p-6 text-white shadow-sm">
    {/* CONTAINER 1 — header text, ~20% of main container height */}
    <div className="h-[20%] flex flex-col justify-center">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] font-semibold tracking-tight">Onboarding</h2>
        <span className="text-[28px] font-semibold">42%</span>
      </div>
      <p className="mt-1 text-[12px] opacity-50">
        {doneCount} of {TASKS.length} tasks completed
      </p>
    </div>

    {/* CONTAINER 2 — fixed ~100px height, progress bar row */}
    <div className="h-[100px] flex gap-2">
      {PROGRESS_SEGMENTS.map((seg, i) => (
        <div
          key={i}
          className={`flex-1 rounded-[20px] flex flex-col justify-between px-4 py-3 ${seg.tone}`}
          style={{ flexGrow: seg.pct === 0 ? 0.5 : seg.pct === 25 ? 1.5 : 2 }}
        >
          <span className="text-[11px] font-medium opacity-70">{seg.pct}%</span>
          {seg.label && (
            <span className="text-sm font-semibold">{seg.label}</span>
          )}
        </div>
      ))}
    </div>

    {/* CONTAINER 3 — remaining space down to the bottom, 2px bottom padding */}
    <div className="flex-1 mt-5 rounded-[28px] bg-white/[0.04] p-5 pb-[2px] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-medium opacity-80">Tasks</p>
        <button className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 transition-all hover:bg-white/25 hover:scale-105 active:scale-95">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <ul className="space-y-2.5 pb-3">
        {TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <li
              key={task.title}
              className="group flex cursor-pointer items-center gap-3 rounded-xl bg-white/10 px-3 py-3 transition-colors hover:bg-white/15"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {task.title}
                </span>
                <span className="block text-[11px] opacity-70">
                  {task.time}
                </span>
              </span>
              {task.done ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#007BFF]">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              ) : (
                <MoreHorizontal className="h-4 w-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-2 space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 text-sm opacity-80">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full border-2 border-[#1A1D21] bg-white flex items-center justify-center text-[10px] font-medium text-[#1A1D21]"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <span>12 members online</span>
        </div>
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-medium transition-colors hover:bg-white/25">
          <MessageSquare className="h-4 w-4" /> Message team
        </button>
      </div>
    </div>
  </div>
);

// Files Card - 360x270
const FilesCard = () => (
  <div className="w-[360px] h-[270px] rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
    <div className="flex items-center justify-between">
      <p className="text-[13px] font-medium text-[#6B7280]">Files</p>
      <MoreHorizontal className="h-4 w-4 text-[#6B7280]" />
    </div>
    <ul className="mt-4 space-y-3 flex-1">
      {FILES.map((file) => (
        <li
          key={file.name}
          className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#F7F8FC]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F7F8FC]">
            <FileText className="h-4 w-4 text-[#007BFF]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[#1A1D21]">
              {file.name}
            </span>
            <span className="block truncate text-[11px] text-[#6B7280]">
              {file.meta}
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 text-[#6B7280] opacity-0 transition-opacity group-hover:opacity-100" />
        </li>
      ))}
    </ul>
  </div>
);

// Team Activity Card - 720x270
const TeamActivityCard = () => (
  <div className="w-[720px] h-[270px] rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
    <p className="text-[13px] font-medium text-[#6B7280]">Team activity</p>
    <div className="mt-5 space-y-4 flex-1">
      {ACTIVITY.map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#1A1D21]">{item.name}</span>
            <span className="text-sm text-[#6B7280]">{item.value}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#F3F4F6]">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-[#38BDF8] via-[#007BFF] to-[#0056B3] transition-all duration-1000"
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// MAIN DASHBOARD
// ============================================

const AdminDashboard = () => {
  return (
    <>
      <div className="h-screen w-full bg-white px-15 pt-[5px] pb-[2px]">
        <div className="flex h-full flex-col max-w-[1800px] mx-auto">
          {/* Top section - always at top */}
          <TopBar />
          <WelcomeSection />
          <DashboardControls />

          {/* Bottom section - pushed to bottom with flex: 1 and margin-top: auto */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="flex gap-[2px]">
              {/* Left block: the two stacked rows, 2px between them */}
              <div className="flex flex-col gap-[2px]">
                {/* Row 1 */}
                <div className="flex gap-[2px]">
                  <ProfileCard />
                  <ProgressCard />
                  <TimeTrackedCard />
                </div>

                {/* Row 2 */}
                <div className="flex gap-[2px]">
                  <FilesCard />
                  <TeamActivityCard />
                </div>
              </div>

              {/* Tasks sidebar: stretches to match the left block's full height */}
              <TasksSidebar />
            </div>
          </div>
        </div>
      </div>
      <style>{`
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
}
  `}</style>
    </>
  );
};

export default AdminDashboard;

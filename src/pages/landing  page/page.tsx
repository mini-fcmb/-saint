import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  Rocket,
  Sparkles,
  User,
  X,
  LayoutGrid,
  GraduationCap,
  Building2,
  CreditCard,
  Users,
  BookOpen,
  Trophy,
  Target,
  BarChart3,
  Shield,
  Smartphone,
  PlayCircle,
  Star,
  Activity,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
  Send,
  ArrowUpRight,
  Globe,
  Server,
  Github,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Calendar,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import logo from "./../../assets/logo.png";
import sxaint_promo_hp from "./../../assets/istockphoto-1576577609-640_adpp_is.mp4";
import sxaint_promo_hp_webm from "../../assets/mixkit-girl-working-on-her-laptop-5920-hd-ready.mp4";
import sxaint_promo_hp_og from "../../assets/mixkit-reverse-tour-of-a-library-full-of-books-21595-hd-ready.mp4";
import sxaint_promo_hp_og_webm from "../../assets/100228-video-720.mp4";
import SplitText from "../../Components/textSplit/component";
import BlurText from "../../Components/textBlur/component";
import TextType from "../../Components/textType/component";
import logotrans from "../../assets/logo_transparent.png";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "motion/react";
import { Fingerprint, Activity as ActivityIcon } from "lucide-react";
import { Link } from "react-router-dom";

/* ─── Data ───────────────────────────────────────────────────────── */
const FEATURES = [
  {
    id: 0,
    tag: "Question Bank",
    title: "Create Exams in Minutes",
    subtitle: "No coding. Just results.",
    image: "https://picsum.photos/seed/questions/900/600",
    description:
      "50,000+ questions. Drag & drop. MCQ, essay, math, multimedia. Real-time preview. Launch in under 5 minutes.",
    bullets: [
      "50,000+ question bank",
      "Drag & drop interface",
      "Multiple formats supported",
    ],
  },
  {
    id: 1,
    tag: "Proctoring",
    title: "AI-Powered Proctoring",
    subtitle: "Catch cheating instantly.",
    image: "https://picsum.photos/seed/proctoring/900/600",
    description:
      "Webcam + eye tracking. Tab switch alerts. Full session recording. GDPR & FERPA compliant. Exportable reports.",
    bullets: [
      "Real-time monitoring",
      "Tab switch detection",
      "Session recording",
    ],
  },
  {
    id: 2,
    tag: "Grading",
    title: "Instant Grading & Insights",
    subtitle: "Results in seconds.",
    image: "https://picsum.photos/seed/grading/900/600",
    description:
      "Auto-grade MCQs. AI essay scoring. Interactive dashboards. Track trends. Identify weak topics.",
    bullets: ["Auto-grading", "AI essay scoring", "Analytics dashboard"],
  },
  {
    id: 3,
    tag: "Mobile",
    title: "Test Anywhere",
    subtitle: "Mobile, tablet, desktop.",
    image: "https://picsum.photos/seed/mobile/900/600",
    description:
      "Offline mode. Auto-sync. Push alerts. Low-data mode. Start, pause, resume anytime.",
    bullets: ["Offline mode", "Cross-platform", "Auto-sync"],
  },
  {
    id: 4,
    tag: "Enterprise",
    title: "Scale Without Limits",
    subtitle: "From 10 to 100,000+ users.",
    image: "https://picsum.photos/seed/analytics/900/600",
    description:
      "LMS integration. White-label. 99.99% uptime. Admin, teacher, proctor roles.",
    bullets: ["LMS integration", "White-label", "99.99% uptime"],
  },
];

// Navigation data with icons and dropdown content
const NAV_ITEMS = [
  {
    id: "features",

    icon: LayoutGrid,
    dropdown: [
      { label: "Question Bank", icon: BookOpen, href: "#features" },
      { label: "AI Proctoring", icon: Shield, href: "#features" },
      { label: "Auto-Grading", icon: BarChart3, href: "#features" },
      { label: "Mobile Testing", icon: Smartphone, href: "#features" },
    ],
  },
  {
    id: "exams",

    icon: GraduationCap,
    dropdown: [
      { label: "Create Exam", icon: Target, href: "#exams" },
      { label: "Exam Templates", icon: Trophy, href: "#exams" },
      { label: "Results & Analytics", icon: BarChart3, href: "#exams" },
    ],
  },
  {
    id: "schools",

    icon: Building2,
    dropdown: [
      { label: "K-12 Schools", icon: Users, href: "#schools" },
      { label: "Universities", icon: GraduationCap, href: "#schools" },
      { label: "Training Centers", icon: Building2, href: "#schools" },
    ],
  },
  {
    id: "pricing",
    icon: CreditCard,
    dropdown: [
      { label: "Starter", icon: Rocket, href: "#pricing" },
      { label: "Professional", icon: User, href: "#pricing" },
      { label: "Enterprise", icon: Building2, href: "#pricing" },
    ],
  },
  {
    id: "about",

    icon: Info,
    dropdown: [
      { label: "Our Story", icon: Sparkles, href: "#about" },
      { label: "Careers", icon: Users, href: "#about" },
      { label: "Contact", icon: Mail, href: "#about" },
    ],
  },
];

// Gallery items with images and ratings
const GALLERY_ITEMS = [
  {
    id: 0,
    image: "https://i.pravatar.cc/400?img=11",
    name: "Dr. Amara Chen",
    position: "Dean of Assessment",
    institution: "Lakeview Academy",
    country: "United States",
    students: "4,200",
    rating: 4.9,
    review: "SXaint cut our grading time by 70% in one term.",
  },
  {
    id: 1,
    image: "https://i.pravatar.cc/400?img=12",
    name: "Prof. Daniel Okafor",
    position: "Head of Examinations",
    institution: "Crestmount High",
    country: "Canada",
    students: "3,100",
    rating: 4.8,
    review: "Proctoring accuracy gave us total confidence again.",
  },
  {
    id: 2,
    image: "https://i.pravatar.cc/400?img=25",
    name: "Dr. Elena Vasquez",
    position: "Academic Director",
    institution: "Riverdale Prep",
    country: "United Kingdom",
    students: "2,700",
    rating: 4.9,
    review: "Setup took an afternoon. Results were immediate.",
  },
  {
    id: 3,
    image: "https://i.pravatar.cc/400?img=33",
    name: "Prof. James Whitfield",
    position: "Registrar",
    institution: "Northfield College",
    country: "Australia",
    students: "5,600",
    rating: 4.7,
    review: "Analytics finally show us where students struggle.",
  },
  {
    id: 4,
    image: "https://i.pravatar.cc/400?img=45",
    name: "Dr. Priya Nair",
    position: "Vice Principal",
    institution: "St. Aldwyn School",
    country: "Ireland",
    students: "1,900",
    rating: 4.9,
    review: "Our teachers actually enjoy exam season now.",
  },
  {
    id: 5,
    image: "https://i.pravatar.cc/400?img=53",
    name: "Prof. Liam O'Connor",
    position: "Assessment Lead",
    institution: "Pinehurst Institute",
    country: "South Africa",
    students: "3,400",
    rating: 4.6,
    review: "Reliable at scale, even during peak exam weeks.",
  },
  {
    id: 6,
    image: "https://i.pravatar.cc/400?img=60",
    name: "Dr. Sarah Mitchell",
    position: "Dean of Students",
    institution: "Del Mar University",
    country: "Spain",
    students: "8,200",
    rating: 4.8,
    review: "The platform transformed how we conduct exams.",
  },
  {
    id: 7,
    image: "https://i.pravatar.cc/400?img=70",
    name: "Prof. Michael Chen",
    position: "Academic Director",
    institution: "Oakridge Academy",
    country: "New Zealand",
    students: "2,100",
    rating: 4.9,
    review: "Exceptional support and cutting-edge technology.",
  },
];

/* ─── Easing for CountUp ───────────────────────────────────────── */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/* ─── CountUp Hook ──────────────────────────────────────────────── */
function useCountUp(
  start: number,
  end: number,
  duration: number,
  active: boolean,
) {
  const [value, setValue] = useState(start);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const t0 = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      setValue(Math.round(start + (end - start) * easeOutExpo(t)));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
      }
    };
  }, [active, start, end, duration]);

  return value;
}

/* ══════════════════════════════════════════════════════════════════
   CINEMATIC LOADER
   ══════════════════════════════════════════════════════════════════ */

type LoaderStage =
  | "black"
  | "approach"
  | "rotate1"
  | "wait1"
  | "rotate2"
  | "wait2"
  | "slide"
  | "done";

const LOGO_SIZE = 180;

// Timing constants (ms)
const T_APPROACH_START = 1200;
const T_ROTATE1_START = 4800;
const T_WAIT1_START = 4000;
const WAIT1_DURATION = 5000;
const T_ROTATE2_START = T_WAIT1_START + WAIT1_DURATION;
const ROTATE2_DURATION = 5000;
const WAIT2_DURATION = 400;
const T_WAIT2_START = T_ROTATE2_START + ROTATE2_DURATION;
const T_SLIDE_START = T_WAIT2_START + WAIT2_DURATION;
const SLIDE_DURATION = 1000;
const T_DONE = T_SLIDE_START + SLIDE_DURATION;

function CinematicLoader({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<LoaderStage>("black");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const schedule = (fn: () => void, delay: number) => {
      timers.current.push(setTimeout(fn, delay));
    };

    schedule(() => setStage("approach"), T_APPROACH_START);
    schedule(() => setStage("rotate1"), T_ROTATE1_START);
    schedule(() => setStage("wait1"), T_WAIT1_START);
    schedule(() => setStage("rotate2"), T_ROTATE2_START);
    schedule(() => setStage("wait2"), T_WAIT2_START);
    schedule(() => setStage("slide"), T_SLIDE_START);
    schedule(() => setStage("done"), T_DONE);
    schedule(() => onComplete(), T_DONE);

    return () => {
      timers.current.forEach(clearTimeout);
      document.body.style.overflow = prevOverflow;
    };
  }, [onComplete]);

  const showLogo = stage !== "black";
  const isSliding = stage === "slide" || stage === "done";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: isSliding ? "translate3d(-100%,0,0)" : "translate3d(0,0,0)",
        transition:
          stage === "slide"
            ? `transform ${SLIDE_DURATION}ms cubic-bezier(0.76,0,0.24,1)`
            : "none",
        willChange: "transform",
        pointerEvents: isSliding ? "none" : "auto",
      }}
    >
      {showLogo && (
        <div
          style={{
            position: "absolute",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
            animation:
              stage === "rotate1" || stage === "rotate2"
                ? "loaderGlowPulse 2.4s ease-in-out infinite"
                : "none",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          width: `${LOGO_SIZE}px`,
          height: `${LOGO_SIZE}px`,
        }}
      >
        {showLogo && (
          <img
            key={stage}
            src={logotrans}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              animation:
                stage === "approach"
                  ? "loaderApproach 1.6s cubic-bezier(0.16,0.9,0.3,1) forwards"
                  : stage === "rotate1"
                    ? "loaderRotate 2s linear forwards"
                    : stage === "rotate2"
                      ? "loaderRotate 2s cubic-bezier(0.45,0,0.55,1) forwards"
                      : "none",
              willChange: "transform, filter, opacity",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes loaderApproach {
          0% {
            transform: scale(0.12) translateZ(0);
            filter: blur(22px) brightness(1.5);
            opacity: 0;
          }
          45% {
            opacity: 1;
            filter: blur(6px) brightness(1.2);
          }
          100% {
            transform: scale(1);
            filter: blur(0px) brightness(1);
            opacity: 1;
          }
        }
        @keyframes loaderRotate {
          from { transform: rotate(0deg) scale(1); }
          to   { transform: rotate(360deg) scale(1); }
        }
        @keyframes loaderGlowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

/* ─── StatBlock Component ───────────────────────────────────────── */
function StatBlock({
  countStart,
  countEnd,
  duration,
  label,
  active,
  delay,
  isLast,
}: {
  countStart: number;
  countEnd: number;
  duration: number;
  label: string;
  active: boolean;
  delay: string;
  isLast: boolean;
}) {
  const value = useCountUp(countStart, countEnd, duration, active);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "50px",
        position: "relative",
        overflow: "hidden",
        borderBottom: !isLast ? "1px solid rgba(0,0,0,.08)" : "none",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(25px)",
        transition: `all .8s ease ${delay}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-10px",
          bottom: "-25px",
          fontSize: "clamp(8rem,18vw,15rem)",
          fontWeight: 900,
          color: "rgba(0,0,0,.04)",
          pointerEvents: "none",
        }}
      >
        {value}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          lineHeight: 0.9,
        }}
      >
        <span
          style={{
            fontSize: "clamp(6rem,12vw,10rem)",
            fontWeight: 700,
            color: "#E8E8E8",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: "clamp(3rem,6vw,5rem)",
            color: "#E8E8E8",
          }}
        >
          %
        </span>
      </div>

      <div
        style={{
          marginTop: "18px",
          fontWeight: 700,
          fontSize: "1rem",
          color: "#222",
        }}
      >
        {label}
        <span style={{ marginLeft: "12px" }}>›</span>
      </div>
    </div>
  );
}

/* ─── StatsSection Component ────────────────────────────────────── */
function StatsSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const trigger = useCallback(() => setVisible(true), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trigger();
          obs.disconnect();
        }
      },
      {
        threshold: 0.15,
      },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [trigger]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        padding: "20px",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#FFFFFF",
      }}
    >
      <section
        ref={ref}
        id="stats"
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "#FFFFFF",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,.08)",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            position: "relative",
            background: "#F7F7F7",
            overflow: "hidden",
            borderRight: "1px solid rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              position: "absolute",
              top: "50px",
              left: "50px",
              zIndex: 10,
              fontSize: "clamp(2rem,3vw,4rem)",
              fontWeight: 500,
              color: "#000",
            }}
          >
            Impact That
            <br />
            Speaks for Itself
          </h2>
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#F7F7F7",
            overflow: "hidden",
          }}
        >
          <StatBlock
            countStart={15}
            countEnd={95}
            duration={3000}
            label="Improved Student Performance"
            active={visible}
            delay="0.1s"
            isLast={false}
          />
          <StatBlock
            countStart={15}
            countEnd={90}
            duration={6000}
            label="Higher Exam Completion Rate"
            active={visible}
            delay="0.25s"
            isLast={true}
          />
        </div>

        <style>{`
          @media(max-width:800px){
            #stats{
              grid-template-columns:1fr;
            }
          }
        `}</style>
      </section>
    </div>
  );
}

/* ─── ImageCarouselPane ───────────────────────────────────────────── */
function ImageCarouselPane({
  features,
  current,
  isAnimating,
  direction,
  onPrev,
  onNext,
  onDot,
}: {
  features: typeof FEATURES;
  current: number;
  isAnimating: boolean;
  direction: "left" | "right" | null;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
}) {
  const total = features.length;
  const prevIdx = (current - 1 + total) % total;
  const nextIdx = (current + 1) % total;

  const slotStyle = (
    slot: "active" | "prev" | "next" | "hidden",
  ): React.CSSProperties => {
    const baseTransition =
      "transform 0.55s cubic-bezier(0.34,1.1,0.64,1), opacity 0.45s ease, filter 0.45s ease, box-shadow 0.45s ease";

    if (slot === "active") {
      return {
        transform: "translateX(0%) scale(1)",
        opacity: 1,
        filter: "blur(0px) brightness(1)",
        zIndex: 10,
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        transition: baseTransition,
        pointerEvents: "none",
      };
    }
    if (slot === "prev") {
      return {
        transform: "translateX(-58%) scale(0.82) rotateY(4deg)",
        opacity: 0.55,
        filter: "blur(1.5px) brightness(0.85)",
        zIndex: 5,
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        transition: baseTransition,
        pointerEvents: "auto",
        cursor: "pointer",
      };
    }
    if (slot === "next") {
      return {
        transform: "translateX(58%) scale(0.82) rotateY(-4deg)",
        opacity: 0.55,
        filter: "blur(1.5px) brightness(0.85)",
        zIndex: 5,
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        transition: baseTransition,
        pointerEvents: "auto",
        cursor: "pointer",
      };
    }
    return {
      transform:
        direction === "left"
          ? "translateX(-120%) scale(0.7)"
          : "translateX(120%) scale(0.7)",
      opacity: 0,
      filter: "blur(3px)",
      zIndex: 1,
      transition: baseTransition,
      pointerEvents: "none",
    };
  };

  const getSlot = (idx: number): "active" | "prev" | "next" | "hidden" => {
    if (idx === current) return "active";
    if (idx === prevIdx) return "prev";
    if (idx === nextIdx) return "next";
    return "hidden";
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <div
        className="relative w-full"
        style={{ height: "400px", perspective: "900px" }}
      >
        {features.map((f, idx) => {
          const slot = getSlot(idx);
          return (
            <div
              key={f.id}
              onClick={
                slot === "prev" ? onPrev : slot === "next" ? onNext : undefined
              }
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "70%",
                maxWidth: "400px",
                aspectRatio: "4/3",
                marginTop: "-120px",
                marginLeft: "-35%",
                borderRadius: "20px",
                overflow: "hidden",
                transformOrigin: "center center",
                willChange: "transform, opacity, filter",
                ...slotStyle(slot),
              }}
            >
              <img
                src={f.image}
                alt={f.tag}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform:
                    isAnimating && slot === "active"
                      ? "scale(1.04)"
                      : "scale(1)",
                  transition: "transform 0.55s ease",
                }}
              />
              {slot === "active" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "15px",
                    left: "15px",
                    background: "#007bff",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "6px 14px",
                    borderRadius: "24px",
                    opacity: isAnimating ? 0 : 1,
                    transform: isAnimating
                      ? "translateY(4px)"
                      : "translateY(0)",
                    transition:
                      "opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s",
                  }}
                >
                  {f.tag}
                </div>
              )}
              {slot === "active" && (
                <div
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(4px)",
                    color: "#007bff",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: "24px",
                  }}
                >
                  {current + 1} / {total}
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-center gap-3"
        style={{ marginTop: "30px" }}
      >
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => onDot(i)}
            aria-label={`Go to feature ${i + 1}`}
            style={{
              width: i === current ? "28px" : "10px",
              height: "10px",
              borderRadius: "20px",
              background: i === current ? "#007bff" : "#d1d5db",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition:
                "width 0.35s cubic-bezier(0.34,1.1,0.64,1), background 0.3s ease",
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-4" style={{ marginTop: "24px" }}>
        <button
          onClick={onPrev}
          aria-label="Previous feature"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "1.5px solid #e5e7eb",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
          }}
        >
          <ChevronLeft size={20} color="#374151" />
        </button>
        <button
          onClick={onNext}
          aria-label="Next feature"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            background: "#007bff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 14px rgba(0,123,255,0.4)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#0056b3";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#007bff";
          }}
        >
          <ChevronRight size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ─── TextContentPane ─────────────────────────────────────────────── */
function TextContentPane({
  feature,
  isAnimating,
  onGetStarted,
}: {
  feature: (typeof FEATURES)[0];
  isAnimating: boolean;
  onGetStarted: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "24px",
        padding: "48px 40px",
        height: "100%",
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? "translateY(10px)" : "translateY(0)",
        transition: "opacity 0.38s ease, transform 0.38s ease",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#eff6ff",
          color: "#2",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          padding: "8px 16px",
          borderRadius: "24px",
          width: "fit-content",
        }}
      >
        <Sparkles size={14} />
        {feature.subtitle}
      </span>

      <div>
        <h3
          style={{
            fontSize: "clamp(1.8rem, 3vw, 2.2rem)",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.3,
            margin: "0 0 12px",
          }}
        >
          {feature.title}
        </h3>
        <p
          style={{
            fontSize: "1rem",
            color: "#64748b",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {feature.description}
        </p>
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {feature.bullets.map((b, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "0.95rem",
              color: "#374151",
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? "translateX(8px)" : "translateX(0)",
              transition: `opacity 0.35s ease ${0.08 + i * 0.06}s, transform 0.35s ease ${0.08 + i * 0.06}s`,
            }}
          >
            <CheckCircle2 size={18} color="#2563eb" style={{ flexShrink: 0 }} />
            {b}
          </li>
        ))}
      </ul>
      <Link to="/signup">
        <button
          style={{
            marginTop: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "#1A1D21",
            color: "#fff",
            fontSize: "0.95rem",
            fontWeight: 700,
            padding: "14px 28px",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            width: "fit-content",
            transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            boxShadow: "0 4px 16px #2B2E33",
            opacity: isAnimating ? 0 : 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#2B2E33";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1A1D21";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          Get Started for free
          <Rocket size={16} />
        </button>
      </Link>
    </div>
  );
}

/* ─── FloatingDashboardWidget ─────────────────────────────────────── */
function FloatingDashboardWidget({
  style,
  delay,
  children,
}: {
  style: React.CSSProperties;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="dash-widget"
      style={{
        position: "absolute",
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.6)",
        borderRadius: "16px",
        boxShadow: "0 14px 34px rgba(15,23,42,0.14)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        animationDelay: delay,
        zIndex: 30,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── AppleTabletFeatures ───────────────────────────────── */
function AppleTabletFeatures({ onGetStarted }: { onGetStarted: () => void }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const autoRotateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRotate = () => {
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    autoRotateRef.current = setTimeout(() => {
      triggerTransition("right", (p) => (p + 1) % FEATURES.length);
    }, 5000);
  };

  useEffect(() => {
    scheduleRotate();
    return () => {
      if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    };
  }, [current]);

  const triggerTransition = (
    dir: "left" | "right",
    getNext: (prev: number) => number,
  ) => {
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(getNext);
      setIsAnimating(false);
    }, 400);
  };

  const goTo = (i: number) => {
    if (i === current || isAnimating) return;
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    const dir = i > current ? "right" : "left";
    triggerTransition(dir, () => i);
    scheduleRotate();
  };

  const prev = () => {
    if (isAnimating) return;
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    triggerTransition(
      "left",
      (p) => (p - 1 + FEATURES.length) % FEATURES.length,
    );
    scheduleRotate();
  };

  const next = () => {
    if (isAnimating) return;
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    triggerTransition("right", (p) => (p + 1) % FEATURES.length);
    scheduleRotate();
  };

  return (
    <div
      id="features"
      style={{
        width: "100%",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 50px 80px 50px",
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f8faff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,123,255,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          left: "-8%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,123,255,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Tablet Frame */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "600px",
          background: "#1a1a1a",
          borderRadius: "48px",
          padding: "40px 24px 45px 24px",
          boxShadow:
            "0 60px 120px rgba(0,0,0,0.3), 0 12px 36px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
          position: "relative",
        }}
      >
        {/* Camera dot */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#2d2d2d",
            border: "2px solid #444",
            zIndex: 20,
          }}
        />

        {/* Screen */}
        <div
          style={{
            background: "#fff",
            borderRadius: "32px",
            overflow: "hidden",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          {/* Left — image carousel */}
          <div
            style={{
              background: "#f9fafb",
              borderRight: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.025) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.025) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div style={{ width: "100%", position: "relative", zIndex: 2 }}>
              <ImageCarouselPane
                features={FEATURES}
                current={current}
                isAnimating={isAnimating}
                direction={direction}
                onPrev={prev}
                onNext={next}
                onDot={goTo}
              />
            </div>
          </div>

          {/* Right — text content */}
          <div
            style={{
              background: "#ffffff",
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <TextContentPane
              feature={FEATURES[current]}
              isAnimating={isAnimating}
              onGetStarted={onGetStarted}
            />
          </div>
        </div>

        {/* Home button indicator */}
        <div
          style={{
            width: "44px",
            height: "5px",
            background: "#333",
            borderRadius: "6px",
            margin: "16px auto 0",
          }}
        />

        {/* Floating widgets */}
        <FloatingDashboardWidget
          style={{ top: "-28px", left: "40px" }}
          delay="0s"
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "rgba(0,123,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={17} color="#007bff" />
          </div>
          <div>
            <div
              style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}
            >
              Live Analytics
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}
            >
              +24.6%
            </div>
          </div>
        </FloatingDashboardWidget>

        <FloatingDashboardWidget
          style={{ top: "60px", right: "-36px" }}
          delay="0.4s"
        >
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 0 4px rgba(34,197,94,0.18)",
              flexShrink: 0,
            }}
            className="pulse-dot"
          />
          <div>
            <div
              style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}
            >
              AI Proctoring
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}
            >
              Active
            </div>
          </div>
        </FloatingDashboardWidget>

        <FloatingDashboardWidget
          style={{ bottom: "120px", left: "-40px", width: "168px" }}
          delay="0.8s"
        >
          <ShieldCheck size={18} color="#007bff" style={{ flexShrink: 0 }} />
          <div style={{ width: "100%" }}>
            <div
              style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}
            >
              Encrypted • SOC 2
            </div>
            <div
              style={{
                marginTop: "6px",
                height: "5px",
                borderRadius: "4px",
                background: "rgba(0,123,255,0.12)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "92%",
                  height: "100%",
                  borderRadius: "4px",
                  background: "#007bff",
                }}
              />
            </div>
          </div>
        </FloatingDashboardWidget>

        <FloatingDashboardWidget
          style={{ bottom: "-30px", right: "80px" }}
          delay="1.2s"
        >
          <Server size={17} color="#007bff" />
          <div>
            <div
              style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}
            >
              Uptime
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}
            >
              99.99%
            </div>
          </div>
        </FloatingDashboardWidget>

        <FloatingDashboardWidget
          style={{ top: "230px", right: "-52px" }}
          delay="1.6s"
        >
          <RefreshCw size={16} color="#007bff" className="spin-slow" />
          <div>
            <div
              style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}
            >
              Cloud Sync
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}
            >
              Synced 2s ago
            </div>
          </div>
        </FloatingDashboardWidget>

        <FloatingDashboardWidget
          style={{ top: "270px", left: "-50px" }}
          delay="2s"
        >
          <Activity size={17} color="#007bff" />
          <div>
            <div
              style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}
            >
              Realtime
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}
            >
              1,284 exams live
            </div>
          </div>
        </FloatingDashboardWidget>
      </div>

      <style>{`
        .dash-widget { animation: dashFloat 4.5s ease-in-out infinite; }
        @keyframes dashFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }
        .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 0 4px rgba(34,197,94,0.18); }
          50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.08); }
        }
        .spin-slow { animation: spinSlow 3s linear infinite; }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .dash-widget { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PARTNERSHIP SECTION — premium split layout (Apple + Stripe + Framer)
   ══════════════════════════════════════════════════════════════════ */

const PARTNER_STATS = [
  { value: "200", suffix: "+", label: "Institutions" },
  { value: "1.2", suffix: "M+", label: "Students" },
  { value: "98", suffix: "%", label: "Success Rate" },
  { value: "24/7", suffix: "", label: "Support" },
];

const PARTNER_FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Exams",
    description: "Create and manage CBT examinations in minutes.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track student performance in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Examination",
    description: "Enterprise-level encryption and AI proctoring.",
  },
];

function parseStatValue(value: string) {
  if (value.includes("/")) return null;
  const decimals = (value.split(".")[1] || "").length;
  const scale = Math.pow(10, decimals);
  const end = Math.round(parseFloat(value) * scale);
  return { end, scale, decimals };
}

function PartnerStat({
  value,
  suffix,
  label,
  delay,
}: {
  value: string;
  suffix: string;
  label: string;
  delay: number;
}) {
  const [active, setActive] = useState(false);
  const parsed = useMemo(() => parseStatValue(value), [value]);
  const count = useCountUp(
    0,
    parsed ? parsed.end : 0,
    2000,
    active && !!parsed,
  );
  const displayValue = parsed
    ? `${(count / parsed.scale).toFixed(parsed.decimals)}${suffix}`
    : value;

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setActive(true)}
      viewport={{ once: true, amount: 0.6 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: "center", padding: "16px", cursor: "default" }}
    >
      <div
        style={{
          fontSize: "clamp(2rem, 3vw, 2.6rem)",
          fontWeight: 800,
          color: "#0f172a",
          transition: "text-shadow 0.3s ease",
        }}
        className="group-hover:[text-shadow:0_0_24px_rgba(66,153,225,0.45)]"
      >
        {displayValue}
      </div>
      <div
        style={{
          marginTop: "8px",
          fontSize: "0.95rem",
          color: "#64748b",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: "2px",
          width: "0px",
          background: "#4299E1",
          margin: "10px auto 0",
          transition: "width 0.3s ease",
        }}
        className="group-hover:!w-10"
      />
    </motion.div>
  );
}

function PartnershipSection() {
  const total = GALLERY_ITEMS.length;
  const ROTATE_MS = 10000;

  const [activeIndex, setActiveIndex] = useState(0);
  const rotateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = GALLERY_ITEMS[activeIndex];
  const upcoming = GALLERY_ITEMS[(activeIndex + 1) % total];

  const scheduleRotate = useCallback(() => {
    if (rotateTimer.current) clearTimeout(rotateTimer.current);
    rotateTimer.current = setTimeout(() => {
      setActiveIndex((p) => (p + 1) % total);
    }, ROTATE_MS);
  }, [total]);

  useEffect(() => {
    scheduleRotate();
    return () => {
      if (rotateTimer.current) clearTimeout(rotateTimer.current);
    };
  }, [activeIndex, scheduleRotate]);

  const goTo = (i: number) => {
    if (i === activeIndex) return;
    setActiveIndex(i);
    scheduleRotate();
  };

  // Cursor tilt on the large image
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 18 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 18 });
  const [imageHovered, setImageHovered] = useState(false);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 14);
    rotateX.set(-py * 14);
  };

  const handleImageMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    setImageHovered(false);
  };

  // Trust badge count-up (re-triggers because `end` changes with activeIndex)
  const trustCount = parseInt(current.students.replace(/,/g, ""), 10) || 0;
  const badgeValue = useCountUp(0, trustCount, 1400, true);

  return (
    <motion.section
      id="partners"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: "100%",
        background: "#FFFFFF",
        padding: "140px 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-[55%_45%]"
          style={{ gap: "70px", alignItems: "center" }}
        >
          {/* ───────── LEFT: layered image composition ───────── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              /* extra bottom space so the small image + badge can hang below the large one */
              paddingBottom: "70px",
              paddingLeft: "10px",
            }}
          >
            {/* Large image */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "480px",
                perspective: "1200px",
                marginLeft: "50px",
              }}
              onMouseMove={handleImageMouseMove}
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={handleImageMouseLeave}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.4 }}
                  animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "28px",
                    overflow: "hidden",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <motion.img
                    src={current.image}
                    alt={current.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      rotateX: springRotateX,
                      rotateY: springRotateY,
                      scale: imageHovered ? 1.03 : 1,
                      transition: "scale 0.4s ease",
                    }}
                    animate={{
                      boxShadow: imageHovered
                        ? "0 30px 70px rgba(66,153,225,0.35)"
                        : "0 20px 50px rgba(15,23,42,0.15)",
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Small floating image — previews the next partner (rotates in 10s before becoming active).
                Sits ON TOP of the large image's bottom-left corner, and hangs slightly below/left of it,
                exactly like the reference. */}
            <motion.div
              key={`upcoming-${upcoming.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 0.6 },
                scale: { duration: 0.6 },
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
              }}
              style={{
                position: "absolute",
                left: "0px",
                bottom: "0px",
                width: "44%",
                aspectRatio: "4/3",
                borderRadius: "22px",
                overflow: "hidden",
                border: "5px solid #fff",
                boxShadow: "0 24px 55px rgba(15,23,42,0.25)",
                zIndex: 15,
              }}
            >
              <img
                src={upcoming.image}
                alt={upcoming.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15,23,42,0.12)",
                }}
              />
            </motion.div>

            {/* Floating trust badge — sits right at the seam where the two images overlap */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              animate={{ y: [0, -8, 0] }}
              transition={{
                y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.6 },
                scale: { duration: 0.6 },
              }}
              style={{
                position: "absolute",
                left: "34%",
                bottom: "18px",
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563eb, #4299E1, )",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow:
                  "0 0 0 8px rgba(255,255,255,0.9), 0 20px 45px rgba(37,99,235,0.4)",
                zIndex: 25,
              }}
            >
              <span
                style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 }}
              >
                {badgeValue.toLocaleString()}+
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  marginTop: "6px",
                  textAlign: "center",
                  opacity: 0.9,
                  padding: "0 8px",
                }}
              >
                Trusted Students
              </span>

              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -14, 0], opacity: [0.3, 0.8, 0.3] }}
                  transition={{
                    duration: 2.4 + i * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.3,
                  }}
                  style={{
                    position: "absolute",
                    top: `${20 + i * 20}%`,
                    left: i % 2 === 0 ? "-10px" : "auto",
                    right: i % 2 !== 0 ? "-10px" : "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#93c5fd",
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* ───────── RIGHT: content ───────── */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#2563eb",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <Globe size={14} />
              Trusted by Schools
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05 }}
              style={{
                marginTop: "16px",
                fontSize: "clamp(2rem, 3.4vw, 2.8rem)",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              Trusted by Thousands of Schools, Teachers &amp; Students
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{
                marginTop: "18px",
                fontSize: "1.05rem",
                color: "#64748b",
                lineHeight: 1.7,
                maxWidth: "480px",
              }}
            >
              SXaint helps institutions run secure, reliable exams at any scale
              — from a single classroom to a nationwide rollout — backed by AI
              proctoring and instant, actionable analytics.
            </motion.p>

            <div
              style={{
                marginTop: "36px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {PARTNER_FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.15 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <feature.icon size={20} color="#2563eb" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {feature.title}
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "0.92rem",
                        color: "#64748b",
                      }}
                    >
                      {feature.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: "40px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "3px",
                      marginBottom: "10px",
                    }}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "#1e293b",
                      lineHeight: 1.6,
                      fontStyle: "italic",
                      maxWidth: "480px",
                    }}
                  >
                    "{current.review}"
                  </p>
                  <div style={{ marginTop: "12px" }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {current.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                      {current.position} · {current.institution}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div style={{ display: "flex", gap: "8px", marginTop: "26px" }}>
                {GALLERY_ITEMS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Show partner ${i + 1}`}
                    style={{
                      width: i === activeIndex ? "26px" : "8px",
                      height: "8px",
                      borderRadius: "20px",
                      border: "none",
                      background: i === activeIndex ? "#2563EB" : "#dbeafe",
                      cursor: "pointer",
                      padding: 0,
                      transition:
                        "width 0.35s cubic-bezier(0.34,1.1,0.64,1), background 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ───────── BOTTOM STATS ROW ───────── */}
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{
            marginTop: "110px",
            paddingTop: "50px",
            borderTop: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          {PARTNER_STATS.map((stat, i) => (
            <PartnerStat
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FOOTER — with centered SXaint logo
   ══════════════════════════════════════════════════════════════════ */

const FOOTER_COLUMNS: { title: string; links: string[] }[] = [
  {
    title: "Quick Links",
    links: ["Features", "Exams", "Schools", "Pricing", "About"],
  },
  {
    title: "Products",
    links: ["Question Bank", "AI Proctoring", "Auto-Grading", "Mobile App"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Guides", "Blog"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"],
  },
];

const SOCIAL_LINKS = [
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: X, label: "X", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

function DiscordIcon({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M20.3 5.3A17.7 17.7 0 0 0 15.9 4l-.24.47a13 13 0 0 1 3.7 1.4 15.7 15.7 0 0 0-13.7 0 13 13 0 0 1 3.72-1.4L9.14 4a17.7 17.7 0 0 0-4.4 1.3C2 9.8 1.3 14.1 1.6 18.3a17.9 17.9 0 0 0 5.4 2.7l.9-1.4a11.6 11.6 0 0 1-1.9-.9l.47-.36a12.8 12.8 0 0 0 11 0l.47.36c-.6.35-1.24.65-1.9.9l.9 1.4a17.8 17.8 0 0 0 5.4-2.7c.4-4.7-.75-8.95-2.94-13ZM8.68 15.6c-.98 0-1.78-.9-1.78-2s.79-2 1.78-2 1.8.9 1.78 2c0 1.1-.79 2-1.78 2Zm6.64 0c-.98 0-1.78-.9-1.78-2s.79-2 1.78-2 1.8.9 1.78 2c0 1.1-.79 2-1.78 2Z"
        fill={color}
      />
    </svg>
  );
}

function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        background: "#0a0a0f",
        color: "#fff",
        overflow: "hidden",
        paddingTop: "90px",
      }}
    >
      {/* Giant centered low-opacity brand mark */}
      <img
        src={logotrans}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          maxWidth: "80vw",
          opacity: 0.04,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr repeat(4, 1fr)",
            gap: "40px",
            paddingBottom: "60px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Company blurb + newsletter */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={logo}
                alt="SXaint logo"
                style={{ width: "36px", height: "36px", borderRadius: "50%" }}
              />
              <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>
                SXaint
              </span>
            </div>
            <p
              style={{
                marginTop: "18px",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                maxWidth: "320px",
              }}
            >
              The complete exam platform for K-12 schools, universities, and
              enterprises — AI proctoring, instant grading, and analytics in one
              place.
            </p>

            <div style={{ marginTop: "26px" }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "10px",
                }}
              >
                Get product updates
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  padding: "4px",
                  maxWidth: "300px",
                }}
              >
                <input
                  type="email"
                  placeholder="you@school.edu"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#fff",
                    fontSize: "0.85rem",
                    padding: "8px 10px",
                  }}
                />
                <button
                  aria-label="Subscribe"
                  style={{
                    background: "#007bff",
                    border: "none",
                    borderRadius: "8px",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Send size={15} color="#fff" />
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "26px",
                flexWrap: "wrap",
              }}
            >
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.75)",
                    transition: "background 0.2s, color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "#007bff";
                    el.style.color = "#fff";
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(255,255,255,0.06)";
                    el.style.color = "rgba(255,255,255,0.75)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <s.icon size={17} />
                </a>
              ))}
              <a
                href="#"
                aria-label="Discord"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.75)",
                  transition: "background 0.2s, color 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "#007bff";
                  el.style.color = "#fff";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.color = "rgba(255,255,255,0.75)";
                  el.style.transform = "translateY(0)";
                }}
              >
                <DiscordIcon size={17} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "16px",
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.88rem",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.color =
                          "#fff")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.color =
                          "rgba(255,255,255,0.55)")
                      }
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "16px",
              }}
            >
              Contact
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "0.88rem",
                }}
              >
                <Mail size={14} /> hello@sxaint.com
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "0.88rem",
                }}
              >
                <Globe size={14} /> sxaint.com
              </li>
              <li>
                <a
                  href="#"
                  style={{
                    marginTop: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Talk to Sales <ArrowUpRight size={14} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "24px 0",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <span>© 2026 SXaint. All rights reserved.</span>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
              Privacy Policy
            </a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
              Terms
            </a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
              Cookies
            </a>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              Status: All systems operational
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          footer > div > div:first-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}

/* ─── NavDropdown Component ────────────────────────────────────── */
function NavDropdown({
  item,
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: {
  item: (typeof NAV_ITEMS)[0];
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  // Get dropdown content based on item ID
  const getDropdownContent = (id: string) => {
    const contentMap: Record<
      string,
      { title: string; description: string; cards: any[] }
    > = {
      features: {
        title: "Features",
        description: "Everything you need to build secure online examinations.",
        cards: [
          {
            icon: BookOpen,
            title: "Question Bank",
            description: "Create, organize and manage examinations.",
            features: [
              "50,000+ question bank",
              "Drag & drop interface",
              "Multiple formats supported",
              "Real-time preview",
            ],
          },
          {
            icon: Shield,
            title: "AI Proctoring",
            description: "Protect every examination session.",
            features: [
              "Face detection",
              "Tab switching alerts",
              "Live monitoring",
              "AI behaviour analysis",
            ],
          },
          {
            icon: BarChart3,
            title: "Analytics & Results",
            description: "Understand student performance instantly.",
            features: [
              "Automatic grading",
              "Performance dashboard",
              "Class insights",
              "Export reports",
            ],
          },
        ],
      },
      exams: {
        title: "Exams",
        description: "Create and manage exams with ease.",
        cards: [
          {
            icon: Target,
            title: "Create Exams",
            description: "Build exams from scratch or use templates.",
            features: [
              "Multiple question types",
              "Custom scoring",
              "Time limits",
              "Randomization",
            ],
          },
          {
            icon: Calendar,
            title: "Smart Scheduling",
            description: "Schedule exams across time zones effortlessly.",
            features: [
              "Multi-timezone support",
              "Automatic reminders",
              "Rescheduling",
              "Cohort management",
            ],
          },
          {
            icon: Trophy,
            title: "Results & Analytics",
            description: "Track performance and identify gaps.",
            features: [
              "Real-time results",
              "Class rankings",
              "Trend analysis",
              "Exportable data",
            ],
          },
        ],
      },
      schools: {
        title: "Schools",
        description: "Trusted by educational institutions worldwide.",
        cards: [
          {
            icon: Users,
            title: "K-12 Schools",
            description: "Complete classroom management and grading.",
            features: [
              "Classroom management",
              "Student progress tracking",
              "Grade books",
              "Parent communication",
            ],
          },
          {
            icon: GraduationCap,
            title: "Universities",
            description: "Department-wide exam management.",
            features: [
              "Department administration",
              "Cross-campus coordination",
              "Research support",
              "Accreditation ready",
            ],
          },
          {
            icon: Building2,
            title: "Training Centers",
            description: "Professional certification and training.",
            features: [
              "Certification management",
              "Training modules",
              "Progress tracking",
              "Badge issuance",
            ],
          },
        ],
      },
      pricing: {
        title: "Pricing",
        description: "Choose the plan that fits your needs.",
        cards: [
          {
            icon: Rocket,
            title: "Starter Plan",
            description: "Perfect for small classes and individual teachers.",
            features: [
              "Up to 50 students",
              "Basic proctoring",
              "Email support",
              "1 month free",
            ],
          },
          {
            icon: Star,
            title: "Professional Plan",
            description: "Full features for growing institutions.",
            features: [
              "Up to 500 students",
              "AI proctoring",
              "Priority support",
              "Advanced analytics",
            ],
          },
          {
            icon: Building2,
            title: "Enterprise Plan",
            description: "Custom solutions for large organizations.",
            features: [
              "Unlimited students",
              "White-labeling",
              "Dedicated support",
              "Custom integrations",
            ],
          },
        ],
      },
      about: {
        title: "About",
        description: "Empowering educators with next-gen technology.",
        cards: [
          {
            icon: Target,
            title: "Our Mission",
            description: "Making education accessible and secure for everyone.",
            features: [
              "Global education access",
              "Secure testing",
              "Innovation driven",
              "Educator focused",
            ],
          },
          {
            icon: Users,
            title: "Our Team",
            description: "Meet the experts behind SXaint.",
            features: [
              "Industry veterans",
              "Education experts",
              "Global presence",
              "Passionate team",
            ],
          },
          {
            icon: Sparkles,
            title: "Careers",
            description: "Join us in transforming education.",
            features: [
              "Open positions",
              "Remote work",
              "Growth culture",
              "Impactful work",
            ],
          },
        ],
      },
    };
    return contentMap[id] || contentMap.features;
  };

  const content = getDropdownContent(item.id);

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className={`flex items-center gap-1.5 text-[15px] font-medium transition-all duration-200 whitespace-nowrap group ${
          isOpen ? "text-[#2563EB]" : "text-gray-500 hover:text-[#2563EB]"
        }`}
      >
        <item.icon
          size={18}
          className="transition-transform duration-200 group-hover:scale-110"
        />
        <span className="relative">
          <span
            className={`absolute -bottom-1 left-0 h-[2px] bg-[#2563EB] transition-all duration-300 ${
              isOpen ? "w-full" : "w-0 group-hover:w-full"
            }`}
          />
        </span>
      </button>

      {/* Mega Dropdown - Redesigned Content Layout */}
      <div
        className={`fixed top-[88px] left-1/2 -translate-x-1/2 w-[98vw] max-w-[1600px] z-50 transition-all duration-200 ${
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible translate-y-1"
        }`}
        style={{
          height: "100vh",
          minHeight: "400px",
          maxHeight: "480px",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <div
          className="w-full h-full overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(35px)",
            WebkitBackdropFilter: "blur(35px)",
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: "28px",
            boxShadow: "0 40px 100px rgba(0,0,0,0.18)",
            padding: "28px 32px",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="h-full flex flex-col"
            >
              {/* Section Header */}
              <div className="text-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {content.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {content.description}
                </p>
              </div>

              {/* Three Cards */}
              <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
                {content.cards.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group/card relative rounded-2xl p-7 flex flex-col"
                    style={{
                      background: "#0F0F10",
                      border: "1px solid rgba(255,255,255,0.08)",
                      transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      transition: { duration: 0.3 },
                    }}
                  >
                    {/* Animated gradient overlay */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.04) 50%, transparent 100%)",
                      }}
                    >
                      <div
                        className="absolute -inset-[100%] animate-[shimmer_3s_ease-in-out_infinite]"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                          transform: "skewX(-20deg)",
                        }}
                      />
                    </div>

                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        boxShadow: "0 0 40px rgba(37,99,235,0.15)",
                      }}
                    />

                    {/* Card Content */}
                    <div className="relative z-10 flex flex-col flex-1">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform duration-300">
                        <card.icon size={28} className="text-[#2563EB]" />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-white mb-1.5">
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-4">
                        {card.description}
                      </p>

                      {/* Feature List */}
                      <ul className="space-y-2 flex-1">
                        {card.features.map((feature: string, fi: number) => (
                          <li
                            key={fi}
                            className="flex items-center gap-2.5 text-sm text-gray-300"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-[#2563eb] flex-shrink-0"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <motion.a
                        href=""
                        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#2563eb] group/link w-fit"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        Explore <ArrowRight size={16} />
                      </motion.a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(100%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── HomepageContent ────────────────────────────────────────────────── */
function HomepageContent({
  onGetStarted,
  revealed,
}: {
  onGetStarted: () => void;
  revealed: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Media items - video rotation
  const mediaItems = [
    { src: sxaint_promo_hp, type: "video/mp4" },
    { src: sxaint_promo_hp_webm, type: "video/webm" },
    { src: sxaint_promo_hp_og, type: "video/mp4" },
    { src: sxaint_promo_hp_og_webm, type: "video/webm" },
  ];

  // Rotate video every 30 seconds
  useEffect(() => {
    if (mediaItems.length <= 1) return;

    mediaTimerRef.current = setTimeout(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
    }, 30000);

    return () => {
      if (mediaTimerRef.current) {
        clearTimeout(mediaTimerRef.current);
      }
    };
  }, [currentMediaIndex, mediaItems.length]);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.5), 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDropdownEnter = (id: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpenDropdown(id);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const heroOpacity = Math.max(1 - scrollProgress * 1.4, 0);
  const featuresOpacity = Math.min((scrollProgress - 0.5) * 3, 1);
  const showFeatures = scrollProgress >= 0.5;

  const currentMedia = mediaItems[currentMediaIndex];

  return (
    <div
      className="relative"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed
          ? "translateY(0) scale(1)"
          : "translateY(24px) scale(0.99)",
        transition: "opacity 1000ms ease, transform 1000ms ease",
      }}
    >
      {/* Floating Navbar */}
      <nav className="fixed top-5 left-5 right-5 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-[1500px] pointer-events-auto">
          <div
            className="bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] h-[65px] px-6 flex items-center"
            style={{
              borderRadius: "50px",
              width: "calc(100% - 500px)",
              margin: "0 auto",
            }}
          >
            {/* Grid Layout - 1fr auto 1fr */}
            <div className="grid grid-cols-[1fr_auto_1fr] w-full items-center gap-4">
              {/* LEFT: Navigation Icons with Dropdowns */}
              <div className="flex items-center gap-[30px] justify-start">
                {NAV_ITEMS.map((item) => (
                  <NavDropdown
                    key={item.id}
                    item={item}
                    isOpen={openDropdown === item.id}
                    onMouseEnter={() => handleDropdownEnter(item.id)}
                    onMouseLeave={handleDropdownLeave}
                  />
                ))}
              </div>

              {/* CENTER: Logo */}
              <div className="flex items-center justify-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={logo}
                    alt="SXaint logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">
                  SXaint
                </span>
              </div>

              {/* RIGHT: Sign In + Get Started */}
              <div className="flex items-center justify-end gap-3">
                <Link to="/login">
                  <button className="text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 whitespace-nowrap">
                    Sign In
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1D21] hover:bg-blue-700 text-white font-semibold rounded-full text-[15px] transition-all duration-200 hover:scale-105 active:scale-95 group">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Hamburger */}
      <div className="fixed top-5 right-5 z-50 md:hidden pointer-events-auto">
        <button
          className="p-2.5 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} className="text-gray-700" />
        </button>
      </div>

      {/* Mobile slide-out menu */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-all duration-300 ${mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col p-6 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="self-end p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            <X size={24} className="text-gray-700" />
          </button>
          <nav className="flex flex-col gap-2 mt-6">
            {NAV_ITEMS.map((item) => (
              <div key={item.id} className="flex flex-col">
                <div className="flex items-center gap-3 text-base font-medium text-gray-800 py-3 px-4">
                  <item.icon size={18} />
                </div>
                <div className="ml-4 pl-4 border-l-2 border-gray-200">
                  {item.dropdown.map((dropdownItem, index) => (
                    <a
                      key={index}
                      href={dropdownItem.href}
                      className="flex items-center gap-3 text-sm text-gray-600 py-2 px-4 hover:text-[#2563eb] transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <dropdownItem.icon size={14} />
                      {dropdownItem.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <Link to="/signup">
              {" "}
              <button
                onClick={() => {
                  setMobileOpen(false);
                }}
                className="flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-xl text-white bg-[#1A1D21] hover:bg-[#2B2E33] font-semibold"
              >
                Get Started
                <ArrowRight size={18} />
              </button>
            </Link>
          </nav>
        </div>
      </div>

      {/* HERO — fixed, fades out on scroll */}
      <div
        className="fixed top-0 left-0 w-full h-screen overflow-hidden z-10 bg-[#fff]"
        style={{
          opacity: heroOpacity,
          pointerEvents: heroOpacity > 0.05 ? "auto" : "none",
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-[#fff]" />

        {/* Video - Now rotates through media items */}
        <div
          className="absolute right-0 bg-[#fff]"
          style={{
            width: "75%",
            right: "20px",
            top: "110px",
            height: "calc(100% - 120px)",
            borderRadius: "25px",
          }}
        >
          <video
            key={currentMediaIndex}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              height: "100%",
              objectFit: "cover",
              borderRadius: "25px",
            }}
          >
            <source src={currentMedia.src} type={currentMedia.type} />
          </video>
        </div>

        {/* Animated Text Content */}
        <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-20 pt-[90px]">
          <div className="max-w-2xl">
            {/* Heading */}
            <SplitText
              text="Build the Future of Education with"
              className="text-1xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-[1.12] lg:whitespace-nowrap"
              delay={40}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="left"
              tag="h1"
            />

            {/* Dynamic phrase */}
            <div className="mt-3">
              <span className="text-1xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold">
                <TextType
                  text={[
                    "AI Proctoring!",
                    "Instant Grading!",
                    "Global Reach!",
                    "Enterprise Security!",
                  ]}
                  typingSpeed={75}
                  deletingSpeed={30}
                  pauseDuration={2000}
                  initialDelay={5000}
                  loop={true}
                  showCursor={true}
                  cursorCharacter="|"
                  cursorBlinkDuration={0.5}
                  className="text-[#2563EB] inline-block"
                  textColors={["#2563EB"]}
                />
              </span>
            </div>

            {/* Subtitle */}
            <div className="mt-6 max-w-xl">
              <BlurText
                text="The complete exam platform for K-12, universities, and enterprises"
                delay={150}
                animateBy="words"
                direction="bottom"
                stepDuration={0.25}
                className="text-lg sm:text-xl text-gray-1000"
                threshold={0.1}
                onAnimationComplete={() =>
                  console.log("Subtitle animation complete!")
                }
              />
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/signup">
                <button className="group flex items-center gap-2 px-7 py-3.5 bg-[#1A1D21] border border-[#1A1D21] hover:border-[#2B2E33] text-white font-semibold rounded-full text-[15px] transition-all duration-300">
                  <ArrowRight
                    size={18}
                    className="text-white transition-transform duration-300 ease-out group-hover:scale-125 group-hover:rotate-12"
                  />
                  Get started now
                </button>
              </Link>
              <button className="group flex items-center gap-2 px-7 py-3.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 font-semibold rounded-full text-[15px] transition-all duration-300">
                <PlayCircle
                  size={18}
                  className="text-[#2563EB] transition-transform duration-300 ease-out group-hover:scale-125 group-hover:rotate-12"
                />
                Watch Demo
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center -space-x-2">
                {["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb"].map((c, i) => (
                  <span
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                Trusted by <strong className="text-gray-800">200+</strong>{" "}
                institutions
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Star size={15} color="#f59e0b" fill="#f59e0b" />
                <strong className="text-gray-800">4.8</strong>/5 average rating
              </span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
          <span className="text-gray-400 text-xs tracking-wider uppercase">
            Scroll to explore
          </span>
          <div className="w-5 h-8 border-2 border-gray-400 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-1.5 bg-gray-400 rounded-full animate-scroll" />
          </div>
        </div>
      </div>

      {/* Spacer so features start below the viewport */}
      <div className="h-[420px]" />

      {/* Features Section */}
      <div
        ref={featuresRef}
        style={{
          opacity: featuresOpacity,
          pointerEvents: showFeatures ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        <AppleTabletFeatures onGetStarted={onGetStarted} />
      </div>

      {/* Stats Section */}
      <StatsSection />

      {/* Partnership Section - Premium Split Layout */}
      <PartnershipSection />

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes scroll {
          0%   { transform: translateY(0);  opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        .animate-scroll { animation: scroll 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ─── Main Merged Homepage ────────────────────────────────────────────────── */
function Homepage() {
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [loaderComplete, setLoaderComplete] = useState(false);

  const handleGetStarted = useCallback(() => {
    setShowGetStarted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Cinematic loader — sits above everything until the intro finishes */}
      {!loaderComplete && (
        <CinematicLoader onComplete={() => setLoaderComplete(true)} />
      )}

      {/* Overlay/dim effect when split-screen is active */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-700 z-20 ${
          showGetStarted ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Homepage Panel - Transforms to left panel */}
      <div
        className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.1,0.64,1)] ${
          showGetStarted
            ? "w-[42%] md:w-[42%] lg:w-[42%] translate-x-0 scale-[0.97] rounded-2xl overflow-hidden shadow-2xl"
            : "w-full translate-x-0 scale-100 rounded-none"
        }`}
        style={{
          position: "relative",
          zIndex: 25,
          height: showGetStarted ? "calc(100vh - 40px)" : "auto",
          margin: showGetStarted ? "20px 0 20px 20px" : "0",
          transformOrigin: "center left",
        }}
      >
        <HomepageContent
          onGetStarted={handleGetStarted}
          revealed={loaderComplete}
        />
      </div>

      {/* Chat support button */}
      <button
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-[9999] transition-transform hover:scale-110 active:scale-95"
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
          opacity: loaderComplete ? 1 : 0,
          pointerEvents: loaderComplete ? "auto" : "none",
          transition: "opacity 600ms ease",
        }}
        aria-label="Open support chat"
      >
        <MessageCircle size={22} fill="white" stroke="white" />
      </button>
    </div>
  );
}

export default Homepage;

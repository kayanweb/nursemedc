import React from "react";
import { Heart, Activity, ShieldAlert, Sparkles, Star, Award, Layers } from "lucide-react";

interface Props {
  nameAr?: string;
  nameEn?: string;
  taglineAr?: string;
  taglineEn?: string;
  size?: "sm" | "md" | "lg" | "xl" | "print";
  isAr?: boolean;
  dark?: boolean;
  hideText?: boolean;
}

export const DynamicProfessionalLogo: React.FC<Props> = ({
  nameAr = "مستشفى الرعاية السريرية الموحدة",
  nameEn = "Unified Clinical Care Hospital",
  taglineAr = "نحو رعاية طبية آمنة وممتازة وجودة مستدامة",
  taglineEn = "Towards Safe, Quality & Standardized Patient Care",
  size = "md",
  isAr = true,
  dark = false,
  hideText = false,
}) => {
  const normAr = nameAr.trim() || "مستشفى الرعاية السريرية الموحدة";
  const normEn = nameEn.trim() || "Unified Clinical Care Hospital";

  // Compute initials deterministically (max 3 uppercase letters)
  const getInitials = (text: string) => {
    return text
      .split(/\s+/)
      .map((w) => w[0])
      .filter((c) => /^[a-zA-Z\u0600-\u06FF0-9]$/.test(c))
      .slice(0, 3)
      .join("")
      .toUpperCase() || "MED";
  };

  const initials = getInitials(normEn);

  // Hash the name to choose premium color palettes and styling deterministically if customized
  const getHash = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const hashValue = getHash(normEn);
  const colorIndex = hashValue % 5;

  // Premium color-themes
  // 0: hospital Rose Pink / Golden Sand
  // 1: Emerald Jade / Mint Green
  // 2: Royal Blue / Cyan Sky
  // 3: Indigo / Amethyst Purple
  // 4: Warm Crimson / Amber Bronze
  const themes = [
    {
      from: "from-pink-500",
      to: "to-rose-600",
      accent: "text-pink-600",
      accentBg: "bg-pink-50",
      border: "border-pink-200",
      glow: "shadow-pink-500/20",
      textAccent: "text-pink-600",
      badgeColor: "bg-pink-50 text-pink-700 border-pink-100",
    },
    {
      from: "from-emerald-600",
      to: "to-teal-700",
      accent: "text-emerald-600",
      accentBg: "bg-emerald-50",
      border: "border-emerald-200",
      glow: "shadow-emerald-500/20",
      textAccent: "text-emerald-600",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      from: "from-blue-600",
      to: "to-cyan-700",
      accent: "text-blue-600",
      accentBg: "bg-blue-50",
      border: "border-blue-200",
      glow: "shadow-blue-500/20",
      textAccent: "text-blue-600",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      from: "from-indigo-600",
      to: "to-violet-700",
      accent: "text-indigo-600",
      accentBg: "bg-indigo-50",
      border: "border-indigo-200",
      glow: "shadow-indigo-500/20",
      textAccent: "text-indigo-600",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    {
      from: "from-red-600",
      to: "to-amber-600",
      accent: "text-red-600",
      accentBg: "bg-red-50",
      border: "border-red-200",
      glow: "shadow-red-500/20",
      textAccent: "text-red-600",
      badgeColor: "bg-red-50 text-red-700 border-red-100",
    },
  ];

  // Override to Pink Rose theme if it matches "hospital" or "المستشفى"
  const ishospital =
    normEn.toLowerCase().includes("hospital") ||
    normAr.includes("المستشفى") ||
    normAr.includes("بهيه");

  const theme = ishospital ? themes[0] : themes[colorIndex];

  // Design motif selection - the user has uploaded and requested a specific Heartbeat & Clinical Human silhouette logo.
  // We force the "custom-beat" motif to ensure it is displayed everywhere!
  const logoMotif: string = "custom-beat";

  // Pure SVG Vectors for beautiful geometric emblems (not standard icons)
  const renderSVGEmblem = () => {
    switch (logoMotif) {
      case "custom-beat":
        return (
          // Heartbeat silhouette: human outline + glowing hollow heart + left & right ECG waves
          <g>
            {/* 1. Human Silhouette - Head (circle with thick stroke) */}
            <circle
              cx="24"
              cy="9.5"
              r="4"
              stroke="url(#customLogoGrad)"
              strokeWidth="2.5"
              fill="none"
              className="drop-shadow-sm"
            />
            {/* 2. Human Silhouette - Shoulders and Arms (hanging down, rounded tips) */}
            <path
              d="M14.5,31 v-10.5 c0,-3.5 3,-6.5 6.5,-6.5 h6 c3.5,0 6.5,3 6.5,6.5 v10.5"
              stroke="url(#customLogoGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              className="drop-shadow-sm"
            />
            {/* 3. Human Silhouette - Torso and Legs (single smooth path with perfect spacing) */}
            <path
              d="M19,23 v20.5 c0,1.2 0.8,2.2 2,2.2 s2,-1 2,-2.2 V35.5 h2 v7.5 c0,1.2 0.8,2.2 2,2.2 s2,-1 2,-2.2 V23"
              stroke="url(#customLogoGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="drop-shadow-sm"
            />
            {/* 4. Hollow Center Care Heart (nested perfectly in chest cavity, styled with gradient border) */}
            <path
              d="M24,21.5 c0,0 -1.5,-2 -3.5,-2 c-1.8,0 -3,1.5 -3,3.2 c0,3 4,6.5 6.5,8 c2.5,-1.5 6.5,-5 6.5,-8 c0,-1.7 -1.2,-3.2 -3,-3.2 c-1.8,0 -3.5,2 -3.5,2 Z"
              stroke="url(#customLogoGrad)"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
              className="drop-shadow-lg"
            />
            {/* 5. ECG Pulse Waves overlay (left and right sides, intersecting clean of center chest) */}
            {/* Left pulse */}
            <path
              d="M1.5,24 h5 l1.5,-6 l1.5,12 l1.5,-16 l1.5,14 l1,-4 H14"
              stroke="url(#customLogoGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Right pulse */}
            <path
              d="M34,24 h1 l1.5,-4 l1.5,12 l1.5,-16 l1.5,14 l1.5,-6 h5.5"
              stroke="url(#customLogoGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        );
      case "lotus-ribbon":
        return (
          // Ribbon & floral lotus elements representing hospital breast cancer/healthcare care
          <g>
            {/* Outer glowing halo */}
            <circle cx="24" cy="24" r="16" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 3" className="opacity-40" />
            
            {/* Elegant overlapping Care Ribbon Petals */}
            <path
              d="M17 14 C17 11, 20 8, 24 11 C28 8, 31 11, 31 14 C31 20, 24 26, 24 26 C24 26, 17 20, 17 14 Z"
              fill="url(#ribbonGrad)"
              className="drop-shadow-sm"
            />
            
            {/* Inner Lotus Bud - representing rebirth and premium care */}
            <path
              d="M24 15 C22 17, 21 21, 24 23 C27 21, 26 17, 24 15 Z"
              fill="#ffffff"
            />
            {/* Sparkle dot */}
            <circle cx="24" cy="11" r="1.5" fill="#ffd700" className="animate-pulse" />
          </g>
        );
      case "heart-pulse":
        return (
          // Cardiogram overlaying glowing heart outline
          <g>
            <path
              d="M24 10 C18 6, 13 11, 13 16 C13 23, 24 30, 24 30 C24 30, 35 23, 35 16 C35 11, 30 6, 24 10 Z"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              className="opacity-30"
            />
            <path
              d="M11 19.5h3.5l1.5-5 2.5 11.5 2.5-14.5 2.5 10.5 1.5-2.5h4"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-md"
            />
            <circle cx="24" cy="12" r="1.5" fill="#ffd700" />
          </g>
        );
      case "quality-shield":
        return (
          // Executive security/quality shield with verified tick
          <g>
            <path
              d="M24 7 L12 11 V21 C12 28, 24 33, 24 33 C24 33, 36 28, 36 21 V11 L24 7 Z"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              className="opacity-40"
            />
            <path
              d="M19 18.5 l3.5 3.5 l7.5 -7.5"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-md"
            />
            <circle cx="24" cy="30" r="1.5" fill="#34d399" />
          </g>
        );
      case "pediatric-stars":
        return (
          // Radiant star cradled by caring arcs
          <g>
            <path
              d="M12 24 A12 12 0 0 0 36 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-50"
            />
            {/* Radiant Star */}
            <path
              d="M24 10 L26.5 16.5 L33 17 L28 21 L29.5 27.5 L24 24 L18.5 27.5 L20 21 L15 17 L21.5 16.5 Z"
              fill="white"
              className="drop-shadow-md"
            />
            <circle cx="24" cy="24" r="2.5" fill="#fbbf24" />
          </g>
        );
      case "general":
      default:
        return (
          // Ultra-modern technical medical cross within standard concentric rings
          <g>
            {/* Inner dotted circular line */}
            <circle cx="24" cy="24" r="13" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2 3" className="opacity-40 animate-[spin_60s_linear_infinite]" />
            {/* Bold rounded medical cross */}
            <path
              d="M22 13h4v7h7v4h-7v7h-4v-7h-7v-4h7v-7z"
              fill="white"
              className="drop-shadow-md"
            />
            {/* Ambient gold star sparkles */}
            <path d="M34 14l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="#fef08a" className="opacity-85" />
            <path d="M12 30l0.5 1.5 1.5 0.5-1.5 0.5-0.5 1.5-0.5-1.5-1.5-0.5 1.5-0.5z" fill="#fef08a" className="opacity-70" />
          </g>
        );
    }
  };

  // Sizing styles
  if (hideText) {
    const boxClasses = size === "xl" ? "w-28 h-28 rounded-3xl" : size === "lg" ? "w-20 h-20 rounded-2xl" : size === "md" ? "w-11 h-11 rounded-xl" : "w-8 h-8 rounded-lg";
    return (
      <div className={`relative flex items-center justify-center ${boxClasses} bg-gradient-to-br ${theme.from} ${theme.to} shadow-2xl border-4 border-white select-none overflow-hidden shrink-0`}>
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:8px_8px]"></div>
        {/* Decorative thin ring */}
        <div className="absolute w-[80%] h-[80%] rounded-full border border-white/30 border-dashed animate-[spin_30s_linear_infinite]"></div>
        <svg className="w-[75%] h-[75%] relative z-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="customLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fca5a5" />
            </linearGradient>
          </defs>
          {renderSVGEmblem()}
        </svg>
        <span className="absolute bottom-1 right-2 w-auto min-w-[20px] text-center bg-black/20 text-[6px] font-mono font-black text-white px-1 py-0.5 rounded-sm">
          {initials}
        </span>
      </div>
    );
  }

  if (size === "sm") {
    // Elegant tiny logo suitable for compact sidebars or headers
    return (
      <div className={`flex items-center gap-2 select-none`}>
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 shadow-sm shrink-0">
          <svg className="w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="customLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#ea580c" />
                <stop offset="80%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
              </linearGradient>
            </defs>
            {renderSVGEmblem()}
          </svg>
          <span className="absolute -bottom-0.5 right-0.5 text-[5px] font-mono font-bold text-white/55 bg-black/35 px-0.5 rounded-sm">
            {initials}
          </span>
        </div>
        <div className="text-right flex flex-col justify-center min-w-0">
          <span className={`text-[11px] font-black tracking-tight leading-none ${dark ? "text-white" : "text-slate-850"}`}>
            {normAr.slice(0, 28) + (normAr.length > 28 ? "..." : "")}
          </span>
          <span className="text-[7.5px] font-mono text-slate-400 mt-1 uppercase tracking-tight truncate max-w-[140px]">
            {normEn}
          </span>
        </div>
      </div>
    );
  }

  if (size === "print") {
    // Pristine high-contrast corporate letterhead block for PDF exports
    return (
      <div className="flex items-center gap-3.5 select-none print:py-1">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
          <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="customLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#ea580c" />
                <stop offset="80%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            {renderSVGEmblem()}
          </svg>
        </div>
        <div className="text-right flex flex-col justify-center border-r-2 border-slate-900 pr-3">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
            {normAr}
          </h1>
          <p className="text-[9px] font-bold text-slate-600 mt-0.5 uppercase tracking-wide leading-none font-sans">
            {normEn}
          </p>
          <p className="text-[7.5px] text-slate-500 font-mono italic mt-1 leading-none">
            {isAr ? taglineAr : taglineEn}
          </p>
        </div>
      </div>
    );
  }

  if (size === "lg" || size === "xl") {
    // Magnificent featured emblem for the login display page - we use a prestigious dark canvas to match their logo image!
    const containerClasses = size === "xl" ? "w-24 h-24" : "w-18 h-18";
    return (
      <div className="flex flex-col items-center text-center space-y-4 select-none">
        <div className={`relative flex items-center justify-center ${containerClasses} rounded-2xl bg-slate-950 shadow-2xl border-2 border-slate-800 ring-4 ring-slate-900/40 group overflow-hidden transition-all duration-500 hover:scale-105`}>
          {/* Circular abstract radar wave */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:6px_6px]"></div>
          
          {/* Subtle slow rotating ring */}
          <div className="absolute w-[94%] h-[94%] rounded-full border border-white/10 border-dashed animate-[spin_40s_linear_infinite]"></div>
          
          <svg className="w-4/5 h-4/5 z-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="customLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#ea580c" />
                <stop offset="80%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            {renderSVGEmblem()}
          </svg>

          {/* Golden Corner Crest */}
          <div className="absolute top-1 right-1">
            <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
          </div>

          <span className="absolute bottom-1 right-2 text-[7px] font-mono font-black tracking-widest text-white/50 bg-black/25 px-1 py-0.5 rounded-sm">
            {initials}
          </span>
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-xl md:text-2xl font-black text-slate-850 tracking-tight leading-tight px-4 font-sans">
            {normAr}
          </h1>
          <h2 className="text-[10px] md:text-xs font-mono font-extrabold uppercase tracking-widest text-slate-500 max-w-sm">
            {normEn}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8.5px] font-mono text-emerald-700 font-extrabold tracking-widest uppercase">
              {isAr ? "نظام اعتماد الجودة والتشغيل السريري" : "QUALIFIED CLINICAL OPERATIONAL ECOSYSTEM"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT (Size md) - Suitable for Top Header bar - customized with premium dark background for the icon to match the elegant logo!
  return (
    <div className={`flex items-center gap-3 bg-white border border-slate-205 p-2 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 select-none group`}>
      <div className={`relative flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 border border-slate-850 shadow-inner overflow-hidden shrink-0`}>
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]"></div>
        {/* Decorative thin ring */}
        <div className="absolute w-[84%] h-[84%] rounded-full border border-white/10 animate-pulse"></div>
        
        <svg className="w-[84%] h-[84%] relative z-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="customLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="40%" stopColor="#ea580c" />
              <stop offset="80%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fca5a5" />
            </linearGradient>
          </defs>
          {renderSVGEmblem()}
        </svg>

        <span className="absolute bottom-0 right-1 text-[5px] font-mono font-black text-white/40">
          {initials}
        </span>
      </div>
      
      <div className="text-right">
        <div className="font-sans font-black text-slate-800 text-[11px] sm:text-xs leading-none">
          {normAr}
        </div>
        <div className={`font-mono text-[8.5px] text-pink-700 font-black uppercase tracking-wider mt-1.5 leading-none`}>
          {normEn}
        </div>
        <div className="flex items-center gap-1 mt-1 justify-end">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[7.5px] text-slate-400 font-mono uppercase tracking-widest font-black">
            {isAr ? taglineAr : taglineEn}
          </span>
        </div>
      </div>
    </div>
  );
};

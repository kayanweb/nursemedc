import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function LiveClock({ language }: { language: "ar" | "en" }) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 text-[10px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
      <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
      <span className="font-bold">
        {currentTime.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}{" "}
        {currentTime.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })}
      </span>
    </div>
  );
}

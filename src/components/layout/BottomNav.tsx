import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Calendar, Map, DollarSign, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/rides", icon: Calendar, label: "Corridas" },
  { to: "/map", icon: Map, label: "Mapa" },
  { to: "/earnings", icon: DollarSign, label: "Ganhos" },
  { to: "/premium", icon: Crown, label: "Premium" },
];

// iOS 26 spring configs
const pillSpring = { type: "spring" as const, stiffness: 500, damping: 30 };
const dotSpring = { type: "spring" as const, stiffness: 500, damping: 25 };

// iOS bounce keyframes for icon
const iconBounceAnimation = {
  scale: [1, 0.7, 1.2, 1],
  y: [0, 2, -4, 0],
};
const iconBounceTransition = {
  duration: 0.4,
  times: [0, 0.2, 0.6, 1],
};

// Haptic feedback
const triggerHaptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15);
  }
};

export function BottomNav() {
  const location = useLocation();
  const [tappedItem, setTappedItem] = useState<string | null>(null);

  const handleTap = (to: string) => {
    triggerHaptic();
    setTappedItem(to);
    setTimeout(() => setTappedItem(null), 400);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass Navigation background - iOS 26 style */}
      <div className="absolute inset-0 glass-nav" />
      
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto relative">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
          const isTapped = tappedItem === to;

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex-1 relative py-3 select-none touch-manipulation",
                "flex flex-col items-center gap-1"
              )}
              onClick={() => handleTap(to)}
            >
              {/* Tap scale container - iOS whileTap effect */}
              <motion.div
                className="flex flex-col items-center gap-1 relative"
                whileTap={{ scale: 0.85 }}
              >
                {/* Background pill with shared layout - iOS 26 style */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 -top-1 -bottom-1 rounded-2xl -z-10"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))",
                        boxShadow: "0 0 20px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(var(--primary) / 0.2)",
                        border: "1px solid hsl(var(--primary) / 0.3)",
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={pillSpring}
                    />
                  )}
                </AnimatePresence>

                {/* Icon with iOS bounce animation */}
                <motion.div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    isActive ? "bg-primary/20" : "bg-transparent"
                  )}
                  animate={
                    isTapped
                      ? iconBounceAnimation
                      : {
                          scale: isActive ? 1.1 : 1,
                          y: isActive ? -2 : 0,
                        }
                  }
                  transition={isTapped ? iconBounceTransition : pillSpring}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </motion.div>

                {/* Label */}
                <motion.span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                  transition={pillSpring}
                >
                  {label}
                </motion.span>

                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="w-1 h-1 rounded-full bg-primary"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={dotSpring}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
      
      {/* Safe area padding */}
      <div className="safe-bottom" />
    </nav>
  );
}

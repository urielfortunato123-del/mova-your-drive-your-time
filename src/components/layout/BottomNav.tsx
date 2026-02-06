import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Calendar, Map, DollarSign, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  springSnappy, 
  springBounce, 
  navItemVariants, 
  navIndicatorDot, 
  rippleVariants,
  triggerHaptic 
} from "@/lib/animations";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/rides", icon: Calendar, label: "Corridas" },
  { to: "/map", icon: Map, label: "Mapa" },
  { to: "/earnings", icon: DollarSign, label: "Ganhos" },
  { to: "/premium", icon: Crown, label: "Premium" },
];

export function BottomNav() {
  const location = useLocation();
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  // Find active index - also check if path starts with the route (for nested routes)
  const activeIndex = navItems.findIndex(item => 
    location.pathname === item.to || location.pathname.startsWith(item.to + "/")
  );

  // Calculate pill position based on actual DOM elements
  useEffect(() => {
    if (navRef.current && activeIndex >= 0) {
      const navItems = navRef.current.querySelectorAll('a');
      const activeItem = navItems[activeIndex] as HTMLElement;
      if (activeItem) {
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        setPillStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
        });
      }
    }
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass Navigation background - iOS 26 style */}
      <div className="absolute inset-0 glass-nav" />
      
      <div ref={navRef} className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto relative">
        {/* Sliding background pill with glow */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute h-14 rounded-2xl -z-10"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.06))",
              boxShadow: "0 0 25px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--primary) / 0.15)",
              border: "1px solid hsl(var(--primary) / 0.25)",
            }}
            initial={false}
            animate={{
              left: pillStyle.left,
              width: pillStyle.width,
            }}
            transition={springSnappy}
          />
        )}

        {navItems.map(({ to, icon: Icon, label }, index) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
          const isPressed = pressedItem === to;

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex-1 relative py-3 select-none touch-manipulation",
                "flex flex-col items-center gap-1"
              )}
              onMouseDown={() => setPressedItem(to)}
              onMouseUp={() => setPressedItem(null)}
              onMouseLeave={() => setPressedItem(null)}
              onTouchStart={() => setPressedItem(to)}
              onTouchEnd={() => setPressedItem(null)}
            >
              {/* Icon container with iOS bounce effect */}
              <motion.div
                className="flex flex-col items-center gap-1"
                animate={{
                  scale: isPressed ? 0.85 : isActive ? 1.08 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={isPressed ? springBounce : springSnappy}
              >
                <motion.div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive 
                      ? "bg-primary/20 border border-primary/30" 
                      : "bg-transparent"
                  )}
                  animate={{
                    rotate: isActive ? [0, -6, 6, -3, 3, 0] : 0,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  }}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </motion.div>

                {/* Label */}
                <motion.span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                  }}
                  transition={springSnappy}
                >
                  {label}
                </motion.span>

                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="w-1 h-1 rounded-full bg-primary"
                      {...navIndicatorDot}
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Ripple effect on tap */}
              <AnimatePresence>
                {isPressed && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full bg-primary/15"
                      initial={rippleVariants.initial}
                      animate={rippleVariants.animate}
                      transition={rippleVariants.transition}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </div>
      
      {/* Safe area padding */}
      <div className="safe-bottom" />
    </nav>
  );
}

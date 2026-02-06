import React, { useState, useRef, useEffect } from "react";
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

// iOS 26 style spring configuration - smoother and more fluid
const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const bounceConfig = {
  type: "spring" as const,
  stiffness: 500,
  damping: 20,
  mass: 0.6,
};

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
      {/* Glass background */}
      <div className="absolute inset-0 bg-card/70 backdrop-blur-2xl border-t border-border/30" />
      
      <div ref={navRef} className="flex items-center justify-around px-1 max-w-lg mx-auto relative">
        {/* Sliding background pill - iOS 26 glass style */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute h-11 rounded-2xl -z-10"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))",
              boxShadow: "inset 0 1px 1px hsl(var(--primary) / 0.1), 0 0 20px hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.2)",
            }}
            initial={false}
            animate={{
              left: pillStyle.left,
              width: pillStyle.width,
            }}
            transition={springConfig}
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
                "nav-item flex-1 relative py-3 select-none touch-manipulation",
                isActive && "nav-item-active"
              )}
              onMouseDown={() => setPressedItem(to)}
              onMouseUp={() => setPressedItem(null)}
              onMouseLeave={() => setPressedItem(null)}
              onTouchStart={() => setPressedItem(to)}
              onTouchEnd={() => setPressedItem(null)}
            >
              {/* Icon container with iOS bounce effect */}
              <motion.div
                className="flex flex-col items-center gap-0.5"
                animate={{
                  scale: isPressed ? 0.85 : isActive ? 1.05 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={isPressed ? bounceConfig : springConfig}
              >
                <motion.div
                  animate={{
                    rotate: isActive ? [0, -8, 8, -4, 4, 0] : 0,
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

                {/* Label with fade animation */}
                <motion.span
                  className={cn(
                    "text-[10px]",
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                  animate={{
                    opacity: isActive ? 1 : 0.6,
                  }}
                  transition={springConfig}
                >
                  {label}
                </motion.span>
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
                      initial={{ scale: 0.5, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
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

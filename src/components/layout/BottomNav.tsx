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

// iOS 26 style spring configuration
const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

const bounceConfig = {
  type: "spring" as const,
  stiffness: 500,
  damping: 15,
  mass: 0.5,
};

export function BottomNav() {
  const location = useLocation();
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  const activeIndex = navItems.findIndex(item => item.to === location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 safe-bottom z-50">
      <div className="flex items-center justify-around px-2 max-w-lg mx-auto relative">
        {/* Sliding background pill - iOS 26 style */}
        <motion.div
          className="absolute h-12 bg-primary/10 rounded-2xl -z-10"
          initial={false}
          animate={{
            x: `calc(${activeIndex * 100}% + ${activeIndex * 8}px)`,
            width: `calc(${100 / navItems.length}% - 8px)`,
          }}
          transition={springConfig}
          style={{
            left: 4,
          }}
        />

        {navItems.map(({ to, icon: Icon, label }, index) => {
          const isActive = location.pathname === to;
          const isPressed = pressedItem === to;

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "nav-item flex-1 relative py-3 select-none",
                isActive && "nav-item-active"
              )}
              onMouseDown={() => setPressedItem(to)}
              onMouseUp={() => setPressedItem(null)}
              onMouseLeave={() => setPressedItem(null)}
              onTouchStart={() => setPressedItem(to)}
              onTouchEnd={() => setPressedItem(null)}
            >
              {/* Active top indicator with smooth animation */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute top-0 left-1/2 w-8 h-1 bg-primary rounded-b-full"
                    initial={{ scaleX: 0, x: "-50%", opacity: 0 }}
                    animate={{ scaleX: 1, x: "-50%", opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={springConfig}
                  />
                )}
              </AnimatePresence>

              {/* Icon container with iOS bounce effect */}
              <motion.div
                className={cn(
                  "p-2 rounded-xl transition-colors duration-200",
                  isActive && "bg-transparent"
                )}
                animate={{
                  scale: isPressed ? 0.85 : isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={isPressed ? bounceConfig : springConfig}
              >
                <motion.div
                  animate={{
                    rotate: isActive ? [0, -10, 10, -5, 5, 0] : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  }}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </motion.div>
              </motion.div>

              {/* Label with fade animation */}
              <motion.span
                className={cn(
                  "text-[10px] mt-1 block",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  y: isActive ? 0 : 2,
                  scale: isActive ? 1.05 : 1,
                }}
                transition={springConfig}
              >
                {label}
              </motion.span>

              {/* Ripple effect on tap */}
              <AnimatePresence>
                {isPressed && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-full bg-primary/20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

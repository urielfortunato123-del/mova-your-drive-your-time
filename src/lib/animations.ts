// MOVA Design System - iOS 26 Style Animations
// Centralized animation constants for consistent motion across the app

// ============================================
// SPRING CONFIGURATIONS
// ============================================

// Bouncy spring - for buttons and interactive elements
export const springBounce = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

// Smooth spring - for cards and containers
export const springSmooth = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
};

// Snappy spring - for navigation and quick transitions
export const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
};

// Gentle spring - for subtle animations
export const springGentle = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

// ============================================
// BUTTON VARIANTS
// ============================================

export const buttonVariants = {
  idle: { scale: 1, y: 0 },
  hover: { 
    scale: 1.03, 
    y: -4,
    transition: springBounce,
  },
  tap: { 
    scale: 0.92,
    y: 2,
    transition: springBounce,
  },
};

export const buttonSecondaryVariants = {
  idle: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -2,
    transition: springSmooth,
  },
  tap: { 
    scale: 0.95,
    y: 1,
    transition: springBounce,
  },
};

// ============================================
// CARD VARIANTS
// ============================================

export const cardVariants = {
  idle: { scale: 1, y: 0 },
  hover: { 
    y: -6, 
    scale: 1.02,
    transition: springSmooth,
  },
  tap: { 
    scale: 0.95,
    y: 2,
    transition: springBounce,
  },
};

export const cardSubtleVariants = {
  idle: { scale: 1, y: 0 },
  hover: { 
    y: -4, 
    scale: 1.01,
    transition: springSmooth,
  },
  tap: { 
    scale: 0.98,
    y: 1,
    transition: springBounce,
  },
};

// ============================================
// ICON VARIANTS
// ============================================

export const iconBounce = {
  idle: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.15,
    rotate: [0, -10, 10, 0],
    transition: {
      rotate: { duration: 0.4, ease: "easeOut" },
      scale: springBounce,
    },
  },
};

export const iconWiggle = {
  animate: {
    rotate: [0, -8, 8, -4, 4, 0],
  },
  transition: {
    duration: 0.5,
    ease: "easeOut",
  },
};

export const iconPulse = {
  animate: {
    scale: [1, 1.1, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// ============================================
// NAV ITEM VARIANTS
// ============================================

export const navItemVariants = {
  idle: { scale: 1, y: 0 },
  active: { 
    scale: 1.08, 
    y: -2,
    transition: springSnappy,
  },
  tap: { 
    scale: 0.85,
    transition: springBounce,
  },
};

export const navPillVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: springSnappy,
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const navIndicatorDot = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: springBounce,
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// ============================================
// CONTAINER / STAGGER VARIANTS
// ============================================

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.1, 
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: springSmooth,
  },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springSmooth,
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springSmooth,
  },
};

// ============================================
// SHIMMER EFFECT
// ============================================

export const shimmerVariants = {
  initial: { x: "-100%", opacity: 0 },
  hover: { 
    x: "100%", 
    opacity: 0.3,
    transition: { 
      duration: 0.6, 
      ease: "easeInOut",
    },
  },
};

// ============================================
// GLOW EFFECT
// ============================================

export const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 20px hsl(var(--primary) / 0.3)",
      "0 0 35px hsl(var(--primary) / 0.5)",
      "0 0 20px hsl(var(--primary) / 0.3)",
    ],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// ============================================
// HAPTIC FEEDBACK
// ============================================

export const triggerHaptic = (duration: number = 15) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(duration);
  }
};

export const triggerHapticLight = () => triggerHaptic(10);
export const triggerHapticMedium = () => triggerHaptic(20);
export const triggerHapticHeavy = () => triggerHaptic(35);

// ============================================
// ARROW ANIMATION
// ============================================

export const arrowBounce = {
  animate: { x: [0, 6, 0] },
  transition: { 
    duration: 1.2, 
    repeat: Infinity, 
    ease: "easeInOut",
  },
};

// ============================================
// RIPPLE EFFECT
// ============================================

export const rippleVariants = {
  initial: { scale: 0.5, opacity: 0.5 },
  animate: { 
    scale: 1.5, 
    opacity: 0,
  },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

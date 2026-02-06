import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/ui/stat-card";
import { RideCard } from "@/components/ui/ride-card";
import { Button } from "@/components/ui/button";
import { DailyGoal } from "@/components/dashboard/DailyGoal";
import { RideOffersPanel } from "@/components/ride/RideOffersPanel";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/usePremium";
import { Calendar, Clock, DollarSign, TrendingUp, MapPin, Power, Timer, ArrowRight, CreditCard, Crown, Star, Navigation } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Daily goal (can be made configurable later)
const DAILY_GOAL = 300;

// iOS 26 style spring configurations
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

const gentleSpring = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
  mass: 0.8,
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfig,
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springConfig,
  },
};

const statsGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig,
  },
};

const bannerVariants = {
  hidden: { opacity: 0, x: -40, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      ...springConfig,
      stiffness: 250,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfig,
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { dailyStats, todayRides, isOnline, todayOnlineSeconds, toggleOnline, earnings } = useDriver();
  const { driver } = useAuth();
  const { isPremium } = usePremium();

  const nextRide = todayRides
    .filter(r => r.status === 'confirmed')
    .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime())[0];

  const formatNextTime = () => {
    if (!dailyStats.nextRideTime) return "—";
    const time = new Date(dailyStats.nextRideTime);
    return format(time, "HH:mm", { locale: ptBR });
  };

  const formatOnlineTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageContainer title="MOVA">
      <motion.div 
        className="space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Section */}
        <motion.div variants={fadeInUp}>
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {driver?.name?.split(' ')[0] || 'Motorista'}
          </h2>
        </motion.div>

        {/* Online Toggle Section - Premium glass card style */}
        <motion.div
          variants={scaleIn}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
            "bg-gradient-to-br from-card/80 to-card/60",
            "backdrop-blur-[20px]",
            "border",
            isOnline 
              ? "border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.2)]" 
              : "border-border/40"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isOnline 
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
                    : "bg-secondary/80 text-muted-foreground border border-border/30"
                )}
                animate={isOnline ? { 
                  boxShadow: [
                    "0 0 20px hsl(var(--primary) / 0.3)", 
                    "0 0 35px hsl(var(--primary) / 0.5)", 
                    "0 0 20px hsl(var(--primary) / 0.3)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Timer className="w-7 h-7" />
              </motion.div>
              <div>
                <p className={cn(
                  "font-display font-bold text-lg",
                  isOnline ? "text-primary" : "text-muted-foreground"
                )}>
                  {isOnline ? "Online" : "Offline"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Hoje: <span className="font-mono font-semibold text-foreground">{formatOnlineTime(todayOnlineSeconds)}</span>
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={bounceConfig}
            >
              <Button
                onClick={toggleOnline}
                size="lg"
                variant={isOnline ? "destructive" : "default"}
                className="gap-2 min-w-[110px] h-12 font-semibold"
              >
                <motion.div
                  animate={isOnline ? {} : { rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Power className="w-5 h-5" />
                </motion.div>
                {isOnline ? "Parar" : "Iniciar"}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Ride Offers Section - Shows when online */}
        {isOnline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div 
                className="p-1.5 rounded-lg bg-primary/10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Navigation className="w-4 h-4 text-primary" />
              </motion.div>
              <h3 className="font-semibold text-foreground">Corridas Disponíveis</h3>
            </div>
            <RideOffersPanel />
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 gap-3"
          variants={statsGridVariants}
        >
          <motion.div variants={statCardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <StatCard
              label="Corridas Hoje"
              value={dailyStats.scheduledRides}
              icon={Calendar}
            />
          </motion.div>
          <motion.div variants={statCardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <StatCard
              label="Próxima às"
              value={formatNextTime()}
              icon={Clock}
            />
          </motion.div>
          <motion.div variants={statCardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <StatCard
              label="Ganho Previsto"
              value={`R$ ${dailyStats.estimatedEarnings.toFixed(0)}`}
              icon={DollarSign}
              highlight
            />
          </motion.div>
          <motion.div variants={statCardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <StatCard
              label="Concluídas"
              value={dailyStats.completedRides}
              icon={TrendingUp}
            />
          </motion.div>
        </motion.div>

        {/* Daily Goal */}
        <motion.div variants={fadeInUp}>
          <DailyGoal 
            current={earnings.today} 
            goal={DAILY_GOAL} 
          />
        </motion.div>

        {/* Premium Banner - Glass style matching reference */}
        <motion.div variants={bannerVariants}>
          <Link to={isPremium ? "/premium/goals" : "/premium"} className="block">
            <motion.div 
              className={cn(
                "relative overflow-hidden rounded-2xl p-4",
                "bg-gradient-to-br from-card/80 to-card/60",
                "backdrop-blur-[20px]",
                "border border-primary/30",
                "shadow-[0_0_25px_hsl(var(--primary)/0.15)]"
              )}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={bounceConfig}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-warning to-warning/70 rounded-xl flex items-center justify-center shrink-0"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Crown className="w-6 h-6 text-warning-foreground" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-sm">✨</span>
                      <p className="font-display font-bold text-foreground flex items-center gap-1">
                        MOVA+
                        {isPremium && <Star className="w-3.5 h-3.5 text-primary fill-current" />}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isPremium ? "Ver suas metas • Nível Bronze" : "Nível Bronze • +5% cashback"}
                    </p>
                  </div>
                </div>
                <motion.div
                  className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Benefícios Section - Matching reference style */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎁</span>
            <h3 className="font-display font-semibold text-foreground">Benefícios Exclusivos</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Parceiros */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={bounceConfig}
            >
              <Link to="/premium/partners" className="block">
                <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-[20px] border border-border/40 hover:border-primary/30 transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Parceiros</span>
                  </div>
                </div>
              </Link>
            </motion.div>
            
            {/* Telefonia */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={bounceConfig}
            >
              <Link to="/premium/telefonia" className="block">
                <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-[20px] border border-border/40 hover:border-primary/30 transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-lg">📱</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Telefonia</span>
                  </div>
                </div>
              </Link>
            </motion.div>
            
            {/* Bradesco */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={bounceConfig}
            >
              <Link to="/bradesco" className="block">
                <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-[20px] border border-border/40 hover:border-destructive/30 transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/20 flex items-center justify-center">
                      <span className="text-destructive font-bold text-lg">B</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Bradesco</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Action Button - Full width green style */}
        <motion.div variants={buttonVariants}>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={bounceConfig}
          >
            <Button
              onClick={() => navigate('/rides')}
              className="w-full h-14 text-base font-semibold gap-3 rounded-2xl"
              size="lg"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-lg">⚡</span>
              </motion.div>
              Ver Corridas
            </Button>
          </motion.div>
        </motion.div>

        {/* Next Ride Preview */}
        {nextRide && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Próxima Corrida</h3>
              <span className="text-sm text-muted-foreground font-mono">
                {format(new Date(nextRide.pickupTime), "HH:mm")}
              </span>
            </div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={bounceConfig}
            >
              <RideCard 
                ride={nextRide} 
                onClick={() => navigate(`/rides/${nextRide.id}`)}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Empty State */}
        {!nextRide && dailyStats.scheduledRides === 0 && (
          <motion.div 
            className="text-center py-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <p className="text-foreground font-medium">
              Nenhuma corrida agendada para hoje
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Mantenha seu status disponível para receber novas corridas
            </p>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
}

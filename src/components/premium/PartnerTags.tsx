import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, DollarSign, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PartnerTagType = 'popular' | 'bonus' | 'fast';

interface PartnerTagConfig {
  label: string;
  icon: React.ElementType;
  className: string;
}

const TAG_CONFIGS: Record<PartnerTagType, PartnerTagConfig> = {
  popular: {
    label: 'Mais usado pelos motoristas',
    icon: Star,
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  bonus: {
    label: 'Conta para o bônus',
    icon: DollarSign,
    className: 'bg-success/10 text-success border-success/20',
  },
  fast: {
    label: 'Atendimento rápido',
    icon: Zap,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
};

interface PartnerTagProps {
  type: PartnerTagType;
  compact?: boolean;
  className?: string;
}

export function PartnerTag({ type, compact = false, className }: PartnerTagProps) {
  const config = TAG_CONFIGS[type];
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-[10px] px-1.5 py-0.5 gap-0.5",
          config.className,
          className
        )}
      >
        <Icon className="w-2.5 h-2.5" />
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] px-2 py-0.5 gap-1",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

interface PartnerTagsProps {
  tags: PartnerTagType[];
  compact?: boolean;
  className?: string;
}

export function PartnerTags({ tags, compact = false, className }: PartnerTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <PartnerTag key={tag} type={tag} compact={compact} />
      ))}
    </div>
  );
}

// Helper to get random tags for demo purposes (static assignment)
export function getPartnerTags(partnerId: string, tipo: string): PartnerTagType[] {
  const tags: PartnerTagType[] = [];
  
  // All partners count for bonus
  tags.push('bonus');
  
  // Add "popular" to some partners based on a simple hash
  const hash = partnerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  if (hash % 3 === 0) {
    tags.push('popular');
  }
  
  // Add "fast" to gas stations and some repair shops
  if (tipo === 'posto' || (tipo === 'oficina' && hash % 2 === 0)) {
    tags.push('fast');
  }
  
  return tags;
}

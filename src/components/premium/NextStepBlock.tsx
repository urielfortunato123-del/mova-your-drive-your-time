import React from 'react';
import { Card } from '@/components/ui/card';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStepBlockProps {
  className?: string;
}

export function NextStepBlock({ className }: NextStepBlockProps) {
  const steps = [
    'Concluir 1 corrida hoje',
    'Abastecer em um parceiro MOVA',
    'Ativar seu benefício de telefonia',
  ];

  return (
    <Card className={cn("p-4 bg-primary/5 border-primary/20", className)}>
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Pin className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm mb-2">
            Próximo passo para liberar seu bônus:
          </p>
          <ul className="space-y-1.5">
            {steps.map((step, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

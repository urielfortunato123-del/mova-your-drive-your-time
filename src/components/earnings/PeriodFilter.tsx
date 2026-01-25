import React, { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type PeriodType = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

interface PeriodFilterProps {
  period: PeriodType;
  dateRange: DateRange;
  onPeriodChange: (period: PeriodType) => void;
  onDateRangeChange: (range: DateRange) => void;
}

export function PeriodFilter({
  period,
  dateRange,
  onPeriodChange,
  onDateRangeChange,
}: PeriodFilterProps) {
  const [customOpen, setCustomOpen] = useState(false);

  const handlePeriodChange = (value: PeriodType) => {
    onPeriodChange(value);
    const today = new Date();

    switch (value) {
      case 'today':
        onDateRangeChange({ from: today, to: today });
        break;
      case 'week':
        onDateRangeChange({
          from: startOfWeek(today, { locale: ptBR }),
          to: endOfWeek(today, { locale: ptBR }),
        });
        break;
      case 'month':
        onDateRangeChange({
          from: startOfMonth(today),
          to: endOfMonth(today),
        });
        break;
      case 'custom':
        setCustomOpen(true);
        break;
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return 'Hoje';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      case 'custom':
        return `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={period} onValueChange={(v) => handlePeriodChange(v as PeriodType)}>
        <SelectTrigger className="w-auto min-w-[140px] h-9 text-sm">
          <SelectValue placeholder="Período">{getPeriodLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="week">Esta Semana</SelectItem>
          <SelectItem value="month">Este Mês</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {period === 'custom' && (
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-2 text-sm",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onDateRangeChange({ from: range.from, to: range.to });
                  setCustomOpen(false);
                } else if (range?.from) {
                  onDateRangeChange({ from: range.from, to: range.from });
                }
              }}
              numberOfMonths={1}
              locale={ptBR}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

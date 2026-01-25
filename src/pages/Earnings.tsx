import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/ui/stat-card";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, TrendingUp, Clock, FileText, Loader2, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ptBR } from "date-fns/locale";

// Mock data for worked hours per day (last 7 days)
const hoursWorkedData = [
  { day: "Seg", hours: 6.5 },
  { day: "Ter", hours: 8.2 },
  { day: "Qua", hours: 7.0 },
  { day: "Qui", hours: 9.5 },
  { day: "Sex", hours: 10.0 },
  { day: "Sáb", hours: 5.5 },
  { day: "Dom", hours: 3.0 },
];

export default function Earnings() {
  const { earnings, rides } = useDriver();
  const { driver } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const completedRides = rides.filter(r => r.status === 'completed');

  const generatePDFBlob = async (): Promise<Blob> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 102, 51); // Green
      doc.text("MOVA", margin, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text("Relatório de Ganhos", margin, yPos + 8);
      
      // Date
      doc.setFontSize(10);
      doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), pageWidth - margin - 50, yPos);
      
      yPos += 25;

      // Driver Info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Motorista:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(driver?.name || "Não identificado", margin + 30, yPos);
      yPos += 8;
      
      if (driver?.vehicle) {
        doc.setFont("helvetica", "bold");
        doc.text("Veículo:", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${driver.vehicle} - ${driver.plate || ''}`, margin + 25, yPos);
        yPos += 8;
      }

      yPos += 10;

      // Summary Box
      doc.setFillColor(240, 255, 240);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 3, 3, "F");
      
      yPos += 12;
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text("RESUMO FINANCEIRO", margin + 5, yPos);
      
      yPos += 12;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 102, 51);
      doc.text(`Total do Mês: R$ ${earnings.month.toFixed(2)}`, margin + 5, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Hoje: R$ ${earnings.today.toFixed(2)}  |  Semana: R$ ${earnings.week.toFixed(2)}  |  Espera: R$ ${earnings.waitingTotal.toFixed(2)}`, margin + 5, yPos);

      yPos += 25;

      // Hours Summary
      const totalWeekHours = hoursWorkedData.reduce((sum, d) => sum + d.hours, 0);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Horas Trabalhadas (7 dias)", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${totalWeekHours.toFixed(1)}h total`, pageWidth - margin - 30, yPos);
      
      yPos += 10;
      
      // Hours table
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 2, 2, "F");
      
      const dayWidth = (pageWidth - margin * 2) / 7;
      hoursWorkedData.forEach((d, i) => {
        const x = margin + i * dayWidth + dayWidth / 2;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(d.day, x, yPos + 7, { align: "center" });
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`${d.hours}h`, x, yPos + 15, { align: "center" });
        doc.setFont("helvetica", "normal");
      });

      yPos += 30;

      // Rides List
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento de Corridas", margin, yPos);
      yPos += 10;

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Passageiro", margin + 3, yPos + 6);
      doc.text("Local", margin + 55, yPos + 6);
      doc.text("Valor", pageWidth - margin - 30, yPos + 6);
      doc.text("Espera", pageWidth - margin - 10, yPos + 6);
      yPos += 10;

      // Table rows
      doc.setFont("helvetica", "normal");
      completedRides.slice(0, 15).forEach((ride, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPos - 2, pageWidth - margin * 2, 10, "F");
        }

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(ride.passengerName.substring(0, 20), margin + 3, yPos + 5);
        doc.setTextColor(100, 100, 100);
        doc.text(ride.pickupAddress.split(' - ')[0].substring(0, 25), margin + 55, yPos + 5);
        doc.setTextColor(0, 102, 51);
        doc.text(`R$ ${ride.estimatedValue.toFixed(2)}`, pageWidth - margin - 30, yPos + 5);
        if (ride.waitingValue && ride.waitingValue > 0) {
          doc.setTextColor(204, 153, 0);
          doc.text(`+R$ ${ride.waitingValue.toFixed(2)}`, pageWidth - margin - 10, yPos + 5);
        }
        yPos += 10;
      });

      yPos += 10;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, margin, yPos);
      doc.text("MOVA - Motorista de Transporte Executivo", pageWidth - margin - 60, yPos);

      return doc.output('blob');
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await generatePDFBlob();
      const fileName = `MOVA_Relatorio_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setExporting(false);
    }
  };

  const handleSharePDF = async () => {
    setSharing(true);
    try {
      const blob = await generatePDFBlob();
      const fileName = `MOVA_Relatorio_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Relatório de Ganhos MOVA',
          text: `Relatório de ganhos - ${format(new Date(), "dd/MM/yyyy")}`,
          files: [file],
        });
        toast.success("Relatório compartilhado!");
      } else {
        // Fallback: download the file
        handleExportPDF();
        toast.info("Compartilhamento não suportado. Arquivo baixado.");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Error sharing PDF:", error);
        toast.error("Erro ao compartilhar relatório");
      }
    } finally {
      setSharing(false);
    }
  };

  const totalWeekHours = hoursWorkedData.reduce((sum, d) => sum + d.hours, 0);
  const avgDailyHours = (totalWeekHours / 7).toFixed(1);

  return (
    <PageContainer title="Ganhos">
      <div className="space-y-6">
        {/* Main Earnings Card */}
        <div className="bg-card rounded-2xl border border-success/20 p-6 earnings-highlight animate-fade-in">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total do Mês</p>
            <p className="text-4xl font-display font-bold text-success mb-2">
              R$ {earnings.month.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Incluindo R$ {earnings.waitingTotal.toFixed(2)} em espera remunerada
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Hoje"
            value={`R$ ${earnings.today.toFixed(2)}`}
            icon={DollarSign}
          />
          <StatCard
            label="Semana"
            value={`R$ ${earnings.week.toFixed(2)}`}
            icon={TrendingUp}
          />
        </div>

        {/* Hours Worked Chart */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Horas Trabalhadas</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{totalWeekHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">média {avgDailyHours}h/dia</p>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursWorkedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}h`, 'Horas']}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {hoursWorkedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === hoursWorkedData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waiting Earnings Card */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Espera Remunerada</p>
              <p className="text-lg font-bold text-foreground">
                R$ {earnings.waitingTotal.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              100% para você
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3">Detalhamento</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {completedRides.slice(0, 5).map((ride) => (
              <div key={ride.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{ride.passengerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {ride.pickupAddress.split(' - ')[0]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">
                    R$ {ride.estimatedValue.toFixed(2)}
                  </p>
                  {ride.waitingValue && ride.waitingValue > 0 && (
                    <p className="text-xs text-warning">
                      +R$ {ride.waitingValue.toFixed(2)} espera
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export/Share Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            disabled={exporting || sharing}
            variant="outline"
            className="flex-1 gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? "Baixando..." : "Baixar PDF"}
          </Button>
          <Button
            onClick={handleSharePDF}
            disabled={exporting || sharing}
            className="flex-1 gap-2 bg-success hover:bg-success/90"
          >
            {sharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {sharing ? "Compartilhando..." : "Compartilhar"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

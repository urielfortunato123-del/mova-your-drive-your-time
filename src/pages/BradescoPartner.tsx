import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Fuel, 
  Shield, 
  Wrench, 
  Droplet,
  Gift,
  Plus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Car,
  MapPin,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock data for KM balance
const kmData = {
  balance: 1250.5,
  monthlyEarned: 345.0,
  totalRedeemed: 2500.0,
  pendingKm: 45.0
};

// Mock transaction history
const recentTransactions = [
  { id: 1, type: 'earned', description: 'Compra no débito', amount: 125.5, date: '22 Jan' },
  { id: 2, type: 'earned', description: 'Compra no crédito', amount: 89.0, date: '21 Jan' },
  { id: 3, type: 'redeemed', description: 'Desconto combustível', amount: -50.0, date: '20 Jan' },
  { id: 4, type: 'earned', description: 'Compra no débito', amount: 67.5, date: '19 Jan' },
];

// Benefits available for redemption
const benefits = [
  { 
    id: 1, 
    icon: Shield, 
    title: 'Seguro Auto', 
    description: 'Desconto no seguro veicular',
    kmCost: 500,
    discount: 'Até 15% OFF',
    category: 'Proteção'
  },
  { 
    id: 2, 
    icon: Fuel, 
    title: 'Combustível', 
    description: 'Desconto em postos parceiros',
    kmCost: 100,
    discount: 'R$ 0,10/litro',
    category: 'Abastecimento'
  },
  { 
    id: 3, 
    icon: Droplet, 
    title: 'Troca de Óleo', 
    description: 'Desconto em troca de óleo',
    kmCost: 200,
    discount: '20% OFF',
    category: 'Manutenção'
  },
  { 
    id: 4, 
    icon: Wrench, 
    title: 'Manutenção Geral', 
    description: 'Desconto em oficinas parceiras',
    kmCost: 300,
    discount: 'Até 25% OFF',
    category: 'Manutenção'
  },
  { 
    id: 5, 
    icon: Car, 
    title: 'Revisão Completa', 
    description: 'Revisão com desconto especial',
    kmCost: 400,
    discount: '30% OFF',
    category: 'Manutenção'
  },
];

export default function BradescoPartner() {
  const { driver } = useAuth();
  const [hasCard, setHasCard] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const handleAddCard = () => {
    if (!cardNumber || !cardName || !cardExpiry) {
      toast.error('Preencha todos os campos do cartão');
      return;
    }
    setHasCard(true);
    setIsAddingCard(false);
    toast.success('Cartão Bradesco vinculado com sucesso!');
  };

  const handleRedeemBenefit = (benefit: typeof benefits[0]) => {
    if (kmData.balance < benefit.kmCost) {
      toast.error('Saldo de KM insuficiente');
      return;
    }
    toast.success(`Benefício "${benefit.title}" resgatado com sucesso!`);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 16);
    return limited.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 4);
    if (limited.length >= 2) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    }
    return limited;
  };

  return (
    <PageContainer title="Banco Parceiro">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#CC092F] to-[#8B0620] p-6 text-white animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span className="text-[#CC092F] font-bold text-lg">B</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">MOVA + Bradesco</h2>
                <p className="text-white/80 text-sm">Parceria exclusiva para motoristas</p>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
              <p className="text-sm text-white/90 mb-2">Seu saldo de KM</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{kmData.balance.toLocaleString('pt-BR')}</span>
                <span className="text-lg text-white/80">KM</span>
              </div>
              <p className="text-xs text-white/70 mt-1">
                +{kmData.monthlyEarned} KM este mês
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <Card className="animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#CC092F] text-white flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Use seu cartão Bradesco</p>
                <p className="text-sm text-muted-foreground">Nas compras do dia a dia</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#CC092F] text-white flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Acumule KM automaticamente</p>
                <p className="text-sm text-muted-foreground">R$ 1 gasto = 0,5 KM acumulado</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#CC092F] text-white flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Troque por benefícios</p>
                <p className="text-sm text-muted-foreground">Descontos em parceiros MOVA e Bradesco</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Section */}
        <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Cartão Bradesco
            </CardTitle>
            <CardDescription>
              Vincule seu cartão para acumular KM automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasCard ? (
              <div className="bg-gradient-to-br from-[#CC092F] to-[#8B0620] rounded-xl p-5 text-white">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-10 h-8 bg-yellow-400/90 rounded" />
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <p className="font-mono text-lg tracking-wider mb-4">
                  •••• •••• •••• {cardNumber.slice(-4) || '4532'}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-white/70">Titular</p>
                    <p className="font-medium">{cardName || driver?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/70">Válido até</p>
                    <p className="font-medium">{cardExpiry || '12/28'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
                <DialogTrigger asChild>
                  <Button className="w-full h-14 text-base" variant="outline">
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Cartão Bradesco
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Vincular Cartão Bradesco</DialogTitle>
                    <DialogDescription>
                      Adicione seu cartão para começar a acumular KM em todas as compras
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Nome no Cartão</Label>
                      <Input
                        id="cardName"
                        placeholder="Como está no cartão"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Validade</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <Button onClick={handleAddCard} className="w-full bg-[#CC092F] hover:bg-[#A00725]">
                      Vincular Cartão
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Seus dados estão protegidos pela criptografia Bradesco
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        {/* KM Stats */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Este mês</span>
              </div>
              <p className="text-2xl font-bold text-foreground">+{kmData.monthlyEarned}</p>
              <p className="text-xs text-muted-foreground">KM acumulados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Gift className="w-4 h-4" />
                <span className="text-xs">Total resgatado</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kmData.totalRedeemed.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">KM em benefícios</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Extrato de KM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {transaction.type === 'earned' ? <Plus className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount} KM
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Benefits to Redeem */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Resgatar Benefícios
          </h3>
          <div className="space-y-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              const canRedeem = kmData.balance >= benefit.kmCost;
              const progress = Math.min((kmData.balance / benefit.kmCost) * 100, 100);
              
              return (
                <Card 
                  key={benefit.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${250 + index * 50}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#CC092F]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-[#CC092F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">{benefit.title}</p>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0 bg-[#CC092F]/10 text-[#CC092F] border-0">
                            {benefit.discount}
                          </Badge>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {canRedeem ? 'Disponível para resgate' : `Faltam ${(benefit.kmCost - kmData.balance).toFixed(0)} KM`}
                            </span>
                            <span className="font-medium text-foreground">{benefit.kmCost} KM</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        <Button 
                          size="sm" 
                          className={`mt-3 ${canRedeem ? 'bg-[#CC092F] hover:bg-[#A00725]' : ''}`}
                          variant={canRedeem ? 'default' : 'outline'}
                          disabled={!canRedeem}
                          onClick={() => handleRedeemBenefit(benefit)}
                        >
                          {canRedeem ? (
                            <>
                              Resgatar <ArrowRight className="w-4 h-4 ml-1" />
                            </>
                          ) : (
                            'KM insuficiente'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Partner Locations */}
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Parceiros Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-[#CC092F]" />
                  <div>
                    <p className="text-sm font-medium">Posto Ipiranga Centro</p>
                    <p className="text-xs text-muted-foreground">500m de distância</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">Aberto</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-[#CC092F]" />
                  <div>
                    <p className="text-sm font-medium">Auto Center Bradesco</p>
                    <p className="text-xs text-muted-foreground">1.2km de distância</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">Aberto</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#CC092F]" />
                  <div>
                    <p className="text-sm font-medium">Bradesco Seguros</p>
                    <p className="text-xs text-muted-foreground">Atendimento online</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center py-4 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Programa MOVA + Bradesco S.A. Parceria exclusiva.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Regulamento completo em bradesco.com.br/mova
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

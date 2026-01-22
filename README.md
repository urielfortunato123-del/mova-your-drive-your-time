# MOVA – Motorista

## 📱 Visão Geral

**MOVA - Motorista** é um Progressive Web App (PWA) desenvolvido para motoristas de transporte executivo, focado em **corridas agendadas**, **previsibilidade** e **valorização do motorista**. Diferente de apps de ride-hailing sob demanda, o MOVA prioriza a qualidade do serviço e o bem-estar do profissional.

### Filosofia do Produto
> "Mobilidade que respeita seu tempo."

O MOVA foi projetado para:
- ✅ Corridas **agendadas** (não sob demanda)
- ✅ **Tempo de espera remunerado** (R$ 0,25/min até 15 min)
- ✅ **100% do valor da espera** vai para o motorista
- ✅ Comunicação direta com passageiros via chat
- ✅ Mapa com pontos de interesse (postos, banheiros, descanso)
- ✅ Parcerias com desconto exclusivo para motoristas

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| **React** | 18.3.1 | Framework UI |
| **Vite** | - | Build tool + Dev server |
| **TypeScript** | - | Type safety |
| **Tailwind CSS** | 4.x | Estilização utility-first |
| **shadcn/ui** | - | Componentes UI (Radix primitives) |
| **React Router DOM** | 6.30.1 | Roteamento SPA |
| **TanStack Query** | 5.83.0 | Data fetching & caching |
| **Framer Motion** | - | Animações (via Tailwind) |
| **date-fns** | 3.6.0 | Manipulação de datas |
| **Zod** | 3.25.76 | Validação de schemas |
| **Lucide React** | 0.462.0 | Ícones SVG |

### Backend (Lovable Cloud / Supabase)
| Serviço | Função |
|---------|--------|
| **Supabase Auth** | Autenticação (email/senha) |
| **Supabase Database** | PostgreSQL para perfis de motoristas |
| **Supabase Edge Functions** | API serverless (preços de combustível) |
| **Supabase RLS** | Segurança a nível de linha |

### PWA
| Recurso | Implementação |
|---------|---------------|
| **vite-plugin-pwa** | Service Worker + Manifest |
| **Manifest.json** | Instalável como app nativo |
| **Ícones** | 72x72, 192x192, 512x512 |
| **Orientação** | Portrait-only |

### Mapas
| Biblioteca | Versão | Função |
|------------|--------|--------|
| **Leaflet** | 1.9.4 | Renderização de mapas |
| **React-Leaflet** | 4.2.1 | Wrapper React para Leaflet |
| **OpenStreetMap** | - | Tiles gratuitos |

---

## 📁 Estrutura do Projeto

```
src/
├── assets/                    # Imagens e assets estáticos
│   └── mova-car.png          # Imagem do carro na tela de login
│
├── components/
│   ├── chat/
│   │   └── ChatDrawer.tsx    # Drawer de chat com passageiro
│   │
│   ├── layout/
│   │   ├── BottomNav.tsx     # Navegação inferior (5 tabs)
│   │   ├── Header.tsx        # Header com status toggle
│   │   └── PageContainer.tsx # Container padrão de páginas
│   │
│   └── ui/                   # Componentes shadcn/ui customizados
│       ├── ride-card.tsx     # Card de corrida
│       ├── wait-timer.tsx    # Timer de espera remunerada
│       ├── status-toggle.tsx # Toggle de disponibilidade
│       ├── stat-card.tsx     # Card de estatísticas
│       └── [+50 componentes] # Accordion, Dialog, Sheet, etc.
│
├── contexts/
│   ├── AuthContext.tsx       # Autenticação + perfil do motorista
│   └── DriverContext.tsx     # Estado de corridas, status, chat
│
├── hooks/
│   ├── useNotifications.ts   # Push notifications
│   ├── usePWAInstall.ts      # Instalação do PWA
│   ├── use-mobile.tsx        # Detecção de mobile
│   └── use-toast.ts          # Sistema de toasts
│
├── integrations/
│   └── supabase/
│       ├── client.ts         # Cliente Supabase (auto-gerado)
│       └── types.ts          # Tipos do DB (auto-gerado)
│
├── pages/
│   ├── Login.tsx             # Tela de login/cadastro
│   ├── Dashboard.tsx         # Página inicial (em development)
│   ├── Rides.tsx             # Lista de corridas agendadas
│   ├── RideDetail.tsx        # Detalhes da corrida + timer
│   ├── History.tsx           # Histórico de corridas
│   ├── Earnings.tsx          # Resumo de ganhos
│   ├── DriverMap.tsx         # Mapa com POIs
│   ├── Benefits.tsx          # QR Code + parceiros
│   ├── Profile.tsx           # Perfil do motorista
│   ├── Install.tsx           # Página de instalação do PWA
│   └── NotFound.tsx          # Página 404
│
├── types/
│   └── ride.ts               # Tipos TypeScript (Ride, Driver, etc.)
│
├── lib/
│   └── utils.ts              # Utilitário cn() para classNames
│
├── App.tsx                   # Router principal
├── App.css                   # Estilos globais (mínimo)
├── index.css                 # Design system (tokens, animações)
└── main.tsx                  # Entry point

public/
├── manifest.json             # PWA manifest
├── icons/                    # Ícones PWA (72, 192, 512)
├── favicon.ico
├── placeholder.svg
└── robots.txt

supabase/
├── config.toml               # Configuração Supabase
└── functions/
    └── fuel-prices/
        └── index.ts          # Edge function para preços de combustível
```

---

## 🎨 Design System

### Paleta de Cores (HSL)

```css
/* Modo Claro */
--background: 220 20% 97%;          /* Cinza azulado claro */
--foreground: 220 30% 12%;          /* Quase preto */
--primary: 220 60% 20%;             /* Azul marinho (confiança) */
--accent: 160 60% 40%;              /* Verde esmeralda (ganhos) */

/* Status do Motorista */
--available: 160 60% 45%;           /* Verde - Disponível */
--paused: 45 90% 50%;               /* Amarelo - Pausado */
--unavailable: 0 65% 55%;           /* Vermelho - Indisponível */

/* Feedback */
--success: 160 60% 40%;             /* Verde para confirmações */
--warning: 45 90% 50%;              /* Amarelo para alertas */
--destructive: 0 65% 55%;           /* Vermelho para erros */
```

### Tipografia
- **Display/Headings**: Space Grotesk (500-700)
- **Body/UI**: Inter (300-800)

### Animações Customizadas
```css
.animate-fade-in     /* Fade in 0.3s */
.animate-slide-up    /* Slide up + fade 0.3s */
.animate-pulse-slow  /* Pulse 2s infinite (timer) */
```

---

## 📱 Rotas e Páginas

| Rota | Componente | Descrição | Auth |
|------|------------|-----------|------|
| `/` | Login | Tela de login/cadastro | ❌ |
| `/dashboard` | Dashboard | Resumo do dia, próxima corrida | ✅ |
| `/rides` | Rides | Lista de corridas agendadas | ✅ |
| `/rides/:id` | RideDetail | Detalhes + timer + chat | ✅ |
| `/history` | History | Histórico com filtros | ✅ |
| `/earnings` | Earnings | Ganhos diários/semanais/mensais | ✅ |
| `/map` | DriverMap | Mapa com POIs | ✅ |
| `/benefits` | Benefits | QR Code + parceiros | ✅ |
| `/profile` | Profile | Dados do motorista | ✅ |
| `/install` | Install | Instruções de instalação PWA | ❌ |

### Navegação Inferior (BottomNav)
5 tabs fixas:
1. **Início** → `/dashboard`
2. **Corridas** → `/rides`
3. **Mapa** → `/map`
4. **Ganhos** → `/earnings`
5. **Perfil** → `/profile`

---

## 📊 Modelos de Dados

### Ride (Corrida)
```typescript
interface Ride {
  id: string;
  passengerName: string;
  passengerPhone?: string;
  pickupTime: string;              // ISO string
  pickupAddress: string;
  dropoffAddress: string;
  estimatedValue: number;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  waitingTime?: number;            // minutos
  waitingValue?: number;           // R$ (0.25/min)
  startedAt?: string;
  completedAt?: string;
  cancelReason?: string;
  messages?: ChatMessage[];
}
```

### DriverProfile (Perfil do Motorista)
```typescript
interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  vehicle?: string;
  plate?: string;
  city?: string;
  isActive: boolean;
}
```

### ChatMessage (Mensagem)
```typescript
interface ChatMessage {
  id: string;
  rideId: string;
  sender: 'driver' | 'passenger';
  message: string;
  timestamp: string;
  read: boolean;
}
```

### DriverStatus
```typescript
type DriverStatus = 'available' | 'paused' | 'unavailable';
```

### DailyStats
```typescript
interface DailyStats {
  scheduledRides: number;
  nextRideTime: string | null;
  estimatedEarnings: number;
  completedRides: number;
}
```

### EarningsSummary
```typescript
interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  waitingTotal: number;
}
```

### Partner (Parceiro)
```typescript
interface Partner {
  id: string;
  name: string;
  category: string;           // Combustível, Oficina, Pneus, etc.
  discount: string;           // "5% de desconto", "R$ 10 off"
  logo?: string;
}
```

---

## 🗃️ Banco de Dados (Supabase)

### Tabela: `driver_profiles`

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | ❌ | gen_random_uuid() |
| user_id | uuid | ❌ | - |
| name | text | ❌ | - |
| email | text | ❌ | - |
| phone | text | ✅ | null |
| photo | text | ✅ | null |
| vehicle | text | ✅ | null |
| plate | text | ✅ | null |
| city | text | ✅ | null |
| is_active | boolean | ❌ | true |
| created_at | timestamptz | ❌ | now() |
| updated_at | timestamptz | ❌ | now() |

### RLS Policies (Row Level Security)
- Motoristas só podem ver/editar seu próprio perfil
- Autenticação obrigatória para acessar dados

---

## ⚡ Edge Functions

### `fuel-prices`
Retorna postos de combustível próximos com preços.

**Request:**
```json
POST /functions/v1/fuel-prices
{
  "lat": -23.5505,
  "lng": -46.6333,
  "radiusKm": 5
}
```

**Response:**
```json
{
  "stations": [
    {
      "id": "station-1",
      "name": "Posto Shell",
      "brand": "Shell",
      "lat": -23.5425,
      "lng": -46.6283,
      "address": "Av. Paulista, 1000",
      "city": "São Paulo",
      "open24h": true,
      "prices": {
        "gasolina": 5.89,
        "etanol": 3.99,
        "diesel": 5.49
      },
      "distance": "850m",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "source": "mock",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Autenticação

### Fluxo de Login
1. Usuário insere email/senha
2. Validação com Zod
3. `supabase.auth.signInWithPassword()`
4. Busca `driver_profiles` pelo `user_id`
5. Redireciona para `/dashboard`

### Fluxo de Cadastro
1. Usuário insere nome/email/senha
2. Validação com Zod
3. `supabase.auth.signUp()` com `emailRedirectTo`
4. Criação do perfil em `driver_profiles`
5. Auto-confirm habilitado (sem verificação de email)

### AuthContext
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  driver: DriverProfile | null;
  isLoading: boolean;
  login: (email, password) => Promise<{ error: string | null }>;
  signUp: (email, password, name?) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}
```

---

## 🚗 Funcionalidades Principais

### 1. Timer de Espera Remunerada
O diferencial do MOVA: tempo de espera pelo passageiro é **100% remunerado** ao motorista.

**Regras:**
- Taxa: **R$ 0,25/minuto**
- Limite: **15 minutos**
- Após limite: opção de cancelar sem penalidade

**Fluxo:**
1. Motorista clica "Cheguei"
2. Timer inicia automaticamente
3. Valor acumula em tempo real
4. "Passageiro Chegou" → registra tempo/valor
5. Valor somado ao ganho da corrida

### 2. Chat com Passageiro
Comunicação em tempo real dentro do app.

**Features:**
- Mensagens em bolhas (estilo WhatsApp)
- Indicador de mensagens não lidas
- Respostas simuladas (demo)
- Histórico persistente por corrida

### 3. Mapa de POIs (Pontos de Interesse)
Mapa interativo com locais úteis para motoristas.

**Categorias:**
- ⛽ **Postos** - com preços de combustível
- ☕ **Descanso** - cafés e lanchonetes
- 🚻 **Banheiros** - públicos e em shoppings
- 🅿️ **Estacionamento** - áreas de parada

**Features:**
- Geolocalização do motorista
- Favoritos (localStorage)
- Filtros por categoria
- Navegação externa (Google Maps)
- Badge de fonte de dados (API real vs mock)

### 4. Sistema de Parceiros
QR Code exclusivo para descontos.

**Categorias de Parceiros:**
- Combustível
- Oficina mecânica
- Pneus
- Troca de óleo
- Lavagem

### 5. Painel de Ganhos
Dashboard financeiro do motorista.

**Métricas:**
- Ganhos do dia
- Ganhos da semana
- Ganhos do mês
- Total de espera remunerada

---

## 📦 PWA (Progressive Web App)

### Manifest.json
```json
{
  "name": "MOVA - Motorista",
  "short_name": "MOVA",
  "description": "Mobilidade que respeita seu tempo.",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/"
}
```

### Instalação
**Android:**
1. Acessar o app no Chrome
2. Menu ⋮ → "Adicionar à tela inicial"
3. Confirmar instalação

**iOS:**
1. Acessar o app no Safari
2. Botão compartilhar → "Adicionar à Tela de Início"
3. Confirmar instalação

### Hook `usePWAInstall`
```typescript
interface PWAInstallReturn {
  isInstallable: boolean;    // Pode instalar?
  isInstalled: boolean;      // Já instalado?
  isIOS: boolean;            // É iOS?
  promptInstall: () => void; // Trigger instalação
}
```

---

## 🚀 Executando o Projeto

### Pré-requisitos
- Node.js 18+
- npm ou bun

### Instalação
```bash
# Clonar repositório
git clone <repo-url>
cd mova-motorista

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=xxx
```

---

## 📋 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Executar ESLint |
| `npm run test` | Executar testes (Vitest) |

---

## 🧪 Testes

O projeto usa **Vitest** para testes unitários.

```bash
# Rodar testes
npm run test

# Watch mode
npm run test -- --watch
```

---

## 📝 Licença

Este projeto é proprietário e confidencial.

---

## 🤝 Contribuição

Para contribuir:
1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit: `git commit -m 'feat: minha feature'`
3. Push: `git push origin feature/minha-feature`
4. Abra um Pull Request

---

## 📞 Suporte

Para dúvidas ou suporte técnico, entre em contato com a equipe de desenvolvimento.

---

## 🗺️ Roadmap (Próximas Features)

### ✅ Implementado (v1.1.0)
- [x] Parceria MOVA + Bradesco S.A. (Programa de KM)
- [x] Upload de foto de perfil (Supabase Storage)
- [x] Modo escuro/claro com toggle
- [x] Meta diária de ganhos
- [x] Comprovante de corrida (download/compartilhar)
- [x] Avaliação de passageiros (3-5 estrelas)
- [x] Gráfico de horas trabalhadas
- [x] Banner de instalação PWA flutuante

### Em Desenvolvimento
- [ ] Push notifications reais
- [ ] Persistência de avaliações no banco
- [ ] Integração com API de preços ANP

### Planejado
- [ ] Histórico de corridas no banco de dados
- [ ] Relatórios em PDF
- [ ] Integração com Waze
- [ ] Chat em tempo real (WebSocket)
- [ ] Rastreamento GPS

---

## 🏦 Parceria MOVA + Bradesco S.A.

O MOVA possui uma parceria exclusiva com o Banco Bradesco, oferecendo um programa de fidelidade para motoristas:

### Programa de KM
- **Acúmulo**: R$ 1 gasto no cartão Bradesco = 0,5 KM
- **Resgate**: KM podem ser trocados por benefícios exclusivos

### Benefícios Disponíveis
| Benefício | Custo (KM) | Desconto |
|-----------|------------|----------|
| Seguro Auto | 500 KM | Até 15% OFF |
| Combustível | 100 KM | R$ 0,10/litro |
| Troca de Óleo | 200 KM | 20% OFF |
| Manutenção Geral | 300 KM | Até 25% OFF |
| Revisão Completa | 400 KM | 30% OFF |

### Acesso
- Dashboard → Banner Bradesco
- Benefícios → Card Bradesco
- Rota: `/bradesco`

---

**Versão:** 1.1.0  
**Última atualização:** Janeiro 2025

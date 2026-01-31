# 🎨 MOVA Design System

> Sistema de design completo para o aplicativo MOVA - Guia de referência para desenvolvedores e designers.

---

## 📋 Índice

- [Filosofia de Design](#filosofia-de-design)
- [Paleta de Cores](#paleta-de-cores)
- [Tipografia](#tipografia)
- [Espaçamentos](#espaçamentos)
- [Bordas e Raios](#bordas-e-raios)
- [Sombras](#sombras)
- [Animações](#animações)
- [Componentes](#componentes)
- [Modo Escuro](#modo-escuro)
- [Tokens CSS](#tokens-css)

---

## 🎯 Filosofia de Design

O MOVA utiliza uma estética **profissional e confiável**, focada em:

- **Clareza**: Informações importantes são facilmente identificáveis
- **Confiança**: Cores sólidas que transmitem segurança e profissionalismo
- **Eficiência**: Interface limpa que não distrai o motorista/usuário
- **Acessibilidade**: Contraste adequado em todos os modos

### Princípios Visuais

| Princípio | Descrição |
|-----------|-----------|
| 🎯 Simplicidade | Menos é mais - cada elemento tem propósito |
| 🔒 Confiança | Azul marinho transmite profissionalismo |
| 💚 Sucesso | Verde esmeralda para ganhos e confirmações |
| ⚡ Responsividade | Mobile-first, otimizado para uso em movimento |

---

## 🎨 Paleta de Cores

### Cores Primárias

#### Modo Claro (Light Mode)

| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--background` | `220 20% 97%` | #F5F6F8 | Fundo principal da aplicação |
| `--foreground` | `220 30% 12%` | #1A1F2E | Texto principal |
| `--card` | `0 0% 100%` | #FFFFFF | Fundo de cards |
| `--card-foreground` | `220 30% 12%` | #1A1F2E | Texto em cards |
| `--primary` | `220 60% 20%` | #142952 | Ações principais, header |
| `--primary-foreground` | `0 0% 98%` | #FAFAFA | Texto sobre primary |
| `--secondary` | `220 15% 92%` | #E8EAED | Elementos secundários |
| `--secondary-foreground` | `220 30% 20%` | #283040 | Texto secundário |
| `--muted` | `220 15% 94%` | #EDEEF1 | Backgrounds sutis |
| `--muted-foreground` | `220 10% 45%` | #6B7280 | Texto desabilitado/sutil |
| `--accent` | `160 60% 40%` | #29A370 | Destaques, ganhos |
| `--accent-foreground` | `0 0% 100%` | #FFFFFF | Texto sobre accent |

#### Modo Escuro (Dark Mode)

| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--background` | `220 30% 8%` | #0F1218 | Fundo principal |
| `--foreground` | `220 10% 95%` | #F0F1F3 | Texto principal |
| `--card` | `220 25% 12%` | #171C26 | Fundo de cards |
| `--card-foreground` | `220 10% 95%` | #F0F1F3 | Texto em cards |
| `--primary` | `160 60% 45%` | #33B87D | Ações principais (verde no dark) |
| `--primary-foreground` | `220 30% 8%` | #0F1218 | Texto sobre primary |
| `--secondary` | `220 25% 18%` | #232A38 | Elementos secundários |
| `--secondary-foreground` | `220 10% 90%` | #E3E5E8 | Texto secundário |
| `--muted` | `220 25% 18%` | #232A38 | Backgrounds sutis |
| `--muted-foreground` | `220 10% 55%` | #848B96 | Texto desabilitado |
| `--accent` | `160 60% 45%` | #33B87D | Destaques |
| `--accent-foreground` | `220 30% 8%` | #0F1218 | Texto sobre accent |

### Cores de Status

| Token | HSL | Uso | Ícone |
|-------|-----|-----|-------|
| `--available` | `160 60% 45%` | Motorista disponível | 🟢 |
| `--paused` | `45 90% 50%` | Motorista pausado | 🟡 |
| `--unavailable` | `0 65% 55%` | Motorista indisponível | 🔴 |
| `--success` | `160 60% 40%` | Confirmações, ganhos | ✅ |
| `--warning` | `45 90% 50%` | Alertas, atenção | ⚠️ |
| `--destructive` | `0 65% 55%` | Erros, cancelamentos | ❌ |

### Cores da Sidebar

| Token | HSL | Uso |
|-------|-----|-----|
| `--sidebar-background` | `220 30% 12%` | Fundo da sidebar |
| `--sidebar-foreground` | `220 10% 90%` | Texto da sidebar |
| `--sidebar-primary` | `160 60% 45%` | Itens ativos |
| `--sidebar-accent` | `220 25% 18%` | Hover states |
| `--sidebar-border` | `220 25% 20%` | Bordas |

### Gradientes

```css
/* Gradiente Primário - Headers e CTAs */
--gradient-primary: linear-gradient(135deg, hsl(220 60% 20%), hsl(220 50% 30%));

/* Gradiente de Sucesso - Cards de ganhos */
--gradient-success: linear-gradient(135deg, hsl(160 60% 40%), hsl(160 50% 50%));

/* Gradiente de Card - Efeito sutil */
--gradient-card: linear-gradient(180deg, hsl(0 0% 100%), hsl(220 20% 98%));
```

---

## 🔤 Tipografia

### Famílias de Fontes

| Família | Variável | Uso |
|---------|----------|-----|
| **Space Grotesk** | `font-display` | Headlines, títulos (H1-H6) |
| **Inter** | `font-sans` | Corpo de texto, UI elements |
| **System UI** | Fallback | Quando fonts não carregam |

### Import (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
```

### Hierarquia Tipográfica

| Elemento | Font | Weight | Tamanho Sugerido |
|----------|------|--------|------------------|
| H1 | Space Grotesk | 700 | 2.25rem (36px) |
| H2 | Space Grotesk | 600 | 1.875rem (30px) |
| H3 | Space Grotesk | 600 | 1.5rem (24px) |
| H4 | Space Grotesk | 500 | 1.25rem (20px) |
| Body | Inter | 400 | 1rem (16px) |
| Body Small | Inter | 400 | 0.875rem (14px) |
| Caption | Inter | 500 | 0.75rem (12px) |
| Button | Inter | 500-600 | 0.875rem (14px) |

### Configuração Tailwind

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
}
```

---

## 📐 Espaçamentos

### Sistema de Grid

O MOVA usa o sistema de espaçamento padrão do Tailwind com customizações:

| Classe | Valor | Uso |
|--------|-------|-----|
| `p-1` | 0.25rem (4px) | Padding mínimo |
| `p-2` | 0.5rem (8px) | Padding pequeno |
| `p-3` | 0.75rem (12px) | Padding médio-pequeno |
| `p-4` | 1rem (16px) | Padding padrão |
| `p-5` | 1.25rem (20px) | Padding médio |
| `p-6` | 1.5rem (24px) | Padding grande |
| `gap-1` | 0.25rem | Espaço mínimo entre elementos |
| `gap-2` | 0.5rem | Espaço pequeno |
| `gap-4` | 1rem | Espaço padrão |
| `gap-6` | 1.5rem | Espaço grande |

### Container

```typescript
container: {
  center: true,
  padding: "1rem",
  screens: {
    "2xl": "1400px",
  },
}
```

---

## 🔲 Bordas e Raios

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius` | 0.75rem (12px) | Valor base |
| `rounded-lg` | 0.75rem | Cards, modais |
| `rounded-md` | calc(0.75rem - 2px) | Botões, inputs |
| `rounded-sm` | calc(0.75rem - 4px) | Badges, chips |
| `rounded-xl` | 1rem | Cards destacados |
| `rounded-full` | 9999px | Avatares, badges circulares |

### Bordas

| Token | Cor HSL | Uso |
|-------|---------|-----|
| `--border` | `220 15% 88%` (light) | Bordas de cards, inputs |
| `--border` | `220 25% 20%` (dark) | Bordas no modo escuro |
| `--input` | `220 15% 88%` | Borda de inputs |
| `--ring` | `220 60% 20%` | Focus ring |

---

## 🌫️ Sombras

### Sistema de Sombras

| Classe | Valor | Uso |
|--------|-------|-----|
| `shadow-sm` | Tailwind default | Elevação mínima |
| `shadow-card` | `0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)` | Cards em repouso |
| `shadow-card-hover` | `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)` | Cards em hover |
| `shadow-nav` | `0 -1px 3px 0 rgb(0 0 0 / 0.05)` | Barra de navegação inferior |

### Configuração

```typescript
boxShadow: {
  'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  'nav': '0 -1px 3px 0 rgb(0 0 0 / 0.05)',
}
```

---

## ⚡ Animações

### Keyframes Definidos

```typescript
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
  "slide-up": {
    from: { opacity: "0", transform: "translateY(10px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  "fade-in": {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
}
```

### Classes de Animação

| Classe | Duração | Uso |
|--------|---------|-----|
| `animate-accordion-down` | 0.2s ease-out | Abrir accordions |
| `animate-accordion-up` | 0.2s ease-out | Fechar accordions |
| `animate-slide-up` | 0.3s ease-out | Entrada de elementos |
| `animate-fade-in` | 0.3s ease-out | Fade de elementos |
| `animate-pulse-slow` | 2s infinite | Indicadores ativos |

### Animações Customizadas (CSS)

```css
/* Pulse lento para indicadores */
.animate-pulse-slow {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Slide up para entradas */
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

/* Fade in suave */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Pulse para tracking em tempo real */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}
```

---

## 🧩 Componentes

### Classes de Componentes Reutilizáveis

#### Status Badges

```css
/* Disponível */
.status-available {
  @apply bg-available text-available-foreground;
}

/* Pausado */
.status-paused {
  @apply bg-paused text-paused-foreground;
}

/* Indisponível */
.status-unavailable {
  @apply bg-unavailable text-unavailable-foreground;
}
```

#### Cards

```css
/* Card de corrida */
.card-ride {
  @apply bg-card rounded-xl border border-border p-4 shadow-sm 
         transition-all duration-200 hover:shadow-md hover:border-primary/20;
}

/* Card de estatística */
.card-stat {
  @apply bg-card rounded-xl border border-border p-5 shadow-sm;
}

/* Destaque de ganhos */
.earnings-highlight {
  @apply bg-gradient-to-br from-success/10 to-success/5 border-success/20;
}
```

#### Navegação

```css
/* Item de navegação */
.nav-item {
  @apply flex flex-col items-center gap-1 py-2 px-3 
         text-muted-foreground transition-colors;
}

/* Item ativo */
.nav-item-active {
  @apply text-primary font-medium;
}
```

#### Efeitos Especiais

```css
/* Efeito glass/blur */
.glass {
  @apply bg-white/80 backdrop-blur-lg;
}

/* Timer ativo pulsando */
.timer-active {
  @apply animate-pulse-slow;
}
```

### Safe Areas (Mobile)

```css
/* Padding inferior seguro (notch, home indicator) */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

/* Padding superior seguro (notch) */
.safe-top {
  padding-top: env(safe-area-inset-top, 0);
}
```

---

## 🌙 Modo Escuro

### Implementação

O modo escuro é controlado pela classe `dark` no elemento `<html>`:

```tsx
// Hook useTheme.ts
const { theme, setTheme } = useTheme();
// theme: 'light' | 'dark' | 'system'
```

### Diferenças Principais

| Aspecto | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | Cinza claro (#F5F6F8) | Azul escuro (#0F1218) |
| Cards | Branco puro | Cinza escuro (#171C26) |
| Primary | Azul marinho | Verde esmeralda |
| Texto | Escuro sobre claro | Claro sobre escuro |
| Bordas | Mais claras | Mais escuras |

### Tokens que Mudam

```css
/* Light */
--primary: 220 60% 20%;      /* Azul marinho */
--ring: 220 60% 20%;

/* Dark */
--primary: 160 60% 45%;      /* Verde esmeralda */
--ring: 160 60% 45%;
```

---

## 📝 Tokens CSS Completos

### Variáveis CSS (Light Mode)

```css
:root {
  /* Backgrounds */
  --background: 220 20% 97%;
  --foreground: 220 30% 12%;
  --card: 0 0% 100%;
  --card-foreground: 220 30% 12%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 30% 12%;
  
  /* Brand */
  --primary: 220 60% 20%;
  --primary-foreground: 0 0% 98%;
  --secondary: 220 15% 92%;
  --secondary-foreground: 220 30% 20%;
  --accent: 160 60% 40%;
  --accent-foreground: 0 0% 100%;
  
  /* Neutrals */
  --muted: 220 15% 94%;
  --muted-foreground: 220 10% 45%;
  
  /* Status */
  --available: 160 60% 45%;
  --available-foreground: 0 0% 100%;
  --paused: 45 90% 50%;
  --paused-foreground: 45 90% 15%;
  --unavailable: 0 65% 55%;
  --unavailable-foreground: 0 0% 100%;
  --success: 160 60% 40%;
  --success-foreground: 0 0% 100%;
  --warning: 45 90% 50%;
  --warning-foreground: 45 90% 15%;
  --destructive: 0 65% 55%;
  --destructive-foreground: 0 0% 98%;
  
  /* UI */
  --border: 220 15% 88%;
  --input: 220 15% 88%;
  --ring: 220 60% 20%;
  --radius: 0.75rem;
  
  /* Sidebar */
  --sidebar-background: 220 30% 12%;
  --sidebar-foreground: 220 10% 90%;
  --sidebar-primary: 160 60% 45%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 25% 18%;
  --sidebar-accent-foreground: 220 10% 90%;
  --sidebar-border: 220 25% 20%;
  --sidebar-ring: 160 60% 45%;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(220 60% 20%), hsl(220 50% 30%));
  --gradient-success: linear-gradient(135deg, hsl(160 60% 40%), hsl(160 50% 50%));
  --gradient-card: linear-gradient(180deg, hsl(0 0% 100%), hsl(220 20% 98%));
}
```

---

## 🛠️ Uso no Código

### Importando Cores (Tailwind)

```tsx
// ✅ Correto - usar tokens semânticos
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground" />
<span className="text-success" />
<div className="border-border" />

// ❌ Incorreto - cores hardcoded
<div className="bg-white text-black" />
<button className="bg-blue-900 text-white" />
<span className="text-green-500" />
```

### Usando em CSS Customizado

```css
.custom-element {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}
```

---

## 📱 Responsividade

### Breakpoints

| Breakpoint | Largura | Dispositivo |
|------------|---------|-------------|
| `sm` | 640px | Mobile grande |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |
| `2xl` | 1536px | Widescreen |

### Mobile-First

O MOVA é desenvolvido com abordagem **mobile-first**:

```tsx
// Exemplo de responsividade
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-3xl">Título</h1>
</div>
```

---

## 📚 Arquivos de Referência

| Arquivo | Conteúdo |
|---------|----------|
| `src/index.css` | Variáveis CSS, classes utilitárias |
| `tailwind.config.ts` | Configuração Tailwind, cores, animações |
| `src/components/ui/` | Componentes base (shadcn/ui) |

---

<p align="center">
  <strong>MOVA Design System v1.0</strong><br>
  Consistência visual para uma experiência premium 🚗
</p>

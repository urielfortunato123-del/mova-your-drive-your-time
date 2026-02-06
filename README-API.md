# API Backend MOVA - Documentação

## Visão Geral

Backend unificado para conectar os apps **Passageiro** e **Motorista** usando Supabase.

## URLs dos Endpoints

Base URL: `https://phmgsnnwrnnutupjtpll.supabase.co/functions/v1/`

### Autenticação

Todos os endpoints requerem header:
```
Authorization: Bearer <supabase_access_token>
```

### Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api-onboarding` | POST | Cria perfil do usuário (passenger ou driver) |
| `/api-driver-online` | POST | Marca motorista online/offline |
| `/api-driver-location` | POST | Atualiza localização do motorista |
| `/api-rides` | POST | Cria nova corrida (passageiro) |
| `/api-rides` | GET | Lista corridas do usuário |
| `/api-driver-offers` | GET | Lista ofertas ativas (motorista) |
| `/api-ride-accept` | POST | Aceita uma corrida (motorista) |
| `/api-ride-status` | POST | Atualiza status da corrida |
| `/api-ride-detail` | GET | Detalhes de uma corrida |

---

## Detalhes dos Endpoints

### POST /api-onboarding
Cria perfil do usuário após cadastro.

**Body:**
```json
{
  "role": "passenger" | "driver",
  "full_name": "Nome Completo",
  "phone": "+5511999999999"
}
```

**Response (201):**
```json
{
  "success": true,
  "profile": { "id": "uuid", "role": "passenger", ... }
}
```

---

### POST /api-driver-online
Marca motorista como online/offline.

**Body:**
```json
{
  "is_online": true
}
```

---

### POST /api-driver-location
Atualiza localização do motorista (chamar a cada 10-15s quando online).

**Body:**
```json
{
  "lat": -23.5505,
  "lng": -46.6333
}
```

---

### POST /api-rides
Cria nova corrida e inicia matching.

**Body:**
```json
{
  "origin": {
    "lat": -23.5505,
    "lng": -46.6333,
    "address": "Av Paulista, 1000"
  },
  "destination": {
    "lat": -23.5600,
    "lng": -46.6500,
    "address": "Rua Augusta, 500"
  },
  "scheduled_for": null
}
```

**Response (201):**
```json
{
  "success": true,
  "ride_id": "uuid",
  "status": "MATCHING"
}
```

---

### GET /api-driver-offers
Lista ofertas ativas para o motorista.

**Response:**
```json
{
  "offers": [
    {
      "id": "uuid",
      "ride_id": "uuid",
      "expires_at": "2026-02-06T17:00:00Z",
      "rides_v2": {
        "origin_address": "...",
        "dest_address": "...",
        "price_cents": 2500
      }
    }
  ]
}
```

---

### POST /api-ride-accept
Motorista aceita uma corrida.

**Body:**
```json
{
  "ride_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "ride": { "id": "uuid", "status": "ACCEPTED", ... }
}
```

---

### POST /api-ride-status
Atualiza status da corrida.

**Body:**
```json
{
  "ride_id": "uuid",
  "status": "ARRIVING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
}
```

**Regras:**
- Passageiro: só pode CANCELLED antes do ACCEPTED
- Motorista: pode avançar ARRIVING → IN_PROGRESS → COMPLETED

---

### GET /api-ride-detail?ride_id=uuid
Retorna detalhes da corrida.

**Response:**
```json
{
  "ride": {
    "id": "uuid",
    "status": "ACCEPTED",
    "origin_address": "...",
    "dest_address": "...",
    "passenger": { "full_name": "...", "phone": "..." },
    "driver": { "full_name": "...", "phone": "..." },
    "driver_vehicle": { "vehicle_plate": "...", "vehicle_model": "..." }
  }
}
```

---

## Realtime (Supabase)

As tabelas abaixo têm Realtime habilitado:

- `rides_v2` - Passageiro acompanha status
- `ride_offers` - Motorista recebe ofertas
- `driver_profiles_v2` - Status online dos motoristas

### Exemplo de uso (Frontend):

```typescript
import { supabase } from './supabaseClient';

// Passageiro: acompanhar status da corrida
const channel = supabase
  .channel('ride-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'rides_v2',
      filter: `id=eq.${rideId}`
    },
    (payload) => {
      console.log('Ride updated:', payload.new);
    }
  )
  .subscribe();

// Motorista: receber novas ofertas
const offersChannel = supabase
  .channel('driver-offers')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ride_offers',
      filter: `driver_id=eq.${driverId}`
    },
    (payload) => {
      console.log('New offer:', payload.new);
    }
  )
  .subscribe();
```

---

## CORS

Todos os endpoints aceitam requisições de qualquer origem (`*`).

Headers permitidos:
- `authorization`
- `x-client-info`
- `apikey`
- `content-type`

---

## Fluxo Completo

1. **Onboarding**: Usuário faz signup no Supabase Auth → chama `/api-onboarding`
2. **Motorista fica online**: Chama `/api-driver-online` com `is_online: true`
3. **Motorista envia localização**: A cada 10-15s chama `/api-driver-location`
4. **Passageiro cria corrida**: Chama `/api-rides` → recebe `ride_id`
5. **Sistema faz matching**: Envia ofertas para top 5 motoristas mais próximos
6. **Motorista recebe oferta**: Via Realtime ou polling em `/api-driver-offers`
7. **Motorista aceita**: Chama `/api-ride-accept`
8. **Motorista atualiza status**: ARRIVING → IN_PROGRESS → COMPLETED via `/api-ride-status`
9. **Passageiro acompanha**: Via Realtime na tabela `rides_v2`

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 401 | Não autenticado |
| 403 | Sem permissão (ex: passageiro tentando aceitar corrida) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: corrida já aceita por outro motorista) |
| 422 | Validação falhou |
| 500 | Erro interno |

# Master Prompt: Ajuste de Visibilidade de Dados Baseada em Cargos (RBAC)

**Objetivo:** Modificar a lógica de busca de dados na aplicação para que a visibilidade de processos e itens da agenda seja controlada pelo cargo (`Role`) do usuário logado. Usuários com permissões específicas (ex: `data.view_all`) devem visualizar todos os dados, enquanto outros usuários devem ver apenas os dados associados a eles. Esta funcionalidade deve se integrar ao sistema RBAC já implementado.

## 1. Lógica Central de Visibilidade de Dados

O agente DEVE criar uma função utilitária centralizada para determinar o filtro de `userId` a ser aplicado nas queries do Prisma, com base nas permissões do usuário.

### 1.1. Função `getUserIdFilter`

```typescript
// utils/dataVisibility.ts
import { Prisma } from '@prisma/client';
import { hasPermission, getUserWithPermissions } from './auth'; // Assumindo que 'auth' contém essas funções

interface UserSession {
  id: string;
  // ... outras propriedades da sessão, como email, etc.
}

/**
 * Retorna o filtro de userId para queries do Prisma, baseado nas permissões do usuário.
 * Se o usuário tiver permissão para ver todos os dados (ex: 'data.view_all'), retorna undefined (sem filtro de userId).
 * Caso contrário, retorna o userId do próprio usuário.
 */
export async function getUserIdFilter(
  session: UserSession | null | undefined
): Promise<string | undefined> {
  if (!session?.id) {
    // Se não há sessão ou userId, o acesso não deve ser permitido ou deve ser tratado como erro de autenticação.
    // Para este contexto, retornamos undefined, mas a camada de autenticação deve garantir que a sessão exista.
    return undefined; 
  }

  const user = await getUserWithPermissions(session.id);

  // Verifica se o usuário tem a permissão para visualizar todos os dados
  // A permissão 'data.view_all' deve ser criada e atribuída aos cargos apropriados (ex: Administrador, Gestor).
  const canViewAll = await hasPermission(user, ['data.view_all']);

  if (canViewAll) {
    return undefined; // Não aplica filtro de userId, ou seja, o usuário pode ver todos os dados.
  } else {
    return session.id; // Aplica filtro para que o usuário veja apenas os próprios dados.
  }
}
```

**Ações do Agente:**
1.  Criar o arquivo `utils/dataVisibility.ts` (ou similar) com a função `getUserIdFilter`.
2.  Garantir que a permissão `data.view_all` seja adicionada ao sistema RBAC e atribuída aos cargos que devem ter visibilidade global (ex: `Administrador`, `Gestor`).

## 2. Ajuste nas Queries do Prisma

O agente DEVE modificar as queries do Prisma nos serviços ou rotas de API que buscam `Processos` e `Agenda` para incorporar o filtro de `userId` retornado por `getUserIdFilter`.

### 2.1. Ajuste nas Queries de Processos

```typescript
// services/processoService.ts (ou na API Route correspondente)
import { PrismaClient } from '@prisma/client';
import { getUserIdFilter } from '../utils/dataVisibility'; // Caminho para a função

const prisma = new PrismaClient();

export async function getProcessos(session: UserSession) {
  const userIdFilter = await getUserIdFilter(session);

  const whereClause: Prisma.ProcessoWhereInput = {};

  if (userIdFilter) {
    whereClause.userId = userIdFilter; // Filtra pelos processos do usuário logado
  }

  const processos = await prisma.processo.findMany({
    where: whereClause,
    // ... outras configurações (include, orderBy, etc.)
  });

  return processos;
}
```

### 2.2. Ajuste nas Queries da Agenda

```typescript
// services/agendaService.ts (ou na API Route correspondente)
import { PrismaClient } from '@prisma/client';
import { getUserIdFilter } from '../utils/dataVisibility'; // Caminho para a função

const prisma = new PrismaClient();

export async function getAgendaItems(session: UserSession) {
  const userIdFilter = await getUserIdFilter(session);

  const whereClause: Prisma.AgendaItemWhereInput = {};

  if (userIdFilter) {
    whereClause.userId = userIdFilter; // Filtra pelos itens da agenda do usuário logado
  }

  const agendaItems = await prisma.agendaItem.findMany({
    where: whereClause,
    // ... outras configurações (include, orderBy, etc.)
  });

  return agendaItems;
}
```

**Ações do Agente:**
1.  Identificar todos os serviços e rotas de API que buscam listas de `Processos` e `Agenda`.
2.  Importar a função `getUserIdFilter` nesses arquivos.
3.  Modificar as queries `findMany` para incluir a `whereClause.userId` condicionalmente, conforme os exemplos acima.

## 3. Considerações Adicionais

*   **Filtros na UI para Visão Global:** Para usuários com a permissão `data.view_all`, a interface (frontend) DEVE oferecer filtros para que eles possam visualizar processos/agenda de usuários específicos. Isso pode ser implementado adicionando um parâmetro `filterByUserId` à API, que será utilizado na `whereClause` se o `userIdFilter` for `undefined` (ou seja, se o usuário tiver permissão para ver todos).
*   **Performance:** A função `getUserWithPermissions` deve ser otimizada para evitar chamadas repetidas ao banco de dados. Idealmente, as permissões do usuário já deveriam estar disponíveis no objeto de sessão (ex: via token JWT ou contexto do NextAuth) para evitar uma nova consulta ao DB a cada requisição.
*   **Testes Abrangentes:** É CRUCIAL testar exaustivamente essa lógica com usuários de diferentes cargos e permissões para garantir que a visibilidade dos dados esteja correta e segura para cada cenário.

**Este prompt detalha as modificações necessárias para implementar um controle de visibilidade de dados flexível e seguro, garantindo que o sistema atenda às necessidades de acesso de diferentes cargos.**

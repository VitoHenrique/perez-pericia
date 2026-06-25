# Master Prompt: Implementação de Sistema de Notificações e Logs de Atividades

**Objetivo:** Implementar um sistema robusto de logs de atividades (Audit Log) e um componente de notificações na navbar, que exiba as alterações feitas nas últimas 24 horas. A funcionalidade deve ser transparente, detalhada e seguir o padrão de design "Coursue" para a interface.

## 1. Definição do Esquema de Dados (Prisma)

O agente DEVE adicionar o seguinte modelo `ActivityLog` ao arquivo `prisma/schema.prisma`:

```prisma
// prisma/schema.prisma

model ActivityLog {
  id        String    @id @default(cuid())
  action    String    // Tipo de ação: 'CREATED', 'UPDATED', 'DELETED', 'MOVED', 'LOGIN', etc.
  entityType String    // Tipo da entidade afetada: 'Processo', 'Honorario', 'Usuario', 'TarefaKanban'
  entityId  String    // ID da entidade afetada
  details   Json?     // Detalhes adicionais da alteração (ex: campos alterados, valores antigos/novos)
  timestamp DateTime  @default(now())
  userId    String    // ID do usuário que realizou a ação
  user      User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType])
  @@index([timestamp])
}

// Certifique-se de que o modelo User já existe e tem um campo 'id'
// model User {
//   id            String        @id @default(cuid())
//   email         String        @unique
//   name          String?
//   password      String
//   activityLogs  ActivityLog[]
//   // ... outros campos do usuário
// }
```

**Ações do Agente:**
1.  Adicionar o modelo `ActivityLog` ao `schema.prisma`.
2.  Atualizar o modelo `User` para incluir `activityLogs ActivityLog[]`.
3.  Gerar e aplicar uma nova migração do Prisma:
    ```bash
    npx prisma migrate dev --name add_activity_log_table
    ```

## 2. Lógica de Registro de Atividades (Audit Log)

O agente DEVE implementar uma função utilitária `logActivity` e integrá-la nos serviços/rotas de API que manipulam os dados. Esta função será responsável por registrar as ações de `CREATED`, `UPDATED`, `DELETED`, `MOVED`, e outras relevantes.

#### Exemplo de Função `logActivity` (TypeScript/Node.js):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LogActivityParams {
  userId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'MOVED' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId: string;
  details?: Record<string, any>; // Objeto JSON com detalhes da alteração
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    // Implementar um sistema de log de erros robusto aqui
  }
}
```

**Ações do Agente:**
1.  Criar o arquivo `utils/logActivity.ts` (ou similar) com a função `logActivity`.
2.  Integrar `logActivity` nos pontos chave da aplicação (serviços/rotas) onde as entidades `Processo`, `Honorario`, `Usuario`, `TarefaKanban` são criadas, atualizadas, removidas ou movidas.
3.  Garantir que a `userId` seja obtida do contexto de autenticação (sessão do usuário).
4.  Para ações `UPDATED`, capturar as mudanças relevantes e armazená-las no campo `details`.
5.  Chamar `logActivity` **após o sucesso** da operação de banco de dados (e após o commit de transações, se aplicável).

## 3. Componente de Interface de Notificações (Sino)

O agente DEVE criar um componente de UI para exibir as notificações, seguindo o design "Coursue".

### 3.1. Design e Localização
*   **Localização:** Navbar superior, ao lado do avatar do usuário.
*   **Ícone:** Utilizar `Bell` ou `BellRing` da biblioteca Lucide Icons.
*   **Badge:** Um pequeno círculo (badge) com a contagem de notificações não lidas, com cor de acento (roxo vibrante).
*   **Pop-over/Dropdown:** Ao clicar no sino, um pop-over deve ser exibido.

### 3.2. Estrutura do Pop-over
*   **Título:** "Atividade Recente" ou "Notificações".
*   **Filtro de Tempo:** Exibir apenas atividades das **últimas 24 horas**.
*   **Lista de Notificações:** Cada item deve ser conciso e legível.
*   **Link "Ver Todas as Atividades" (Opcional):** Para uma página de histórico completo.

### 3.3. Detalhes de Cada Notificação
Cada item na lista deve exibir:
*   **Quem:** Nome do usuário (ex: "João Silva").
*   **O quê (Ação):** Descrição humanizada (ex: "criou o processo X", "editou o status do processo Y para Z", "moveu a tarefa W para a coluna K").
*   **Quando:** Tempo decorrido (ex: "5 minutos atrás", "2 horas atrás").
*   **Ícone da Ação:** Ícone visual representando a ação (ex: `Plus`, `Edit`, `Trash`, `ArrowRightLeft`).

**Ações do Agente:**
1.  Criar o componente `NotificationsDropdown.tsx` (ou similar).
2.  Implementar a lógica para buscar as `ActivityLog` dos últimos 24 horas (via API).
3.  Renderizar a lista de notificações, formatando cada item de forma humanizada.
4.  Integrar o componente na `Navbar` da aplicação.
5.  Estilizar o componente para aderir ao design "Coursue" (cores, tipografia, arredondamentos, sombras sutis).

## 4. API para Notificações

O agente DEVE criar um endpoint de API (ex: `/api/notifications`) que:

*   Receba a `userId` (do usuário logado).
*   Filtre as `ActivityLog` para as últimas 24 horas para aquele `userId`.
*   Inclua os dados do `User` relacionado para exibir o nome de quem fez a ação.
*   Retorne os logs ordenados por `timestamp` (mais recentes primeiro).

**Exemplo de Query Prisma para API:**

```typescript
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

const notifications = await prisma.activityLog.findMany({
  where: {
    userId: currentUserId,
    timestamp: {
      gte: twentyFourHoursAgo,
    },
  },
  include: {
    user: { select: { name: true } }, // Incluir apenas o nome do usuário
  },
  orderBy: {
    timestamp: 'desc',
  },
});
```

**Este prompt detalha todas as etapas para uma implementação completa e funcional do sistema de notificações e logs de atividades, garantindo a transparência e o controle necessários para o sistema de gestão pericial.**

# Master Prompt: Implementação de Gestão de Cargos e Permissões (RBAC)

**Objetivo:** Implementar um sistema completo de Controle de Acesso Baseado em Funções (RBAC - Role-Based Access Control) na aplicação. Isso inclui a modelagem de dados, uma interface administrativa para gerenciar cargos e permissões, e um middleware de autorização para proteger rotas e componentes. O sistema deve ser flexível, seguro e seguir o padrão de design "Coursue".

## 1. Modelagem do Esquema de Dados (Prisma)

O agente DEVE adicionar os seguintes modelos ao `prisma/schema.prisma` para representar `Role` (Cargo), `Permission` (Permissão) e a tabela de junção `RolePermission`. Além disso, o modelo `User` deve ser atualizado para incluir um relacionamento com `Role`.

### 1.1. Modelo `Role` (Cargo)

```prisma
// prisma/schema.prisma

model Role {
  id          String         @id @default(cuid())
  name        String         @unique // Nome do cargo (ex: "Administrador", "Perito", "Assistente")
  description String?        // Descrição do cargo
  users       User[]         // Relacionamento com usuários que possuem este cargo
  permissions RolePermission[] // Permissões associadas a este cargo

  @@map("roles")
}
```

### 1.2. Modelo `Permission` (Permissão)

```prisma
// prisma/schema.prisma

model Permission {
  id          String         @id @default(cuid())
  name        String         @unique // Nome da permissão (ex: "processos.view")
  description String?        // Descrição da permissão
  roles       RolePermission[] // Cargos que possuem esta permissão

  @@map("permissions")
}
```

### 1.3. Modelo `RolePermission` (Associação Cargo-Permissão)

```prisma
// prisma/schema.prisma

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}
```

### 1.4. Atualização do Modelo `User`

```prisma
// prisma/schema.prisma

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  password      String
  roleId        String        // ID do cargo do usuário
  role          Role          @relation(fields: [roleId], references: [id])
  activityLogs  ActivityLog[] // Se já implementado
  // ... outros campos do usuário

  @@map("users")
}
```

**Ações do Agente:**
1.  Adicionar/atualizar os modelos acima no `schema.prisma`.
2.  Gerar e aplicar uma nova migração do Prisma:
    ```bash
    npx prisma migrate dev --name add_rbac_models
    ```
3.  Criar um script de `seed` para popular o banco de dados com cargos e permissões iniciais (ex: `Administrador` com todas as permissões, `Perito` com permissões específicas).

## 2. Interface de Gestão de Cargos e Permissões no Painel Admin

O agente DEVE criar uma interface no Painel Admin (`/admin/roles`) para gerenciar cargos e suas permissões, seguindo o padrão de design "Coursue".

### 2.1. Navegação
*   Adicionar uma nova opção na sidebar do Painel Admin: "Cargos e Permissões".

### 2.2. Tela Principal: Listagem de Cargos
*   Exibir uma tabela com `Nome do Cargo`, `Descrição` e `Ações` (Editar, Excluir).
*   Incluir um botão "Novo Cargo" (roxo vibrante, estilo "Coursue").

### 2.3. Tela de Criação/Edição de Cargo
*   **Campos:** `Nome do Cargo` (obrigatório), `Descrição` (opcional).
*   **Seleção de Permissões:** Listar todas as permissões disponíveis, agrupadas por área (ex: "Processos", "Financeiro", "Kanban", "Administração").
*   **Checkboxes:** Para cada permissão, um checkbox para associar ao cargo.
*   **Botões:** "Salvar Cargo" e "Cancelar".

### 2.4. Atribuição de Cargos a Usuários
*   Atualizar a interface de "Gestão de Usuários" (`/admin/users`) para permitir a atribuição de um `Role` a cada usuário via dropdown/select box.

**Ações do Agente:**
1.  Criar as páginas e componentes necessários para a interface de gestão de cargos (`/admin/roles`).
2.  Utilizar componentes da Shadcn/UI (Table, Form, Checkbox, Button, Input, Select) e estilizar conforme o guia "Coursue".
3.  Implementar a lógica de CRUD (Create, Read, Update, Delete) para cargos e a associação de permissões.
4.  Atualizar a interface de gestão de usuários para permitir a seleção de cargos.

## 3. Implementação do Middleware de Autorização e Proteção

O agente DEVE implementar a lógica de autorização para proteger rotas de API, páginas e componentes da UI com base nas permissões do usuário.

### 3.1. Função de Verificação de Permissão

Criar uma função centralizada `hasPermission` para verificar se um usuário possui as permissões necessárias. Esta função deve ser reutilizável no backend e, se possível, no frontend.

```typescript
// lib/auth.ts (ou similar)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserWithRoleAndPermissions {
  id: string;
  email: string;
  role: {
    name: string;
    permissions: { permission: { name: string } }[];
  };
}

export async function hasPermission(
  user: UserWithRoleAndPermissions | null | undefined,
  requiredPermissions: string[]
): Promise<boolean> {
  if (!user || !user.role) {
    return false; // Usuário não autenticado ou sem cargo
  }

  const userPermissions = user.role.permissions.map(rp => rp.permission.name);

  for (const requiredPerm of requiredPermissions) {
    if (!userPermissions.includes(requiredPerm)) {
      return false; // Falta uma permissão necessária
    }
  }

  return true; // Possui todas as permissões necessárias
}

export async function getUserWithPermissions(userId: string): Promise<UserWithRoleAndPermissions | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { name: true } } } },
        },
      },
    },
  });
}
```

### 3.2. Proteção de Rotas de API
*   Integrar a função `hasPermission` em todas as rotas de API (`app/api/.../route.ts`) que exigem autorização, obtendo o `userId` da sessão do usuário.
*   Retornar `401 Unauthorized` ou `403 Forbidden` se o usuário não tiver permissão.

### 3.3. Proteção de Páginas
*   Utilizar `middleware.ts` para redirecionar usuários não autenticados ou sem permissão para rotas específicas (ex: `/login`, `/dashboard`).
*   Em Server Components ou Server Actions, buscar as permissões do usuário e condicionar a renderização ou execução de lógica.

### 3.4. Proteção em Componentes da Interface (Frontend)
*   No frontend, usar a função `hasPermission` (ou uma versão otimizada que leia as permissões da sessão/token JWT) para esconder ou desabilitar elementos da UI (botões, links, seções) que o usuário não tem permissão para interagir.

**Ações do Agente:**
1.  Criar o arquivo `lib/auth.ts` (ou similar) com as funções `hasPermission` e `getUserWithPermissions`.
2.  Implementar a proteção de rotas de API, páginas e componentes da UI, utilizando as funções de permissão e o contexto de autenticação.
3.  Garantir que as mensagens de erro de acesso negado sejam claras e amigáveis.
4.  Testar exaustivamente todas as combinações de cargos e permissões para garantir a segurança e a correta aplicação do RBAC.

**Este prompt detalha todas as etapas para uma implementação completa e funcional do sistema de gestão de cargos e permissões, garantindo que o sistema seja seguro, flexível e atenda às necessidades de controle de acesso do Fernando Perez.**

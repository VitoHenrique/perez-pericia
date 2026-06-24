# Guia de Estilo Mestre: Design "Coursue" para Sistema de Gestão Pericial

**Objetivo:** Este documento serve como o guia definitivo para replicar a estética visual e a experiência de usuário da imagem de referência "Coursue" na aplicação de gestão pericial. O objetivo é garantir a máxima fidelidade ao design, resultando em uma interface **moderna, limpa, profissional e altamente intuitiva**, com um toque de sofisticação que remete a plataformas educacionais e de produtividade de alto nível.

## 1. Princípios Estéticos Gerais

O design "Coursue" é caracterizado por:

*   **Clareza e Organização:** Layout bem definido com uso generoso de espaços em branco (whitespace).
*   **Modernidade:** Elementos com cantos arredondados, sombras suaves e tipografia contemporânea.
*   **Foco no Conteúdo:** A interface direciona o olhar do usuário para as informações e ações mais importantes.
*   **Leveza Visual:** Apesar de ter muitos elementos, a composição geral é leve e agradável.

## 2. Paleta de Cores

A paleta é predominantemente clara, com acentos de cor vibrantes e bem distribuídos. As cores devem ser definidas como variáveis CSS para fácil gerenciamento e adaptação a temas (se aplicável).

| Categoria | Cor Principal (Hex/RGB) | Uso | Observações |
| :-------- | :---------------------- | :-- | :---------- |
| **Fundo Principal** | `#F8F8F8` (quase branco) | Fundo geral da aplicação. | Deve ser o background padrão. |
| **Fundo Secundário** | `#FFFFFF` (branco puro) | Fundo de cards, modais, sidebar. | Elementos que se destacam do fundo principal. |
| **Acento Primário** | `#6B46C1` (roxo vibrante) | Botões primários, destaques, ícones ativos. | Cor principal de interação e identidade. |
| **Acento Secundário** | `#A78BFA` (roxo mais claro) | Destaques secundários, progresso, elementos de notificação. | Variação do roxo primário. |
| **Texto Principal** | `#1A202C` (cinza escuro) | Títulos, textos de alto contraste. | Garante legibilidade. |
| **Texto Secundário** | `#4A5568` (cinza médio) | Descrições, legendas, textos de apoio. | Contraste suficiente, mas menos proeminente. |
| **Texto Muted** | `#718096` (cinza claro) | Textos de rodapé, informações menos importantes. | Baixo contraste, mas legível. |
| **Bordas/Divisores** | `#E2E8F0` (cinza muito claro) | Linhas de separação, bordas de inputs. | Delicado e discreto. |
| **Sombras** | `rgba(0, 0, 0, 0.05)` a `rgba(0, 0, 0, 0.1)` | Sombras suaves para cards e elementos flutuantes. | Leves e difusas, sem "peso". |

## 3. Tipografia

Uma fonte sans-serif moderna e limpa é essencial para a estética.

*   **Família da Fonte:** Sugere-se `Inter`, `Poppins`, `Roboto` ou `Plus Jakarta Sans` (ou similar, que transmita modernidade e legibilidade).
*   **Pesos da Fonte:** Utilizar `Regular (400)`, `Medium (500)`, `Semi-Bold (600)` e `Bold (700)` para criar hierarquia visual.
*   **Tamanhos:**
    *   **H1 (Título Principal):** ~2.5rem (40px)
    *   **H2 (Subtítulos de Seção):** ~1.5rem (24px)
    *   **H3 (Títulos de Card):** ~1.125rem (18px)
    *   **Corpo de Texto:** ~1rem (16px)
    *   **Textos Pequenos/Legendas:** ~0.875rem (14px) ou ~0.75rem (12px)

## 4. Espaçamento e Layout

O uso consistente de espaçamento é crucial para a sensação de organização.

*   **Grid Base:** Adotar um sistema de grid de 8px (ou 4px) para todos os espaçamentos (padding, margin, gap).
*   **Whitespace:** Utilizar generosamente espaços em branco entre os elementos para evitar sobrecarga visual e melhorar a legibilidade.
*   **Layout de Colunas:** A interface é dividida em três colunas principais:
    1.  **Sidebar Esquerda:** Navegação principal e informações de "amigos" (no nosso caso, talvez equipe ou contatos).
    2.  **Conteúdo Central:** Área principal com o dashboard, processos, kanban, etc.
    3.  **Sidebar Direita:** Estatísticas, perfil do usuário, elementos de "mentor" (no nosso caso, talvez resumos ou alertas importantes).

## 5. Bordas e Sombras

*   **Border-Radius:** Consistente em todos os elementos retangulares (cards, botões, inputs). Sugere-se um `border-radius` de `8px` a `12px` para a maioria dos elementos, e talvez `4px` para elementos menores ou internos.
*   **Sombras:** Sombras suaves e sutis para dar profundidade aos cards e elementos flutuantes. Exemplo de `box-shadow`:
    *   `0px 4px 6px rgba(0, 0, 0, 0.05)`
    *   `0px 10px 15px rgba(0, 0, 0, 0.1)`
    *   Evitar sombras muito escuras ou com grande deslocamento.

## 6. Componentes de UI Específicos

### 6.1. Sidebar de Navegação (Esquerda)
*   **Largura:** Fixa, com padding interno generoso.
*   **Itens de Menu:** Ícones alinhados com texto. Estado ativo com cor de fundo (roxo claro ou branco) e texto/ícone em destaque (roxo primário).
*   **Separadores:** Linhas finas e discretas para agrupar seções (ex: OVERVIEW, FRIENDS, SETTINGS).
*   **Logo:** Posicionado no topo, limpo e claro.

### 6.2. Header (Topo da Página)
*   **Barra de Pesquisa:** Input com bordas arredondadas, ícone de lupa e placeholder discreto.
*   **Ícones de Notificação/Ações:** Ícones minimalistas (Lucide Icons) com círculos de notificação (badges) pequenos e coloridos.
*   **Avatar do Usuário:** Círculo com imagem do perfil e nome.

### 6.3. Cards e Seções de Conteúdo
*   **Design:** Fundo branco, cantos arredondados, sombra suave. Padding interno consistente.
*   **Títulos de Seção:** Tipografia clara e espaçamento adequado.
*   **Elementos Internos:** Itens de lista, botões e outros componentes devem seguir a paleta de cores e tipografia definidas.

### 6.4. Botões
*   **Botão Primário (Ex: "Join Now"):** Fundo roxo vibrante, texto branco, cantos arredondados, sombra sutil. Efeito de hover suave (ex: leve escurecimento do roxo).
*   **Botões Secundários (Ex: "Login"):** Texto em cor de acento ou texto principal, fundo transparente ou branco, borda sutil.

### 6.5. Gráficos
*   **Estilo:** Limpos, com cores da paleta. Barras e linhas com cantos arredondados (se aplicável).
*   **Legendas:** Claras e discretas.
*   **Tooltips:** Minimalistas, com informações relevantes.

## 7. Implementação Técnica (Recomendação)

Para garantir a fidelidade a este design, o agente de desenvolvimento deve:

*   **Tailwind CSS:** Utilizar o Tailwind CSS para implementar todas as classes de estilo, configurando o `tailwind.config.js` com a paleta de cores, tipografia e espaçamentos definidos.
*   **Shadcn/UI:** Customizar os componentes do Shadcn/UI para se alinharem perfeitamente a este guia de estilo, ajustando cores, border-radius e sombras.
*   **Framer Motion:** Aplicar animações sutis e elegantes para transições e micro-interações, como visto na referência.
*   **Lucide Icons:** Utilizar o conjunto de ícones Lucide para manter a consistência e o minimalismo.

Este guia deve ser a referência principal para todo o desenvolvimento visual da aplicação, garantindo que o resultado final seja o mais fiel possível à inspiração "Coursue" e atinja o padrão de excelência desejado.

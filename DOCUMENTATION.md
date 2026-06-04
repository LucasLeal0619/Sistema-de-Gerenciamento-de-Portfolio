# SGP - Sistema de Gerenciamento de Portfólio SENAC DF

## 📋 Visão Geral do Sistema

O SGP é um sistema web completo para gerenciamento do portfólio de cursos do SENAC DF. O sistema permite visualizar, filtrar, gerenciar e analisar dados de mais de 500 cursos distribuídos em 7 áreas de conhecimento distintas.

**Versão:** 2025-04-01-v2  
**Tecnologias:** React 18, TypeScript, React Router, Tailwind CSS v4, Recharts, Lucide Icons  
**Estrutura:** Single Page Application (SPA) com autenticação e múltiplas páginas

---

## 🎨 Design System

### Cores Institucionais SENAC
- **Azul Principal:** `#003F7D` (azul SENAC - headers, sidebar, elementos primários)
- **Azul Escuro:** `#00355C` e `#00284D` (variações para gradientes)
- **Laranja SENAC:** `#F57C00` (botões de ação, destaques, elementos ativos)
- **Laranja Hover:** `#E86D00` / `#E67300` (estado hover dos botões laranja)

### Cores Secundárias por Área
- **Gastronomia:** Laranja (`#F57C00`)
- **Ambiente e Saúde:** Verde (`#4CAF50`, `green-600`)
- **Gestão e Moda:** Roxo (`#9C27B0`, `purple-600`)
- **Tecnologia:** Azul (`#2196F3`, `blue-600`)
- **Beleza:** Rosa (`#E91E63`, `pink-600`)
- **60+:** Âmbar (`#FF9800`, `amber-600`)
- **Ensino Médio:** Ciano (`#00BCD4`, `cyan-600`)

### Tipografia
- **Títulos H1:** `text-2xl lg:text-3xl font-bold` (responsivo)
- **Subtítulos:** `text-sm lg:text-base text-gray-600`
- **Cards/Badges:** Uso extensivo de badges coloridos para status, modalidades, tipos

### Layout e Espaçamento
- **Mobile:** `pt-20 px-4 pb-6` (espaço extra no topo para botão hambúrguer)
- **Desktop:** `p-6` ou `p-8`
- **Sidebar:** 
  - Expandida: `w-64` (256px)
  - Colapsada: `w-20` (80px)
  - Mobile: Fixed overlay com backdrop blur

---

## 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── components/
│   │   ├── Sidebar.tsx              # Menu lateral de navegação
│   │   ├── SenacLogo.tsx            # Logo SENAC (white/blue variants)
│   │   ├── ui/
│   │   │   ├── button.tsx           # Componente de botão
│   │   │   ├── badge.tsx            # Componente de badge
│   │   │   └── input.tsx            # Componente de input
│   │   └── figma/
│   │       └── ImageWithFallback.tsx # Componente para imagens com fallback
│   │
│   ├── data/
│   │   ├── gastronomiaData.ts       # 58 cursos de Gastronomia
│   │   ├── saudeSegurancaData.ts    # 72 cursos de Ambiente e Saúde
│   │   ├── gestaoModaData.ts        # 148 cursos de Gestão e Moda
│   │   ├── tecnologiaEconomiaData.ts # 112 cursos de Tecnologia
│   │   ├── belezaCuidadoData.ts     # 89 cursos de Beleza
│   │   ├── sessentaMaisData.ts      # Cursos do programa 60+
│   │   ├── ensinoMedioData.ts       # Cursos técnicos de nível médio
│   │   ├── cursosEixoData.ts        # 25 eixos tecnológicos completos
│   │   └── planoMetasData.ts        # Dados do Plano de Metas 2025
│   │
│   ├── pages/
│   │   ├── Login.tsx                # Tela de login
│   │   ├── Register.tsx             # Tela de cadastro
│   │   ├── ForgotPassword.tsx       # Recuperação de senha
│   │   ├── ResetPassword.tsx        # Reset de senha
│   │   ├── DashboardLayout.tsx      # Layout principal com sidebar
│   │   ├── Dashboard.tsx            # Dashboard principal ⭐
│   │   ├── CourseArea.tsx           # Página de área de curso ⭐
│   │   ├── CoursesRedirect.tsx      # Redirect /cursos → /cursos/gastronomia
│   │   ├── NewCourse.tsx            # Formulário novo curso ⭐
│   │   ├── Users.tsx                # Gerenciamento de usuários ⭐
│   │   ├── PlanoMetas.tsx           # Plano de Metas 2025
│   │   ├── ProcessosVisitasTecnicas.tsx
│   │   ├── ProcessosHorasPedagogicas.tsx
│   │   ├── ValoresPCA2025.tsx
│   │   └── QuantidadeCursosPorEixo.tsx ⭐
│   │
│   ├── routes.tsx                   # Configuração de rotas
│   └── App.tsx                      # Componente raiz
│
├── styles/
│   ├── theme.css                    # Tokens CSS customizados
│   └── fonts.css                    # Importação de fontes
│
└── imports/                         # Assets importados do Figma
    ├── image-*.png
    └── svg-*
```

---

## 🔐 Autenticação e Rotas

### Sistema de Rotas (React Router)

**Rotas Públicas:**
- `/` - Login
- `/register` - Cadastro
- `/forgot-password` - Esqueci a senha
- `/reset-password` - Reset de senha

**Rotas Privadas (dentro de `/app`):**
- `/app` - Dashboard principal
- `/app/cursos` - Redirect para gastronomia
- `/app/cursos/:area` - Página de área específica
  - `gastronomia`
  - `ambiente-saude`
  - `gestao-moda`
  - `tecnologia-economia-criativa`
  - `beleza-cuidado-pessoal`
  - `60-mais`
  - `ensino-medio`
- `/app/novo-curso` - Formulário de novo curso
- `/app/usuarios` - Gerenciamento de usuários
- `/app/plano-metas` - Plano de Metas 2025
- `/app/processos-visitas-tecnicas` - Processos de Visitas Técnicas
- `/app/processos-horas-pedagogicas` - Processos Horas Pedagógicas
- `/app/valores-pca-2025` - Valores PCA 2025 - Retificado
- `/app/quantidade-cursos-por-eixo` - Quantidade de Cursos por Eixo

### Mapeamento de Áreas
```typescript
const areaMap = {
  "gastronomia": "Gastronomia",
  "ambiente-saude": "Ambiente e Saúde",
  "gestao-moda": "Gestão e Moda",
  "tecnologia-economia-criativa": "Tecnologia e Economia Criativa",
  "beleza-cuidado-pessoal": "Beleza e Cuidado Pessoal",
  "60-mais": "60+",
  "ensino-medio": "Ensino Médio"
};
```

---

## 📊 Estrutura de Dados

### Estrutura de Curso (Normalizada)
Todos os cursos são normalizados para esta estrutura no `CourseArea.tsx`:

```typescript
interface Course {
  status: string;          // "ATIVO" | "INATIVO"
  modalidade: string;      // "FIC" | "HABILITAÇÃO" | "AÇÃO EXTENSIVA" | etc
  titulo: string;          // Nome completo do curso
  ch: string;              // Carga horária (ex: "160", "800h")
  codDN: string;           // Código DN
  codSIG: string;          // Código SIG
  ident: string;           // Identificação/Ano
  tipo: string;            // QUALIFICAÇÃO | APERFEIÇOAMENTO | HABILITAÇÃO
  ultimaRevisao: string;   // Ano da última revisão
  processoSEI: string;     // Número do processo SEI
  valores: string;         // "2025 | R$ 1.200,00"
  observacoes: string;     // Observações gerais
  unidade: string;         // Unidade de oferta
  compativelBolsa: string; // "SIM" | "NÃO" | "-"
  comercial: string;       // "SIM" | "NÃO" | "-"
  pcn: string;             // PCN
  pcr: string;             // PCR
}
```

### Estrutura de Eixo Tecnológico
```typescript
interface Eixo {
  nome: string;            // Nome do eixo
  qtdCursos: number;       // Quantidade de cursos
  cursos: Curso[];         // Array de cursos
}

interface Curso {
  curso: string;           // Nome do curso
  ch: string;              // Carga horária
  turmas: string;          // Número de turmas
  processo: string;        // Processo SEI
  alunos: string;          // Número de alunos
  instrutor: string;       // Nome do instrutor
}
```

### Estrutura de Usuário
```typescript
interface User {
  name: string;            // Nome completo
  email: string;           // Email institucional
  role: string;            // "Administrador" | "Editor" | "Consultivo"
  roleType: string;        // "admin" | "editor" | "consultivo"
  avatar: string;          // Iniciais (ex: "AP")
  lastAccess: string;      // "Agora" | "Há 2 horas" | "Ontem"
  status: string;          // "online" | "offline"
  unidade: string;         // Unidade de lotação
  area: string;            // Área de atuação
  dataIngresso: string;    // Data de ingresso
  telefone: string;        // Telefone
}
```

---

## 📄 Páginas Detalhadas

### 1. Dashboard (Dashboard.tsx)
**Rota:** `/app`

**Funcionalidade:**
- Visão geral consolidada de todo o portfólio
- Estatísticas principais em cards coloridos
- Gráficos de distribuição (Recharts)
- Cards clicáveis para navegação rápida

**Componentes Visuais:**
1. **Cards de Estatísticas (4 cards):**
   - Total de Cursos (azul)
   - Áreas de Conhecimento - 7 (laranja)
   - Cursos Ativos (verde)
   - Modalidades (roxo)

2. **Cards de Navegação (7 cards):**
   - Gastronomia (laranja)
   - Ambiente e Saúde (verde)
   - Gestão e Moda (roxo)
   - Tecnologia (azul)
   - Beleza (rosa)
   - 60+ (âmbar)
   - Ensino Médio (ciano)

3. **Gráficos:**
   - Distribuição de Cursos por Área (BarChart)
   - Top 5 Tipos de Curso (BarChart horizontal)
   - Status dos Cursos (PieChart)
   - Modalidades (Lista simplificada)
   - Carga Horária (BarChart por faixas)

**Dados Consolidados:**
```typescript
const allCourses = [
  ...gastronomiaCourses,
  ...saudeSegurancaCourses,
  ...gestaoModaCourses,
  ...tecnologiaEconomiaCourses,
  ...belezaCuidadoCourses,
  ...sessentaMaisCourses,
  ...ensinoMedioCourses,
];
```

---

### 2. CourseArea (Página de Área)
**Rota:** `/app/cursos/:area`

**Funcionalidade:**
- Exibição de todos os cursos de uma área específica
- Tabela completa com 17 colunas de dados
- Sistema de busca em tempo real
- Cards de resumo por modalidade
- Exportação para Excel (placeholder)

**Features:**
- **Normalização de Dados:** Função `normalizeCourse()` garante estrutura uniforme
- **Memoização:** `useMemo` para otimizar performance
- **Key Única:** `key={area}` força remontagem ao trocar de área
- **Busca:** Filtra por título, código SIG, modalidade

**Colunas da Tabela:**
1. Status (Badge verde/vermelho)
2. Modalidade (Badge colorido)
3. Título (texto)
4. CH - Carga Horária (Badge laranja)
5. Cód. DN
6. Cód. SIG
7. Ident.
8. Tipo
9. Revisão
10. Processo SEI
11. Valores
12. Observações
13. Unidade
14. Bolsa (Badge)
15. Comercial (Badge)
16. PCN
17. PCR

**Cards de Resumo (4 cards):**
- Total de Cursos (azul)
- Modalidade 1 (laranja)
- Modalidade 2 (verde)
- Modalidade 3 (roxo)

---

### 3. NewCourse (Novo Curso)
**Rota:** `/app/novo-curso`

**Funcionalidade:**
- Formulário completo para cadastro de novos cursos
- Interface com 3 abas (tabs)
- 26 segmentos disponíveis
- 9 unidades de oferta
- Validação de campos

**Estrutura de Abas:**

**Aba 1 - Dados Básicos:**
- Segmento (select com 26 opções)
- Título do Curso
- Carga Horária
- Número de Turmas
- Código do Curso
- Número de Alunos
- Instrutor Responsável
- Status (Ativo/Inativo)
- Modalidade

**Aba 2 - Informações Técnicas:**
- Código DN
- Código SIG
- Identificação
- Tipo de Curso
- Última Revisão
- Número do Processo SEI
- Valores
- Observações

**Aba 3 - Dados Comerciais:**
- Compatível com Bolsa
- Comercial
- PCN
- PCR
- Descrição Detalhada
- Data de Início
- Data de Término

**26 Segmentos Disponíveis:**
1. Gastronomia
2. Bebidas
3. Panificação
4. Confeitaria
5. Turismo
6. Hospitalidade
7. Design, Paisagismo e Ambientação
8. Comunicação e Audiovisual
9. Tecnologia da Informação - Suporte
10. Tecnologia da Informação - Games
11. Tecnologia da Informação - Inovação
12. Tecnologia da Informação - Desenvolvimento
13. Gestão e Comércio
14. Educação
15. Vendas e Marketing
16. Moda e Costura
17. Beleza e Cuidado Pessoal
18. Estética e Massoterapia
19. Enfermagem
20. Radiologia
21. Saúde Bucal
22. Nutrição
23. Análises Clínicas
24. Farmácia
25. Segurança e NRs
26. Administrativo / Serviços em Saúde

**9 Unidades de Oferta:**
1. Jessé Freire
2. Taguatinga
3. Ceilândia
4. Plano Piloto
5. Gama
6. Sobradinho
7. Santa Maria
8. São Sebastião
9. Brazlândia

---

### 4. Users (Gerenciamento de Usuários)
**Rota:** `/app/usuarios`

**Funcionalidade:**
- Gerenciamento completo de usuários do sistema
- Tabela com 8 usuários de exemplo
- Sistema de filtros (função e unidade)
- Busca em tempo real
- Ações inline (editar, excluir, mais opções)

**Cards de Estatísticas (4 cards):**
1. Total de Usuários (azul)
2. Administradores (laranja)
3. Usuários Online (verde)
4. Editores (roxo)

**Filtros:**
- Busca por nome, email ou área
- Filtro por função (Administrador, Editor, Consultivo)
- Filtro por unidade (9 unidades)

**Colunas da Tabela:**
1. Usuário (avatar + nome + email)
2. Função (Badge colorido)
3. Unidade (com ícone de pin)
4. Área de Atuação
5. Contato (telefone)
6. Status (Online/Offline Badge)
7. Último Acesso
8. Ações (3 botões: editar, excluir, mais)

**Funções de Usuário:**
- **Administrador** (Badge azul) - Acesso total
- **Editor** (Badge verde) - Pode editar cursos
- **Consultivo** (Badge roxo) - Apenas visualização

**8 Usuários de Exemplo:**
1. Ana Paula Souza - Administrador - Jessé Freire - Gestão e Negócios
2. Carlos Eduardo Lima - Consultivo - Taguatinga - TI
3. Mariana Ferreira - Consultivo - Ceilândia - Gastronomia
4. Roberto Alves - Editor - Plano Piloto - Ambiente e Saúde
5. Juliana Costa - Administrador - Jessé Freire - Administração
6. Fernando Santos - Editor - Gama - Moda e Beleza
7. Patrícia Oliveira - Consultivo - Santa Maria - TI
8. Ricardo Mendes - Editor - Sobradinho - Gastronomia

---

### 5. QuantidadeCursosPorEixo
**Rota:** `/app/quantidade-cursos-por-eixo`

**Funcionalidade:**
- Exibição detalhada dos 25 eixos tecnológicos
- Tabelas individuais por eixo
- Informações de turmas, processos, instrutores
- Cards de resumo geral

**Cards de Resumo (3 cards):**
1. Total de Cursos (azul)
2. Eixos Tecnológicos - 25 (laranja)
3. Total de Turmas (verde)

**Estrutura por Eixo:**
- Header colorido com nome e quantidade
- Tabela com 6 colunas:
  1. Curso
  2. CH (Carga Horária)
  3. Turmas
  4. Processo SEI
  5. Alunos
  6. Instrutor

**25 Eixos Tecnológicos:**
1. Gastronomia (37 cursos)
2. Bebidas (13 cursos)
3. Panificação (5 cursos)
4. Confeitaria (11 cursos)
5. Turismo (7 cursos)
6. Hospitalidade (9 cursos)
7. Design, Paisagismo e Ambientação (7 cursos)
8. Comunicação e Audiovisual (15 cursos)
9. TI - Suporte (18 cursos)
10. TI - Games (11 cursos)
11. TI - Inovação (16 cursos)
12. TI - Desenvolvimento (22 cursos)
13. Gestão e Comércio (45 cursos)
14. Educação (3 cursos)
15. Vendas e Marketing (18 cursos)
16. Moda e Costura (26 cursos)
17. Beleza e Cuidado Pessoal (45 cursos)
18. Estética e Massoterapia (6 cursos)
19. Enfermagem (20 cursos)
20. Radiologia (1 curso)
21. Saúde Bucal (1 curso)
22. Nutrição (6 cursos)
23. Análises Clínicas (2 cursos)
24. Farmácia (8 cursos)
25. Segurança e NRs (12 cursos)
26. Administrativo / Serviços em Saúde (6 cursos)

---

## 🧩 Componentes Principais

### Sidebar.tsx
**Funcionalidade:**
- Menu lateral de navegação
- Expansível/colapsável no desktop
- Overlay mobile com backdrop
- Menu hierárquico com expansão

**Estados:**
- `isCollapsed` - Sidebar colapsada (desktop)
- `isMobileOpen` - Sidebar aberta (mobile)
- `cursosExpanded` - Submenu de cursos expandido

**Estrutura do Menu:**
1. **Logo SENAC** (topo)
2. **Dashboard** (item principal)
3. **Cursos** (expansível)
   - 7 subáreas
   - Separador
   - Plano de Metas 2025
   - Processos de Visitas Técnicas
   - Processos Horas Pedagógicas
   - Valores PCA 2025
   - Quantidade de Cursos por Eixo
4. **Novo Curso**
5. **Usuários**
6. **Footer:**
   - Info do usuário
   - Botão Sair

**Mobile:**
- Botão hambúrguer (top-left)
- Sidebar overlay fixed
- Backdrop com blur
- Auto-close ao clicar item

**Desktop:**
- Botão collapse (seta, bottom-right da sidebar)
- Transição suave de largura
- Ícones sempre visíveis

---

### SenacLogo.tsx
**Props:**
- `variant: "white" | "blue"`

**Uso:**
- Sidebar: variante branca
- Login/páginas públicas: variante azul

---

### UI Components (Shadcn-style)

**Button:**
- Variantes: default, outline, ghost
- Tamanhos customizados
- Ícones integrados

**Badge:**
- Cores customizadas via className
- Usado para status, modalidades, tipos

**Input:**
- Estilo consistente
- Integração com ícones (Search)

---

## 🔧 Funcionalidades Técnicas

### Normalização de Dados (CourseArea)
```typescript
const normalizeCourse = (course: any) => {
  return {
    status: course.status || "ATIVO",
    modalidade: course.modalidade || "FIC",
    titulo: course.titulo || "",
    ch: course.ch || "",
    codDN: course.codDN || "-",
    codSIG: course.codSIG || "-",
    ident: course.ident || "-",
    tipo: course.tipo || "",
    ultimaRevisao: course.ultimaRevisao || "-",
    processoSEI: course.processoSEI || "-",
    valores: course.valores || "-",
    observacoes: course.observacoes || "-",
    unidade: course.unidade || "-",
    compativelBolsa: course.compativelBolsa || "-",
    comercial: course.comercial || "-",
    pcn: course.pcn || "-",
    pcr: course.pcr || "-"
  };
};
```

**Por que normalizar?**
- Arquivos de dados têm estruturas diferentes
- `sessentaMaisData` e `ensinoMedioData` têm interfaces próprias
- Outros arquivos têm todos os campos
- Normalização garante estrutura uniforme na tabela

### Otimizações de Performance
```typescript
// Memoização de dados
const coursesData = useMemo(() => {
  // ... lógica de seleção de dados
  return rawData.map(normalizeCourse);
}, [area]);

// Memoização de filtros
const filteredCourses = useMemo(() => {
  return coursesData.filter(/* ... */);
}, [coursesData, searchTerm]);

// Memoização de estatísticas
const modalidadeStats = useMemo(() => {
  // ... cálculo de stats
}, [coursesData]);
```

### Limpeza de Estado
```typescript
// Limpar busca ao trocar de área
useEffect(() => {
  setSearchTerm("");
}, [area]);
```

### Key Única para Remontagem
```typescript
// Forçar remontagem completa ao mudar área
<div key={area} className="...">
```

---

## 📱 Responsividade

### Breakpoints Tailwind
- **Mobile:** `< 1024px` (lg)
- **Desktop:** `>= 1024px`

### Padrões de Responsividade

**Espaçamento:**
```typescript
// Mobile: extra padding-top para botão hambúrguer
className="pt-20 px-4 pb-6 lg:pt-6 lg:px-8"
```

**Tipografia:**
```typescript
className="text-2xl lg:text-3xl font-bold"
className="text-sm lg:text-base"
```

**Layout:**
```typescript
// Stack vertical no mobile, horizontal no desktop
className="flex flex-col lg:flex-row gap-4"
```

**Grid:**
```typescript
// 1 coluna mobile, 4 desktop
className="grid grid-cols-1 lg:grid-cols-4 gap-6"
```

**Sidebar:**
- Mobile: Fixed overlay, full width
- Desktop: Sticky, 256px ou 80px

---

## 🎯 Funcionalidades Especiais

### Sistema de Busca em Tempo Real
- Input controlado com useState
- Filtro por múltiplos campos
- Contador de resultados
- Performance otimizada com useMemo

### Sistema de Badges Coloridos
**Status:**
- ATIVO: Verde (`bg-green-100 text-green-800`)
- INATIVO: Vermelho (`bg-red-100 text-red-800`)

**Modalidades:**
- FIC: Azul
- HABILITAÇÃO: Roxo
- AÇÃO EXTENSIVA: Rosa
- Outros: Verde

**Funções de Usuário:**
- Administrador: Azul
- Editor: Verde
- Consultivo: Roxo

### Gráficos (Recharts)
- BarChart (vertical e horizontal)
- PieChart com legend
- Cores customizadas por área
- Tooltips formatados
- Responsivos

---

## 🚀 Estado Atual do Projeto

### ✅ Funcionalidades Implementadas
1. ✅ Sistema de autenticação (UI completo)
2. ✅ Dashboard com estatísticas consolidadas
3. ✅ 7 páginas de áreas de cursos
4. ✅ Formulário de novo curso (3 abas)
5. ✅ Gerenciamento de usuários
6. ✅ Página de eixos tecnológicos
7. ✅ Sidebar responsiva com menu hierárquico
8. ✅ Sistema de busca e filtros
9. ✅ Normalização de dados entre diferentes estruturas
10. ✅ Responsividade mobile/desktop
11. ✅ Design system SENAC completo
12. ✅ Otimizações de performance (useMemo)

### ⚠️ Funcionalidades Placeholder
- Exportação para Excel (botões presentes, sem implementação)
- Salvamento de formulários (alerts)
- Backend/API (dados estáticos)
- Autenticação real (apenas UI)
- Edição/exclusão de usuários (alerts)

### 🐛 Bugs Conhecidos Corrigidos
1. ✅ **CORRIGIDO:** Links do Dashboard não correspondiam aos slugs do CourseArea
   - Antes: `/app/cursos/tecnologia` e `/app/cursos/beleza`
   - Agora: `/app/cursos/tecnologia-economia-criativa` e `/app/cursos/beleza-cuidado-pessoal`

2. ✅ **CORRIGIDO:** Dados misturando entre áreas
   - Causa: Estruturas de dados diferentes sem normalização
   - Solução: Função `normalizeCourse()` + `useMemo` + `key={area}`

3. ✅ **CORRIGIDO:** Botão hambúrguer sobrepondo título
   - Causa: Padding insuficiente no topo (mobile)
   - Solução: `pt-20` no mobile para todas as páginas

4. ✅ **CORRIGIDO:** Botão X sobrepondo logo SENAC
   - Causa: Sidebar header sem espaço para botão mobile
   - Solução: `pt-20` no header da sidebar (mobile)

---

## 📦 Dados do Sistema

### Total de Cursos por Arquivo
- **Gastronomia:** 58 cursos
- **Ambiente e Saúde:** 72 cursos
- **Gestão e Moda:** 148 cursos
- **Tecnologia:** 112 cursos
- **Beleza:** 89 cursos
- **60+:** ~30 cursos
- **Ensino Médio:** ~20 cursos
- **TOTAL:** ~529 cursos

### Eixos Tecnológicos
- **25 eixos** com cursos detalhados
- Informações de turmas, instrutores, processos
- Dados atualizados 2025

### Unidades SENAC DF
1. Jessé Freire (principal)
2. Taguatinga
3. Ceilândia
4. Plano Piloto
5. Gama
6. Sobradinho
7. Santa Maria
8. São Sebastião
9. Brazlândia

---

## 🔄 Fluxo de Navegação

```
Login (/)
  ↓
Dashboard (/app)
  ├─→ Cursos por Área (/app/cursos/:area)
  │    ├─ Gastronomia
  │    ├─ Ambiente e Saúde
  │    ├─ Gestão e Moda
  │    ├─ Tecnologia
  │    ├─ Beleza
  │    ├─ 60+
  │    └─ Ensino Médio
  │
  ├─→ Novo Curso (/app/novo-curso)
  ├─→ Usuários (/app/usuarios)
  ├─→ Plano de Metas (/app/plano-metas)
  ├─→ Processos (/app/processos-*)
  └─→ Quantidade por Eixo (/app/quantidade-cursos-por-eixo)
```

---

## 🎨 Patterns e Convenções

### Nomenclatura de Arquivos
- Componentes: PascalCase (ex: `Sidebar.tsx`)
- Data files: camelCase + Data.ts (ex: `gastronomiaData.ts`)
- Páginas: PascalCase (ex: `Dashboard.tsx`)

### Estrutura de Componentes
```typescript
export function ComponentName() {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. Effects
  useEffect(() => {}, []);
  
  // 3. Memoized values
  const value = useMemo(() => {}, []);
  
  // 4. Functions
  const handleClick = () => {};
  
  // 5. JSX
  return (
    <div>...</div>
  );
}
```

### Classes Tailwind
- Mobile-first: classe base + `lg:` para desktop
- Cores: usar variáveis CSS ou cores diretas do Tailwind
- Espaçamento: múltiplos de 4 (p-4, p-6, p-8)
- Shadows: `shadow-sm`, `shadow-lg`
- Borders: `border`, `border-gray-200`

---

## 💡 Próximos Passos Sugeridos

### Backend Integration
1. Conectar com API REST ou GraphQL
2. Implementar autenticação JWT
3. CRUD completo de cursos
4. CRUD de usuários
5. Upload de arquivos
6. Exportação real para Excel

### Funcionalidades Adicionais
1. Sistema de notificações
2. Histórico de alterações
3. Dashboard com filtros por período
4. Relatórios customizados
5. Importação de dados (CSV, Excel)
6. Sistema de permissões granulares
7. Auditoria de ações

### Melhorias UX/UI
1. Loading states
2. Error boundaries
3. Toast notifications
4. Confirmações de ação
5. Skeleton loaders
6. Animações de transição
7. Dark mode

### Performance
1. Lazy loading de páginas
2. Virtual scrolling para tabelas grandes
3. Cache de dados com React Query
4. Service Worker para offline
5. Otimização de imagens

---

## 📝 Notas Importantes

### Diferença entre Dashboard e Eixos
- **Dashboard:** Consolida cursos por 7 ÁREAS DE CONHECIMENTO (visão macro)
- **Eixos:** Organiza cursos por 25 EIXOS TECNOLÓGICOS (visão granular)
- São duas formas diferentes de classificar o mesmo portfólio
- Exemplo: "Gastronomia" no dashboard se divide em Gastronomia, Bebidas, Panificação, Confeitaria nos eixos

### Estruturas de Dados Diferentes
- Arquivos principais (gastro, saude, gestao, tech, beleza) têm interface completa
- Arquivos 60+ e Ensino Médio têm interfaces próprias reduzidas
- Normalização é ESSENCIAL para evitar bugs de renderização

### Cache Busting
Arquivos têm comentários de versionamento:
```typescript
// Version: 2025-04-01-v2
// Cache-Buster: Updated module imports
```

---

## 🏗️ Arquitetura de Componentes

```
App
├── Router
│   ├── Public Routes
│   │   ├── Login
│   │   ├── Register
│   │   ├── ForgotPassword
│   │   └── ResetPassword
│   │
│   └── Private Routes (DashboardLayout)
│       ├── Sidebar (sempre visível)
│       └── Content Area
│           ├── Dashboard
│           ├── CourseArea
│           ├── NewCourse
│           ├── Users
│           └── Other Pages
```

---

## 🎓 Guia para Desenvolvedores

### Como Adicionar Nova Área de Curso
1. Criar arquivo de dados em `src/app/data/novaAreaData.ts`
2. Importar em `CourseArea.tsx`
3. Adicionar no `useMemo` de `coursesData`
4. Adicionar no `areaMap`
5. Adicionar rota em `routes.tsx` (opcional)
6. Adicionar no array `areasCursos` da `Sidebar.tsx`
7. Adicionar card no `Dashboard.tsx`

### Como Adicionar Novo Campo em Curso
1. Atualizar interface em cada arquivo de dados
2. Atualizar função `normalizeCourse()` em `CourseArea.tsx`
3. Adicionar coluna na tabela de `CourseArea.tsx`
4. Atualizar formulário em `NewCourse.tsx`

### Como Modificar Cores
1. Cores principais: editar constantes no início do arquivo
2. Cores de área: modificar no Dashboard (array `areasDestaque`)
3. Cores de badge: modificar className inline nos componentes

---

Este documento serve como referência completa para entender, manter e expandir o SGP - Sistema de Gerenciamento de Portfólio SENAC DF.

**Última Atualização:** 2026-05-11  
**Versão do Sistema:** 2025-04-01-v2  
**Desenvolvido com:** React 18 + TypeScript + Tailwind CSS v4

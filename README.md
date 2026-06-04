# SGP - Sistema de Gerenciamento de Portfólio SENAC DF

Sistema web completo para gerenciamento do portfólio de cursos do SENAC DF, desenvolvido com React, TypeScript e Tailwind CSS.

## 🚀 Quick Start

```bash
# Instalar dependências
pnpm install

# Rodar desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 📋 Sobre o Sistema

O SGP gerencia **529+ cursos** distribuídos em:
- **7 Áreas de Conhecimento** (visão macro)
- **25 Eixos Tecnológicos** (visão granular)
- **9 Unidades SENAC DF**

## 🎨 Stack Tecnológica

- **React 18** com TypeScript
- **React Router** para navegação
- **Tailwind CSS v4** para estilização
- **Recharts** para gráficos
- **Lucide React** para ícones
- **Vite** como bundler

## 📁 Estrutura Principal

```
src/app/
├── components/       # Componentes reutilizáveis
│   ├── Sidebar.tsx
│   ├── SenacLogo.tsx
│   └── ui/          # Componentes UI (button, badge, input)
├── data/            # Dados estáticos dos cursos
│   ├── gastronomiaData.ts (58 cursos)
│   ├── saudeSegurancaData.ts (72 cursos)
│   ├── gestaoModaData.ts (148 cursos)
│   ├── tecnologiaEconomiaData.ts (112 cursos)
│   ├── belezaCuidadoData.ts (89 cursos)
│   ├── sessentaMaisData.ts
│   ├── ensinoMedioData.ts
│   └── cursosEixoData.ts (25 eixos)
└── pages/           # Páginas da aplicação
    ├── Dashboard.tsx
    ├── CourseArea.tsx
    ├── NewCourse.tsx
    ├── Users.tsx
    └── QuantidadeCursosPorEixo.tsx
```

## 🎯 Funcionalidades Principais

### ✅ Dashboard
- Estatísticas consolidadas de todo o portfólio
- Gráficos interativos (BarChart, PieChart)
- Cards de navegação rápida para as 7 áreas
- Distribuição por modalidade, status e carga horária

### ✅ Áreas de Cursos
- Visualização detalhada por área de conhecimento
- Tabela completa com 17 colunas de dados
- Sistema de busca em tempo real
- Filtros dinâmicos

### ✅ Novo Curso
- Formulário com 3 abas
- 26 segmentos disponíveis
- 9 unidades de oferta
- Campos completos (básico, técnico, comercial)

### ✅ Gerenciamento de Usuários
- Tabela de usuários do sistema
- Filtros por função e unidade
- Status online/offline
- Ações inline (editar, excluir)

### ✅ Quantidade por Eixo
- 25 eixos tecnológicos detalhados
- Informações de turmas, processos, instrutores
- Tabelas individuais por eixo

## 🎨 Design System

### Cores SENAC
- **Azul:** `#003F7D` (principal)
- **Laranja:** `#F57C00` (ações)

### Cores por Área
- Gastronomia: Laranja
- Ambiente e Saúde: Verde
- Gestão e Moda: Roxo
- Tecnologia: Azul
- Beleza: Rosa
- 60+: Âmbar
- Ensino Médio: Ciano

## 🗺️ Rotas

**Públicas:**
- `/` - Login
- `/register` - Cadastro
- `/forgot-password` - Recuperar senha
- `/reset-password` - Resetar senha

**Privadas (dentro de `/app`):**
- `/app` - Dashboard
- `/app/cursos/:area` - Área específica
  - `gastronomia`
  - `ambiente-saude`
  - `gestao-moda`
  - `tecnologia-economia-criativa`
  - `beleza-cuidado-pessoal`
  - `60-mais`
  - `ensino-medio`
- `/app/novo-curso` - Novo curso
- `/app/usuarios` - Usuários
- `/app/quantidade-cursos-por-eixo` - Eixos tecnológicos

## 📱 Responsividade

- **Mobile:** Sidebar overlay, padding especial para botão hambúrguer
- **Desktop:** Sidebar fixa expansível/colapsável
- **Breakpoint:** 1024px (lg)

## 🔧 Features Técnicas

### Normalização de Dados
```typescript
// Garante estrutura uniforme entre diferentes fontes
const normalizeCourse = (course: any) => { /* ... */ }
```

### Otimização de Performance
```typescript
// Memoização de dados e cálculos
const coursesData = useMemo(() => { /* ... */ }, [area]);
const filteredCourses = useMemo(() => { /* ... */ }, [coursesData, searchTerm]);
```

### Remontagem Forçada
```typescript
// Evita cache de estado ao trocar área
<div key={area}>
```

## 📊 Estatísticas do Projeto

- **529+ cursos** catalogados
- **7 áreas** de conhecimento
- **25 eixos** tecnológicos
- **9 unidades** SENAC DF
- **8 páginas** principais
- **3 níveis** de permissão de usuário

## 🐛 Bugs Corrigidos

✅ Links do Dashboard corrigidos para corresponder aos slugs  
✅ Normalização de dados implementada  
✅ Espaçamento mobile ajustado  
✅ Key única para evitar cache entre áreas

## 📚 Documentação Completa

Ver [DOCUMENTATION.md](./DOCUMENTATION.md) para documentação técnica detalhada incluindo:
- Estrutura de dados completa
- Guia de componentes
- Padrões de código
- Como adicionar novas features

## 🚀 Próximos Passos

- [ ] Integração com backend/API
- [ ] Autenticação JWT
- [ ] Exportação real para Excel
- [ ] Sistema de notificações
- [ ] Upload de arquivos
- [ ] Relatórios customizados

## 👥 Unidades SENAC DF

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

**Versão:** 2025-04-01-v2  
**Desenvolvido para:** SENAC DF  
**Stack:** React 18 + TypeScript + Tailwind CSS v4

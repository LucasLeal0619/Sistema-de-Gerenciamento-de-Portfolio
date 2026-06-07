# SGP — Documentação Técnica

**Sistema de Gerenciamento de Portfólio · SENAC DF · CPED**  
**Versão:** 1.0.0-beta  
**Última atualização:** 2026-06-06

---

## 1. Visão geral

O SGP é uma SPA (Single Page Application) para gestão do portfólio educacional do SENAC DF. Nesta versão beta:

- Os dados vivem no **`localStorage`** do navegador (sem backend).
- A **planilha principal** é a fonte de verdade para a maioria dos módulos.
- O **Dashboard** e a página **Cursos** leem os mesmos dados importados (`dashboardData.ts` + `store.ts`).
- Há **autenticação local**, **perfis de acesso** e **auditoria** básica de ações.

### Credenciais padrão (primeiro acesso)

| Campo | Valor |
|-------|-------|
| E-mail | `administrador@df.senac.br` |
| Senha | `senac2025` |

---

## 2. Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| UI | React 18, TypeScript |
| Build | Vite 6 |
| Roteamento | React Router 7 |
| Estilo | Tailwind CSS v4 |
| Gráficos | Recharts |
| Planilhas | xlsx |
| PDF | jsPDF + jspdf-autotable |
| Ícones | Lucide React |

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # produção → dist/
```

---

## 3. Estrutura do projeto

```
src/app/
├── components/          # UI reutilizável
│   ├── Sidebar.tsx
│   ├── ImportPreviewModal.tsx
│   ├── ImportReplaceHint.tsx
│   ├── ActivityLogPanel.tsx
│   ├── LastImportBanner.tsx
│   ├── CrossModuleValidationPanel.tsx
│   ├── DeadlineAlertsPanel.tsx
│   ├── SavedFiltersBar.tsx
│   ├── RequireAdmin.tsx / RequireWrite.tsx
│   ├── ReadOnlyBanner.tsx
│   └── ConfirmProvider.tsx
│
├── pages/             # Telas da aplicação
│   ├── Login.tsx
│   ├── DashboardLayout.tsx   # guard de sessão + refresh automático
│   ├── Home.tsx              # hub de importação e ferramentas
│   ├── Dashboard.tsx
│   ├── Courses.tsx           # catálogo unificado importado
│   ├── CourseArea.tsx        # visão por área/eixo (legado + importado)
│   ├── PlanoMetas.tsx
│   ├── ValoresPCA2025.tsx
│   ├── QuantidadeCursosPorEixo.tsx
│   ├── ProcessosVisitasTecnicas.tsx
│   ├── ProcessosHorasPedagogicas.tsx
│   ├── AcoesExtensivas.tsx
│   ├── Eventos.tsx
│   ├── Ceped.tsx
│   ├── Users.tsx / NewUser.tsx / EditUser.tsx
│   └── NewCourse.tsx / EditCourse.tsx
│
├── utils/             # Lógica de negócio
│   ├── store.ts              # CRUD + localStorage
│   ├── auth.ts               # sessão de login
│   ├── permissions.ts        # regras por perfil
│   ├── importExcel.ts        # leitura de abas .xlsx
│   ├── importarPortfolioCompleto.ts
│   ├── analisarPortfolio.ts  # preview pré-importação
│   ├── backupRestore.ts      # backup JSON + snapshot
│   ├── importHistory.ts      # histórico de importações
│   ├── activityLog.ts        # log de auditoria local
│   ├── activityLogExport.ts  # CSV/PDF do log
│   ├── crossModuleValidation.ts
│   ├── deadlineAlerts.ts
│   ├── savedFilters.ts
│   ├── portfolioReport.ts    # PDF consolidado
│   ├── portfolioExcelExport.ts
│   ├── dashboardData.ts      # fonte única do Dashboard
│   ├── dataRefresh.ts        # evento de atualização global
│   └── exportExcel.ts        # export por módulo
│
├── hooks/
│   ├── usePermissions.ts
│   └── useSessionTimeout.ts  # logout após 30 min inativo
│
├── data/              # seeds e dados estáticos de fallback
└── routes.tsx
```

---

## 4. Autenticação e perfis

### Login (`/`)

- Valida e-mail e senha contra usuários em `sgp_usuarios` (`store.ts`).
- Sessão salva em `sgp_sessao` (`auth.ts`).
- Sem auto-cadastro, sem “esqueci minha senha” (acesso criado pelo Admin).

### Perfis

| Perfil | Slug | Escrita | Usuários | Exportar |
|--------|------|---------|----------|----------|
| Administrador | `admin` | Sim | Sim | Sim |
| Editor | `editor` | Sim | Não | Sim |
| Consultivo | `consultivo` | Não | Não | Sim |

Componentes de proteção: `RequireAdmin`, `RequireWrite`, `ReadOnlyBanner`.

### Timeout de sessão

`useSessionTimeout` no `DashboardLayout` encerra a sessão após **30 minutos** de inatividade.

---

## 5. Rotas

### Pública

| Rota | Página |
|------|--------|
| `/` | Login |

> Rotas `/register`, `/forgot-password` e `/reset-password` existem como arquivos legados, mas **não estão registradas** no router.

### Privadas (`/app/*` — exige sessão)

| Rota | Página | Restrição |
|------|--------|-----------|
| `/app` | Redireciona → `/app/inicio` | — |
| `/app/inicio` | Home | — |
| `/app/dashboard` | Dashboard | — |
| `/app/cursos` | Courses (catálogo) | — |
| `/app/cursos/:area` | CourseArea | — |
| `/app/novo-curso` | NewCourse | Editor+ |
| `/app/cursos/editar/:id` | EditCourse | Editor+ |
| `/app/plano-metas` | PlanoMetas | — |
| `/app/valores-pca-2025` | ValoresPCA | — |
| `/app/quantidade-cursos-por-eixo` | CursosPorEixo | — |
| `/app/processos-visitas-tecnicas` | Visitas | — |
| `/app/processos-horas-pedagogicas` | Horas | — |
| `/app/acoes-extensivas` | Ações Extensivas | — |
| `/app/eventos` | Eventos | — |
| `/app/ceped` | CEPED | — |
| `/app/usuarios` | Users | Admin |
| `/app/usuarios/novo` | NewUser | Admin |
| `/app/usuarios/editar/:id` | EditUser | Admin |

---

## 6. Persistência (`localStorage`)

### Chaves principais

| Chave | Conteúdo |
|-------|----------|
| `sgp_sessao` | Sessão do usuário logado |
| `sgp_usuarios` | Cadastro de usuários |
| `sgp_stored_courses` | Cursos importados |
| `sgp_plano_metas` | Plano de Metas |
| `sgp_valores_pca` | Valores PCA |
| `sgp_cursos_eixo` | Cursos por Eixo |
| `sgp_visitas_tecnicas` | Visitas Técnicas |
| `sgp_horas_pedagogicas` | Horas Pedagógicas |
| `sgp_acoes_extensivas` | Ações Extensivas |
| `sgp_eventos` | Eventos |
| `sgp_ceped_equipe` | Equipe CEPED |
| `sgp_atividade_log` | Log de atividades (últimas 200) |
| `sgp_import_history` | Histórico de importações (últimas 50) |
| `sgp_snapshot_pre_import` | Snapshot automático pré-importação |
| `sgp_filtros_cursos` / `sgp_filtros_plano-metas` | Filtros salvos |
| `sgp_ultimo_email` | E-mail lembrado no logout |

Todas as chaves acima (exceto sessão) entram no **backup JSON** (`backupRestore.ts`).

---

## 7. Planilha principal — fluxo de importação

### Módulos alimentados (8)

1. Cursos  
2. Plano de Metas  
3. Valores PCA  
4. Cursos por Eixo  
5. Visitas Técnicas  
6. Horas Pedagógicas  
7. Ações Extensivas  
8. Eventos  

### Fluxo (página Início)

```
Selecionar .xlsx
  → analisarPortfolioCompleto()   # preview + comparativo
  → ImportPreviewModal              # confirmação do usuário
  → savePreImportSnapshot()         # backup automático
  → importarPortfolioCompleto()     # substitui dados por módulo
  → recordImportHistory()           # histórico
  → notifyDataChanged()             # telas se atualizam sozinhas
```

### Desfazer importação

Se algo sair errado, o botão **Desfazer última importação** restaura o snapshot em `sgp_snapshot_pre_import`.

### Limpar dados

Remove os módulos da planilha principal (Cursos, Plano de Metas, Valores PCA, Cursos por Eixo, Visitas e Horas). Ações Extensivas e Eventos têm limpeza própria nas respectivas telas. **Não** apaga Usuários nem CEPED.

---

## 8. Página Início (`/app/inicio`)

Layout atual:

1. **Acesso Rápido** — grade 4 colunas com links para todos os módulos  
2. **Planilha principal** — importar / limpar / dashboard (botões empilhados e centralizados)  
3. **Validação cruzada** — inconsistências entre módulos  
4. **Histórico de importações** — últimas 5 importações  
5. **Backup e relatório** — JSON, restaurar, PDF, Excel consolidado  
6. **Log de atividades** — resumo + export CSV/PDF  

---

## 9. Dashboard (`/app/dashboard`)

- Fonte de dados: `getDashboardCourses()` em `dashboardData.ts` (importado ou vazio).
- Exibe última importação (banner compacto).
- **Alertas de prazo** — visitas e metas vencendo em 15 dias ou atrasadas.
- Gráficos por eixo, tipo, status e carga horária.
- Métricas de processos (visitas, horas, ações, eventos).

---

## 10. Funcionalidades transversais

| Recurso | Arquivo | Descrição |
|---------|---------|-----------|
| Preview importação | `analisarPortfolio.ts` | Novos, removidos, delta e avisos por módulo |
| Validação cruzada | `crossModuleValidation.ts` | SEI/SIG órfãos, títulos divergentes, eventos sem ação |
| Alertas de prazo | `deadlineAlerts.ts` | Visitas e metas com prazo próximo |
| Filtros salvos | `savedFilters.ts` | Cursos e Plano de Metas |
| Log de atividades | `activityLog.ts` | Registro local de ações importantes |
| Refresh automático | `dataRefresh.ts` | `Outlet` remonta após import/restore/clear |
| Export Excel módulo | `exportExcel.ts` | Por tela (Cursos, Visitas, etc.) |
| Excel consolidado | `portfolioExcelExport.ts` | 8 abas em um arquivo |
| Relatório PDF | `portfolioReport.ts` | Resumo executivo do portfólio |
| Usuários em lote | `importUsuarios.ts` | Planilha com Nome, E-mail, Perfil, Senha |

---

## 11. Exportações

Cada módulo com dados pode exportar **Excel, CSV e PDF** (quando há registros).

Na página Início:

- **Backup JSON** — snapshot completo do navegador  
- **Relatório PDF** — visão consolidada para CEPED  
- **Excel consolidado** — uma aba por módulo  
- **Log CSV/PDF** — auditoria de ações  

---

## 12. Design system (resumo)

### Cores institucionais

| Uso | Cor |
|-----|-----|
| Primária | `#003F7D` |
| Ação / destaque | `#F57C00` |
| Fundo app | `#F5F7FA` / branco |
| Sucesso | verde (`emerald`) |
| Alerta | âmbar |
| Erro | vermelho |

### Layout

- Sidebar fixa (desktop) / overlay (mobile).
- Páginas com `pt-16 lg:pt-5` ou `pt-20` no mobile para o menu hambúrguer.
- Cards com `rounded-xl`, bordas `border-gray-200`, sombra leve.

---

## 13. Estado atual

### Implementado

- Autenticação local com perfis e timeout  
- Importação completa com preview, validação e desfazer  
- Dashboard unificado (dados importados ou vazio)  
- Backup/restauração JSON  
- Histórico de importações e log de atividades exportável  
- Validação cruzada e alertas de prazo  
- Filtros salvos (Cursos, Plano de Metas)  
- CRUD de usuários com exclusão e importação em lote  
- Exportação Excel/CSV/PDF por módulo e consolidado  
- CEPED, Ações Extensivas, Eventos (manual + importação)  
- Atualização automática das telas após mudanças de dados  

### Fora do escopo desta versão

- Backend / API REST  
- Autenticação JWT / Active Directory  
- Sincronização multi-navegador  
- Hash de senhas (senhas em texto no `localStorage`)  
- Busca global unificada  
- Download de modelo de planilha  

---

## 14. Próximos passos sugeridos

1. **Backend** — API para dados centralizados e multi-usuário real  
2. **Segurança** — hash de senhas, política de senha, HTTPS obrigatório  
3. **Backups automáticos rotativos** — últimos N snapshots locais  
4. **Integração institucional** — SEI, SIG, AD SENAC  
5. **Testes automatizados** — importação, permissões, backup  

---

## 15. Guia rápido para desenvolvedores

### Adicionar um novo módulo à importação principal

1. Criar `importarNovoModuloExcel()` em `importExcel.ts`  
2. Adicionar `replaceNovoModulo()` em `store.ts`  
3. Incluir em `MODULOS` de `importarPortfolioCompleto.ts`  
4. Incluir análise em `analisarPortfolio.ts`  
5. Adicionar aba em `portfolioExcelExport.ts`  
6. Atualizar `limparDadosPortfolio()` se o módulo for limpo junto  

### Disparar refresh após alterar dados

```typescript
import { notifyDataChanged } from "./utils/dataRefresh";
notifyDataChanged("import"); // ou "restore" | "clear"
```

### Registrar ação no log

```typescript
import { logActivity } from "./utils/activityLog";
logActivity("Título da ação", "Detalhes opcionais");
```

### Verificar permissão em componente

```typescript
const { canWrite, canManageUsers } = usePermissions();
```

---

## 16. Arquitetura de navegação

```
Login (/)
  ↓
DashboardLayout (sessão + sidebar)
  ├─ Início          → importação, backup, validação
  ├─ Dashboard       → indicadores
  ├─ Cursos          → catálogo importado
  ├─ Módulos         → metas, PCA, visitas, horas, ações, eventos, eixo
  ├─ CEPED
  └─ Usuários        → admin only
```

---

**Desenvolvido para:** SENAC DF · CPED  
**Pacote:** `sgp-senac-portfolio@1.0.0-beta`

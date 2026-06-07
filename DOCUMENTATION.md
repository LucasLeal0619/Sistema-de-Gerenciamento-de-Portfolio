# SGP — Documentação Técnica

**Sistema de Gerenciamento de Portfólio · SENAC DF · CPED**  
**Versão:** 1.0.0-beta  
**Última atualização:** 2026-06-06

**Deploy (preview):** [prototipo-sgp.vercel.app](https://prototipo-sgp.vercel.app/)

---

## 1. Visão geral

O SGP é uma SPA (Single Page Application) para gestão do portfólio educacional do SENAC DF. Nesta versão beta:

- Os dados vivem no **`localStorage`** do navegador (sem backend).
- A **planilha principal** é a fonte de verdade para a maioria dos módulos.
- O **Dashboard** e a página **Cursos** leem os mesmos dados importados (`dashboardData.ts` + `store.ts`).
- Há **autenticação local**, **perfis de acesso** e **auditoria** básica de ações.
- **Não há sincronização entre navegadores** — cada máquina/navegador é independente.

### Credenciais padrão (primeiro acesso)

| Campo | Valor |
|-------|-------|
| E-mail | `administrador@df.senac.br` |
| Senha | `senac2025` |

O administrador padrão é garantido por `ensureDefaultAdmin()` em `getUsuarios()` (`store.ts`). Os campos vêm pré-preenchidos em `Login.tsx`.

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
| Deploy | Vercel (estático, `dist/`) |

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

- Rota pública registrada em `routes.tsx`.
- **Sempre exibe a tela de login** ao acessar `/` — não há redirecionamento automático para `/app/inicio`, mesmo com sessão salva.
- Valida e-mail e senha contra usuários em `sgp_usuarios` (`store.ts` / `auth.ts`).
- Sessão salva em `sgp_sessao` após clicar em **Entrar**.
- Sem auto-cadastro, sem “esqueci minha senha” (acesso criado pelo Admin).

### Guard de sessão (`DashboardLayout`)

Rotas `/app/*` usam `getValidSession()` (`auth.ts`):

1. Lê `sgp_sessao` do `localStorage`.
2. Verifica se o `userId` ainda existe em `sgp_usuarios` e está **ativo**.
3. Se inválido → `clearSession()` e redireciona para `/`.
4. Se válido → renderiza sidebar + conteúdo.

### Perfis

| Perfil | Slug | Escrita | Usuários | Exportar |
|--------|------|---------|----------|----------|
| Administrador | `admin` | Sim | Sim | Sim |
| Editor | `editor` | Sim | Não | Sim |
| Consultivo | `consultivo` | Não | Não | Sim |

Componentes de proteção: `RequireAdmin`, `RequireWrite`, `ReadOnlyBanner`.

### Timeout de sessão

`useSessionTimeout` no `DashboardLayout` encerra a sessão após **30 minutos** de inatividade e redireciona para `/` com aviso.

### Logout

O botão **Sair** em `Sidebar.tsx` chama `clearSession()` e navega para `/`, preservando o e-mail no estado para pré-preenchimento.

---

## 5. Rotas

### Pública

| Rota | Página |
|------|--------|
| `/` | Login |

> Rotas `/register`, `/forgot-password` e `/reset-password` existem como arquivos legados, mas **não estão registradas** no router.

### Privadas (`/app/*` — exige sessão válida)

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
| `sgp_snapshot_pre_import` | Snapshot automático pré-importação (ver seção 7) |
| `sgp_filtros_cursos` / `sgp_filtros_plano-metas` | Filtros salvos |
| `sgp_ultimo_email` | E-mail lembrado no logout |

As chaves listadas em `BACKUP_KEYS` (`backupRestore.ts`) entram no **backup JSON** exportado manualmente. A sessão (`sgp_sessao`) e o snapshot pré-importação **não** fazem parte desse arquivo.

### Limitação: uso multi-usuário

| Cenário | Comportamento |
|---------|---------------|
| Vários usuários abrindo o sistema | Possível (SPA estática na Vercel) |
| Dados compartilhados em tempo real | **Não** — cada navegador tem cópia isolada |
| Edição simultânea do mesmo registro | **Não** — sem controle de conflito |
| Compartilhar estado entre PCs | Via **backup JSON** ou reimportação da planilha |

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

### Snapshot pré-importação

O **snapshot** é uma cópia automática do estado completo do navegador, salva **imediatamente antes** de cada importação confirmada na página Início.

**Implementação:** `savePreImportSnapshot()` → `capturePortfolioState()` → `sgp_snapshot_pre_import` (`backupRestore.ts`).

**O que entra no snapshot** (mesmas chaves de `BACKUP_KEYS`):

- Cursos, Plano de Metas, PCA, Cursos por Eixo, Visitas, Horas  
- Ações Extensivas, Eventos, CEPED  
- Usuários, histórico de importações, log de atividades, filtros salvos, etc.

**O que não entra:** sessão de login (`sgp_sessao`).

#### Fluxo

```
Confirmar importação
  → savePreImportSnapshot()     # guarda estado ATUAL
  → importarPortfolioCompleto() # aplica planilha nova
  → botão "Desfazer última importação" fica disponível
```

#### Desfazer importação

O botão **Desfazer última importação** (`restorePreImportSnapshot()`) restaura o snapshot e **remove** a chave `sgp_snapshot_pre_import` (snapshot consumido).

#### Limitações

| Aspecto | Comportamento |
|---------|---------------|
| Quantidade guardada | **Uma só** — cada nova importação sobrescreve o snapshot anterior |
| Escopo | Apenas **este navegador** |
| Duração | Até desfazer ou importar de novo |
| Substitui backup manual? | **Não** — backup JSON continua necessário para cópias de longo prazo ou outro PC |

#### Snapshot × Backup JSON

| | **Snapshot** (`sgp_snapshot_pre_import`) | **Backup JSON** (arquivo exportado) |
|---|------------------------------------------|-------------------------------------|
| Gatilho | Automático antes da importação | Manual (botão na Início) |
| Formato | JSON no `localStorage` | Arquivo `.json` baixado |
| Retenção | Só a última importação | Ilimitada (quantos arquivos guardar) |
| Uso típico | Desfazer importação errada | Migrar máquina, contingência, arquivo de auditoria |
| Restauração | **Desfazer última importação** | **Restaurar backup** (upload do arquivo) |

### Limpar dados (Início)

Remove os módulos da planilha principal: **Cursos, Plano de Metas, Valores PCA, Cursos por Eixo, Visitas e Horas**.

- **Ações Extensivas** e **Eventos** não são apagados por esse botão — usam **Restaurar exemplos** nas respectivas telas.
- **Não** apaga Usuários nem CEPED.

### Importação por módulo

Além da planilha principal, cada tela pode importar sua aba via **Importar Excel** (substitui todos os registros do módulo):

| Módulo | Função | Abas aceitas |
|--------|--------|--------------|
| Cursos | `importarCursosExcel` | Cursos, Portfólio, etc. |
| Plano de Metas | `importarPlanoMetasExcel` | Plano de Metas |
| Valores PCA | `importarValoresPCAExcel` | Valores PCA |
| Cursos por Eixo | `importarCursosEixoExcel` | Cursos por Eixo |
| Visitas | `importarVisitasTecnicasExcel` | Visitas Técnicas |
| Horas | `importarHorasPedagogicasExcel` | Horas Pedagógicas |
| Ações Extensivas | `importarAcoesExtensivasExcel` | Ações Extensivas, Acoes Extensivas, Extensivas |
| Eventos | `importarEventosExcel` | Eventos, Eventos Institucionais |

Todas as importações por módulo exibem o aviso `ImportReplaceHint` (reimportação substitui dados locais).

---

## 8. Ações Extensivas e Eventos

Comportamento atual (planilha oficial ainda indefinida):

- Exibem **3 registros de exemplo** por padrão (primeiro acesso ou lista vazia).
- **Importar Excel** na própria tela ou via planilha principal (Início) substitui os exemplos.
- **Nova Ação** / **Novo Evento** para cadastro manual.
- **Restaurar exemplos** volta aos 3 registros padrão de demonstração.
- Exportação Excel, CSV e PDF dos registros filtrados.

### Colunas esperadas — Ações Extensivas

Ano, Título, Eixo, Unidade, Carga Horária, Data, Processo SEI, Status, Observação.

### Colunas esperadas — Eventos

Ano, Nome, Data, Unidade, Eixo, Quantidade de Pessoas, Equipe, Possui Ação Extensiva, Ação Vinculada, Status, Observação.

---

## 9. Página Início (`/app/inicio`)

Layout atual:

1. **Acesso Rápido** — grade 4 colunas com links para todos os módulos  
2. **Planilha principal** — importar / desfazer (snapshot) / limpar / dashboard (botões empilhados e centralizados)  
3. **Validação cruzada** — inconsistências entre módulos (ver seção 11)  
4. **Histórico de importações** — últimas 5 importações  
5. **Backup e relatório** — exportar/restaurar JSON, PDF consolidado, Excel consolidado  
6. **Log de atividades** — resumo + export CSV/PDF  

---

## 10. Dashboard (`/app/dashboard`)

- Fonte de dados: `getDashboardCourses()` em `dashboardData.ts` (importado ou vazio).
- Exibe última importação (banner compacto).
- **Alertas de prazo** — visitas e metas vencendo em 15 dias ou atrasadas.
- Gráficos por eixo, tipo, status e carga horária.
- Métricas de processos (visitas, horas, ações, eventos).

---

## 11. Validação cruzada

Implementada em `crossModuleValidation.ts`, exibida em `CrossModuleValidationPanel` na página Início.

Compara dados entre módulos e lista inconsistências com link **Ver módulo**:

| Verificação | Severidade | Descrição |
|-------------|------------|-----------|
| Plano de Metas × Cursos | Aviso | SEI do Plano de Metas não encontrado nos Cursos |
| Plano de Metas × Cursos | Aviso | SIG do Plano de Metas não encontrado nos Cursos |
| Valores PCA × Cursos | Aviso | SIG do PCA sem curso correspondente |
| Cursos × PCA | Aviso | Mesmo SIG com título diferente entre Curso e PCA |
| Visitas Técnicas | **Erro** | Visita sem processo SEI preenchido |
| Eventos × Ações Extensivas | Aviso | Evento com ação vinculada que não existe em Ações Extensivas |

- Não bloqueia importação — apenas alerta após os dados estarem carregados.
- Não corrige automaticamente.
- Executada localmente no navegador.

---

## 12. Funcionalidades transversais

| Recurso | Arquivo | Descrição |
|---------|---------|-----------|
| Snapshot pré-importação | `backupRestore.ts` | Cópia automática antes da importação; desfazer com um clique |
| Backup/restauração JSON | `backupRestore.ts` | Export manual e upload para restaurar estado completo |
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

## 13. Exportações e cópias de segurança

### Por módulo

Cada módulo com dados pode exportar **Excel, CSV e PDF** (quando há registros).

### Na página Início

| Ação | Tipo | Descrição |
|------|------|-----------|
| **Desfazer última importação** | Snapshot automático | Restaura estado de antes da última importação (ver seção 7) |
| **Exportar backup** | Backup JSON manual | Baixa arquivo `.json` com todos os módulos (`BACKUP_KEYS`) |
| **Restaurar backup** | Backup JSON manual | Substitui dados locais pelo conteúdo do arquivo enviado |
| **Relatório PDF** | Exportação | Visão consolidada para CEPED |
| **Excel consolidado** | Exportação | Uma aba por módulo (8 abas) |
| **Log CSV/PDF** | Exportação | Auditoria de ações registradas |

---

## 14. Design system (resumo)

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

## 15. Estado atual

### Implementado

- Autenticação local com perfis, timeout e login sempre em `/`  
- Importação completa com preview, validação e desfazer  
- Importação Excel por módulo (incluindo Ações Extensivas e Eventos)  
- Dashboard unificado (dados importados ou vazio)  
- Snapshot automático pré-importação e desfazer com um clique  
- Backup/restauração JSON manual  
- Histórico de importações e log de atividades exportável  
- Validação cruzada e alertas de prazo  
- Filtros salvos (Cursos, Plano de Metas)  
- CRUD de usuários com exclusão e importação em lote  
- Exportação Excel/CSV/PDF por módulo e consolidado  
- CEPED, Ações Extensivas, Eventos (exemplos padrão + importação + cadastro manual)  
- Atualização automática das telas após mudanças de dados  
- Deploy estático na Vercel  

### Fora do escopo desta versão

- Backend / API REST  
- Autenticação JWT / Active Directory  
- Sincronização multi-navegador / multi-usuário em tempo real  
- Hash de senhas (senhas em texto no `localStorage`)  
- Busca global unificada  
- Download de modelo de planilha  

---

## 16. Próximos passos sugeridos

1. **Backend** — API para dados centralizados e multi-usuário real  
2. **Segurança** — hash de senhas, política de senha, HTTPS obrigatório  
3. **Backups automáticos rotativos** — últimos N snapshots locais  
4. **Integração institucional** — SEI, SIG, AD SENAC  
5. **Testes automatizados** — importação, permissões, backup  
6. **Modelo de planilha** — download com abas e colunas esperadas  

---

## 17. Guia rápido para desenvolvedores

### Adicionar um novo módulo à importação principal

1. Criar `importarNovoModuloExcel()` em `importExcel.ts`  
2. Adicionar `replaceNovoModulo()` em `store.ts`  
3. Incluir em `MODULOS` de `importarPortfolioCompleto.ts`  
4. Incluir análise em `analisarPortfolio.ts`  
5. Adicionar aba em `portfolioExcelExport.ts`  
6. Atualizar `limparDadosPortfolio()` se o módulo for limpo junto na Home  

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

### Snapshot (API interna)

```typescript
import {
  savePreImportSnapshot,
  hasPreImportSnapshot,
  restorePreImportSnapshot,
  clearPreImportSnapshot,
} from "./utils/backupRestore";

savePreImportSnapshot();           // antes de importar
if (hasPreImportSnapshot()) { ... }
restorePreImportSnapshot();      // desfazer — consome o snapshot
```

### Exemplos padrão (Ações / Eventos)

`getAcoesExtensivas()` e `getEventos()` restauram 3 registros de exemplo quando a chave está ausente ou vazia (`restoreAcoesExtensivasDefaults`, `restoreEventosDefaults`). `resetAcoesExtensivasParaExemplos()` e `resetEventosParaExemplos()` forçam a restauração via botão na UI.

---

## 18. Arquitetura de navegação

```
/  → Login (sempre exibido)
  ↓ Entrar (sessão válida)
DashboardLayout (getValidSession + sidebar)
  ├─ Início          → importação, snapshot/desfazer, backup JSON, validação cruzada
  ├─ Dashboard       → indicadores
  ├─ Cursos          → catálogo importado
  ├─ Módulos         → metas, PCA, visitas, horas, ações, eventos, eixo
  ├─ CEPED
  └─ Usuários        → admin only

/app/* sem sessão válida → redireciona para /
Sair → clearSession() → /
```

---

**Desenvolvido para:** SENAC DF · CPED  
**Pacote:** `sgp-senac-portfolio@1.0.0-beta`

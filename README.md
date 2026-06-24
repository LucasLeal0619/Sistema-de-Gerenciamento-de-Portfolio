# SGP — Sistema de Gerenciamento de Portfólio SENAC DF

Plataforma web para gestão do portfólio de cursos, processos educacionais e indicadores do SENAC DF (CPED). Versão beta com dados persistidos no navegador de cada usuário.

**Deploy (preview):** [prototipo-sgp.vercel.app](https://prototipo-sgp.vercel.app/)

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Stack

- React 18 + TypeScript + Vite
- React Router 7
- Tailwind CSS v4
- Recharts, xlsx, jsPDF
- Lucide React

## O que o sistema faz

- **Início enxuta** — painel com acesso rápido; ferramentas operacionais em **Importação** (`/app/importacao`)
- **Importação centralizada** — uma planilha `.xlsx` alimenta 8 módulos (Cursos, Plano de Metas, PCA, Cursos por Eixo, Visitas, Horas, Ações Extensivas e Eventos)
- **Importação por módulo** — cada tela pode importar sua própria aba Excel (incluindo Ações Extensivas e Eventos)
- **Pré-visualização** com comparativo antes/depois e validações antes de confirmar a importação
- **Snapshot automático** — cópia de segurança antes de cada importação; **Desfazer última importação** restaura o estado anterior
- **Dashboard** unificado com dados importados, alertas de prazo e última atualização
- **Validação cruzada** — detecta inconsistências entre módulos (SEI, SIG, vínculos)
- **Backup/restauração** JSON manual, log de atividades (CSV/PDF), relatório PDF e Excel consolidado
- **Usuários** com perfis Admin / Editor / Consultivo e importação em lote
- **PCA** — cursos previstos no planejamento do período (filtros por ano, semestre, unidade e eixo)
- **Exportação** Excel, CSV e PDF por módulo

## Acesso e login

A rota `/` **sempre exibe a tela de login**. Para entrar no sistema, é necessário clicar em **Entrar** (não há redirecionamento automático para o painel).

| Campo | Valor (administrador padrão) |
|-------|------------------------------|
| E-mail | `administrador@df.senac.br` |
| Senha | `senac2025` |

Os campos vêm pré-preenchidos na tela de login. O administrador padrão é criado automaticamente no primeiro acesso se ainda não existir.

Novos usuários são criados apenas por administradores em **Usuários → Novo Usuário**.

### Sessão

- Sessão salva em `localStorage` (`sgp_sessao`)
- Encerramento automático após **30 minutos** de inatividade
- Botão **Sair** no menu lateral encerra a sessão e volta ao login

### Uso simultâneo

Esta beta **não possui servidor centralizado**. Cada navegador mantém sua própria cópia dos dados. Vários usuários podem abrir o sistema ao mesmo tempo, mas **não compartilham** os mesmos registros em tempo real.

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Login (sempre exibido ao abrir o link raiz) |
| `/app/inicio` | Painel inicial: acesso rápido aos módulos |
| `/app/importacao` | Planilha principal, backup, validação cruzada, histórico e log |
| `/app/dashboard` | Indicadores e gráficos |
| `/app/cursos` | Catálogo importado |
| `/app/plano-metas` | Plano de Metas |
| `/app/valores-pca-2025` | PCA — cursos previstos no planejamento do período |
| `/app/quantidade-cursos-por-eixo` | Cursos por Eixo |
| `/app/processos-visitas-tecnicas` | Visitas Técnicas |
| `/app/processos-horas-pedagogicas` | Horas Pedagógicas |
| `/app/acoes-extensivas` | Ações Extensivas (3 exemplos + importação Excel + cadastro manual) |
| `/app/eventos` | Eventos (3 exemplos + importação Excel + cadastro manual) |
| `/app/ceped` | CPED |
| `/app/usuarios` | Usuários (somente Admin) |

Rotas `/app/*` exigem login. Sem sessão válida, o usuário é redirecionado para `/`.

## Perfis de acesso

| Perfil | Permissões |
|--------|------------|
| **Administrador** | Tudo, incluindo usuários |
| **Editor** | Cadastro, edição, importação e exclusão de dados |
| **Consultivo** | Somente leitura e exportação |

## Snapshot × Backup JSON

| | **Snapshot** | **Backup JSON** |
|---|-------------|-----------------|
| **Quando** | Automático, antes de cada importação em **Importação** | Manual, quando você exporta o arquivo |
| **Onde fica** | No navegador (`sgp_snapshot_pre_import`) | Arquivo `.json` que você guarda |
| **Quantos** | Só o da **última** importação | Quantos arquivos você quiser |
| **Para quê** | **Desfazer** a importação mais recente | Migrar de PC, contingência de longo prazo |

O snapshot é o “Ctrl+Z da importação”. O backup JSON é uma cópia completa para guardar ou restaurar em outro momento.

## Documentação completa

Ver [DOCUMENTATION.md](./DOCUMENTATION.md) para arquitetura, chaves de `localStorage`, snapshot, backup JSON, fluxo de importação, validação cruzada e guia de desenvolvimento.

---

**Versão:** 1.0.0-beta · **Uso:** interno SENAC DF / CPED

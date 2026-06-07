# SGP — Sistema de Gerenciamento de Portfólio SENAC DF

Plataforma web para gestão do portfólio de cursos, processos educacionais e indicadores do SENAC DF (CPED). Versão beta com dados persistidos no navegador.

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

- **Importação centralizada** — uma planilha `.xlsx` alimenta 8 módulos (Cursos, Plano de Metas, PCA, Cursos por Eixo, Visitas, Horas, Ações Extensivas e Eventos)
- **Pré-visualização** com comparativo antes/depois, validações e snapshot para desfazer importação
- **Dashboard** unificado com dados importados, alertas de prazo e última atualização
- **Backup/restauração** JSON, log de atividades (CSV/PDF), relatório PDF e Excel consolidado
- **Validação cruzada** entre módulos (SEI, SIG, vínculos)
- **Usuários** com perfis Admin / Editor / Consultivo e importação em lote
- **Exportação** Excel, CSV e PDF por módulo

## Acesso inicial (demo)

| Campo | Valor |
|-------|-------|
| E-mail | `administrador@df.senac.br` |
| Senha | `senac2025` |

Novos usuários são criados apenas por administradores em **Usuários → Novo Usuário**.

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Login |
| `/app/inicio` | Hub: importação, backup, validação, histórico |
| `/app/dashboard` | Indicadores e gráficos |
| `/app/cursos` | Catálogo importado |
| `/app/plano-metas` | Plano de Metas |
| `/app/valores-pca-2025` | Valores PCA |
| `/app/quantidade-cursos-por-eixo` | Cursos por Eixo |
| `/app/processos-visitas-tecnicas` | Visitas Técnicas |
| `/app/processos-horas-pedagogicas` | Horas Pedagógicas |
| `/app/acoes-extensivas` | Ações Extensivas |
| `/app/eventos` | Eventos |
| `/app/ceped` | CEPED |
| `/app/usuarios` | Usuários (somente Admin) |

## Perfis de acesso

| Perfil | Permissões |
|--------|------------|
| **Administrador** | Tudo, incluindo usuários |
| **Editor** | Cadastro, edição, importação e exclusão de dados |
| **Consultivo** | Somente leitura e exportação |

## Documentação completa

Ver [DOCUMENTATION.md](./DOCUMENTATION.md) para arquitetura, chaves de `localStorage`, fluxo de importação, utilitários e guia de desenvolvimento.

---

**Versão:** 1.0.0-beta · **Uso:** interno SENAC DF / CPED

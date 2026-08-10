/**
 * Diagnóstico: verifica se letras a/t/i/v/o/n estão em 100% dos
 * registros nos mesmos campos que a busca textual usa hoje.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const LETTERS = ["a", "t", "i", "v", "o", "n"];

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matches(query, fields) {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return fields.some((f) => normalizeSearchText(f).includes(q));
}

function extractArrayLiteral(filePath, exportName) {
  const src = readFileSync(filePath, "utf8");
  const re = new RegExp(
    `export\\s+const\\s+${exportName}\\s*[:=][^=]*=\\s*(\\[[\\s\\S]*?\\]);`,
  );
  const m = src.match(re);
  if (!m) throw new Error(`Não achou ${exportName} em ${filePath}`);
  const lit = m[1]
    .replace(/(\w+)\s*:/g, '"$1":')
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
  return Function(`"use strict"; return (${lit});`)();
}

function analyze(name, rows, getFields) {
  const total = rows.length;
  console.log(`\n=== ${name} (${total} registros) ===`);
  if (!total) {
    console.log("  (sem dados)");
    return;
  }

  const fieldNames = Object.keys(getFields(rows[0]));
  for (const letter of LETTERS) {
    let hit = 0;
    const byField = Object.fromEntries(fieldNames.map((f) => [f, 0]));
    for (const row of rows) {
      const map = getFields(row);
      if (matches(letter, Object.values(map))) hit++;
      for (const [k, v] of Object.entries(map)) {
        if (normalizeSearchText(v).includes(letter)) byField[k]++;
      }
    }
    const pct = ((hit / total) * 100).toFixed(1);
    const neverFilters = hit === total;
    const cover100 = Object.entries(byField)
      .filter(([, c]) => c === total)
      .map(([k]) => k);
    const cover90 = Object.entries(byField)
      .filter(([, c]) => c > 0 && c < total && c / total >= 0.9)
      .map(([k, c]) => `${k}(${c}/${total})`);
    console.log(
      `  "${letter}": ${hit}/${total} (${pct}%)${neverFilters ? " → NÃO FILTRA" : " → filtra"}` +
        (cover100.length ? ` | campo 100%: [${cover100.join(", ")}]` : "") +
        (cover90.length ? ` | ~todos: ${cover90.join(", ")}` : ""),
    );
  }
}

const visitas = extractArrayLiteral(
  resolve(root, "src/app/data/visitasTecnicasSeed.ts"),
  "VISITAS_TECNICAS_SEED",
);
analyze("Visitas (busca atual)", visitas, (r) => ({
  ano: r.ano,
  unidade: r.unidade,
  eixo: r.eixo,
  processoSEI: r.processoSEI,
  dataSolicitacao: r.dataSolicitacao,
  dataVisitaPrevista: r.dataVisitaPrevista,
  prazoLimite: r.prazoLimite,
  responsavel: r.responsavel,
  relatorio: r.relatorio,
  observacao: r.observacao,
}));
analyze("Visitas (só unidade/eixo/SEI/resp/obs)", visitas, (r) => ({
  unidade: r.unidade,
  eixo: r.eixo,
  processoSEI: r.processoSEI,
  responsavel: r.responsavel,
  observacao: r.observacao,
}));

const horas = extractArrayLiteral(
  resolve(root, "src/app/data/horasPedagogicasSeed.ts"),
  "HORAS_PEDAGOGICAS_SEED",
);
analyze("Horas (busca atual)", horas, (r) => ({
  ano: r.ano,
  processoSEI: r.processoSEI,
  eixo: r.eixo,
  segmento: r.segmento,
  nomePessoa: r.nomePessoa,
  matricula: r.matricula,
  motivo: r.motivo,
  observacao: r.observacao,
}));
analyze("Horas (só SEI/pessoa/motivo/obs)", horas, (r) => ({
  processoSEI: r.processoSEI,
  nomePessoa: r.nomePessoa,
  motivo: r.motivo,
  observacao: r.observacao,
}));

// Plano Metas — dataset de referência do código (campos alinhados à página)
const plano = extractArrayLiteral(
  resolve(root, "src/app/data/planoMetasData.ts"),
  "planoMetasCourses",
);
analyze("Plano Metas data (segmento/curso/origem/obs)", plano, (r) => ({
  segmento: r.segmento,
  curso: r.tipo,
  origem: r.origem,
  observacao: r.observacao,
}));
analyze("Plano Metas SEM origem fixa", plano, (r) => ({
  segmento: r.segmento,
  curso: r.tipo,
  observacao: r.observacao,
}));

const dumpPath = resolve(root, "scripts/localstorage-dump.json");
if (existsSync(dumpPath)) {
  const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
  const suites = [
    [
      "Ações Extensivas",
      dump.sgp_acoes_extensivas,
      (r) => ({
        atribuido: r.atribuido,
        eixo: r.eixo,
        processoSEI: r.processoSEI,
        assunto: r.assunto,
        objetivo: r.objetivo,
        ultimaAtualizacao: r.ultimaAtualizacao,
        ano: r.ano,
      }),
    ],
    [
      "Eventos",
      dump.sgp_eventos,
      (r) => ({
        ano: r.ano,
        nome: r.nome,
        data: r.data,
        unidade: r.unidade,
        eixo: r.eixo,
        quantidadePessoas: r.quantidadePessoas,
        equipe: r.equipe,
        acaoVinculada: r.acaoVinculada,
        observacao: r.observacao,
      }),
    ],
    [
      "Plano Metas LS",
      dump.sgp_plano_metas,
      (r) => ({
        segmento: r.segmento,
        curso: r.curso ?? r.categoria ?? r.tipo ?? "",
        numeroSEI: r.numeroSEI,
        codigoSIG: r.codigoSIG,
        origem: r.origem,
        observacao: r.observacao,
      }),
    ],
    [
      "Visitas LS",
      dump.sgp_visitas_tecnicas,
      (r) => ({
        ano: r.ano,
        unidade: r.unidade,
        eixo: r.eixo,
        processoSEI: r.processoSEI,
        dataSolicitacao: r.dataSolicitacao,
        dataVisitaPrevista: r.dataVisitaPrevista,
        prazoLimite: r.prazoLimite,
        responsavel: r.responsavel,
        relatorio: r.relatorio,
        observacao: r.observacao,
      }),
    ],
    [
      "Horas LS",
      dump.sgp_horas_pedagogicas,
      (r) => ({
        ano: r.ano,
        processoSEI: r.processoSEI,
        eixo: r.eixo,
        segmento: r.segmento,
        nomePessoa: r.nomePessoa,
        matricula: r.matricula,
        motivo: r.motivo,
        observacao: r.observacao,
      }),
    ],
  ];
  for (const [name, rows, getFields] of suites) {
    if (Array.isArray(rows) && rows.length) analyze(name, rows, getFields);
  }
} else {
  console.log("\n(Sem scripts/localstorage-dump.json — só seeds do repo.)");
}

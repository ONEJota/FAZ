// Fluxo enxuto (recomendação da auditoria: 16 etapas -> 10, em ordem lógica)
export const STATUSES = [
  { name: "Atendimento", color: "#64748b" },
  { name: "Planejamento / Tráfego", color: "#0ea5e9" },
  { name: "Conteúdo / Redação", color: "#22c55e" },
  { name: "Criação / Arte", color: "#a855f7" },
  { name: "Revisão Interna", color: "#f59e0b" },
  { name: "Aprovação Cliente", color: "#ec4899" },
  { name: "Ajustes", color: "#ef4444" },
  { name: "Produção / Veiculação", color: "#14b8a6" },
  { name: "Em Espera", color: "#9ca3af", isWaiting: true },
  { name: "Concluído", color: "#16a34a", isDone: true },
];

// Tabela de serviços sem duplicadas, com tempo padrão (minutos)
export const SERVICES: [string, string, number][] = [
  ["Post estático", "Social", 60],
  ["Carrossel", "Social", 120],
  ["Post animado", "Social", 120],
  ["Reels", "Vídeo", 180],
  ["Stories", "Social", 45],
  ["Vídeo", "Vídeo", 240],
  ["Capa / Banner", "Design", 60],
  ["Flyer", "Design", 90],
  ["Ícones", "Design", 90],
  ["Spot de rádio", "Áudio", 120],
  ["Tráfego Meta Ads", "Tráfego", 90],
  ["Tráfego Google Ads", "Tráfego", 90],
  ["Patrocínio / Impulsionamento", "Tráfego", 30],
  ["Integração de contas / Pixel", "Tráfego", 60],
  ["Planejamento mensal de conteúdo", "Planejamento", 240],
  ["Landing page", "Web", 480],
  ["Arte para impresso", "Design", 120],
  ["Campanha mensal", "Planejamento", 600],
  ["Relatório de resultados", "Planejamento", 90],
];

// Clientes vistos na auditoria, nomes padronizados em MAIÚSCULAS e corrigidos
export const CLIENTS = [
  "AGÊNCIA MONA", "3X DATA TECNOLOGIA", "ADRIANE CORRETORA", "ADUBOS OURO", "ARGEPASI",
  "ATIVA VEÍCULOS", "BAMBERG INCORPORADORA DE IMÓVEIS", "BASE GÁS", "BASE SUL TERRAPLANAGEM",
  "BATERIAS PIONEIRO", "BAZAR PAGUE POKO", "BEM ACOMPANHADO CORRETORA DE SEGUROS",
  "BENEFICÊNCIA CAMILIANA DO SUL – PLANO DE SAÚDE SÃO CAMILO",
  "BENEFICÊNCIA CAMILIANA DO SUL – SEDE ADMINISTRATIVA",
  "BENEFICÊNCIA CAMILIANA DO SUL – HOSPITAL SÃO FRANCISCO",
  "CARLOTTO EMPREENDIMENTOS", "CDL – CÂMARA DE DIRIGENTES LOJISTAS DE CONCÓRDIA", "CERVACON",
  "CGR BALSAS", "COPA CONTESTADO", "CORDIAL CITROËN", "CORDIAL PEUGEOT", "CORDIAL FIAT CONCÓRDIA",
  "JEEP CORDIAL CONCÓRDIA", "RAM CORDIAL CONCÓRDIA", "DOLCE AROMA", "GRUPO PASSARELA", "KOBACAFÉ",
  "MANGOLD ASSESSORIA JURÍDICA", "MASTER AGROINDUSTRIAL", "NEXO SERVIÇOS DE GESTÃO ADMINISTRATIVA",
  "NUTS TECNOLOGIA", "SUCATAS QUINTINO", "SULITA",
];

// Equipe vista na auditoria. E-mails provisórios: o admin troca em Configurações > Usuários.
export const TEAM: [string, string][] = [
  ["Admin Mona", "ADMIN"],
  ["Ana Laura", "COORDENACAO"], ["Fernanda", "COORDENACAO"], ["Thais", "COORDENACAO"],
  ["Andressa", "COLABORADOR"], ["Angela", "COLABORADOR"], ["Cris", "COLABORADOR"],
  ["Edson", "COLABORADOR"], ["Elvis", "COLABORADOR"], ["Getulio", "COLABORADOR"],
  ["João", "COLABORADOR"], ["Juli", "COLABORADOR"], ["Luana", "COLABORADOR"],
  ["Luana Marques", "COLABORADOR"], ["Luiz", "COLABORADOR"], ["Marcelo", "COLABORADOR"],
  ["Maria", "COLABORADOR"], ["Murilo", "COLABORADOR"], ["Ruan", "COLABORADOR"],
];

export const COLORS = ["#E6007E", "#7c3aed", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444", "#14b8a6", "#6366f1"];


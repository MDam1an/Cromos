// ============================================================
// CROMOS — Dados das Figurinhas Copa 2026
// Fonte: Álbum Panini oficial / Tabela MundoDasFigurinhas
// ============================================================

const DATA = {
  meta: { total: 980 },

  especiais: {
    paginaInicial: [
      "FWC00","FWC1","FWC2","FWC3","FWC4","FWC5","FWC6","FWC7","FWC8"
    ],
    history: [
      "FWC9","FWC10","FWC11","FWC12","FWC13","FWC14","FWC15","FWC16","FWC17","FWC18","FWC19"
    ],
    cocaCola: Array.from({length:14}, (_,i) => `CC${i+1}`),
  },

  grupos: [
    { id:"A", selecoes:[
      { nome:"México",          flag:"MX", code:"MEX" },
      { nome:"África do Sul",   flag:"ZA", code:"RSA" },
      { nome:"Coreia do Sul",   flag:"KR", code:"KOR" },
      { nome:"Rep. Tcheca",     flag:"CZ", code:"CZE" },
    ]},
    { id:"B", selecoes:[
      { nome:"Canadá",          flag:"CA", code:"CAN" },
      { nome:"Bósnia",          flag:"BA", code:"BIH" },
      { nome:"Catar",           flag:"QA", code:"QAT" },
      { nome:"Suíça",           flag:"CH", code:"SUI" },
    ]},
    { id:"C", selecoes:[
      { nome:"Brasil",          flag:"BR", code:"BRA" },
      { nome:"Marrocos",        flag:"MA", code:"MAR" },
      { nome:"Haiti",           flag:"HT", code:"HAI" },
      { nome:"Escócia",         flag:"GB-SCT", code:"SCO" },
    ]},
    { id:"D", selecoes:[
      { nome:"Estados Unidos",  flag:"US", code:"USA" },
      { nome:"Paraguai",        flag:"PY", code:"PAR" },
      { nome:"Austrália",       flag:"AU", code:"AUS" },
      { nome:"Turquia",         flag:"TR", code:"TUR" },
    ]},
    { id:"E", selecoes:[
      { nome:"Alemanha",        flag:"DE", code:"GER" },
      { nome:"Curaçao",         flag:"CW", code:"CUW" },
      { nome:"Costa do Marfim", flag:"CI", code:"CIV" },
      { nome:"Equador",         flag:"EC", code:"ECU" },
    ]},
    { id:"F", selecoes:[
      { nome:"Holanda",         flag:"NL", code:"NED" },
      { nome:"Japão",           flag:"JP", code:"JPN" },
      { nome:"Suécia",          flag:"SE", code:"SWE" },
      { nome:"Tunísia",         flag:"TN", code:"TUN" },
    ]},
    { id:"G", selecoes:[
      { nome:"Bélgica",         flag:"BE", code:"BEL" },
      { nome:"Egito",           flag:"EG", code:"EGY" },
      { nome:"Irã",             flag:"IR", code:"IRN" },
      { nome:"Nova Zelândia",   flag:"NZ", code:"NZL" },
    ]},
    { id:"H", selecoes:[
      { nome:"Espanha",         flag:"ES", code:"ESP" },
      { nome:"Cabo Verde",      flag:"CV", code:"CPV" },
      { nome:"Arábia Saudita",  flag:"SA", code:"KSA" },
      { nome:"Uruguai",         flag:"UY", code:"URU" },
    ]},
    { id:"I", selecoes:[
      { nome:"França",          flag:"FR", code:"FRA" },
      { nome:"Senegal",         flag:"SN", code:"SEN" },
      { nome:"Iraque",          flag:"IQ", code:"IRQ" },
      { nome:"Noruega",         flag:"NO", code:"NOR" },
    ]},
    { id:"J", selecoes:[
      { nome:"Argentina",       flag:"AR", code:"ARG" },
      { nome:"Argélia",         flag:"DZ", code:"ALG" },
      { nome:"Áustria",         flag:"AT", code:"AUT" },
      { nome:"Jordânia",        flag:"JO", code:"JOR" },
    ]},
    { id:"K", selecoes:[
      { nome:"Portugal",        flag:"PT", code:"POR" },
      { nome:"Congo",           flag:"CD", code:"COD" },
      { nome:"Uzbequistão",     flag:"UZ", code:"UZB" },
      { nome:"Colômbia",        flag:"CO", code:"COL" },
    ]},
    { id:"L", selecoes:[
      { nome:"Inglaterra",      flag:"GB-ENG", code:"ENG" },
      { nome:"Croácia",         flag:"HR", code:"CRO" },
      { nome:"Gana",            flag:"GH", code:"GHA" },
      { nome:"Panamá",          flag:"PA", code:"PAN" },
    ]},
  ],
};

// Gera array plano com TODAS as figurinhas
function buildAllStickers() {
  const all = [];
  const E = DATA.especiais;

  // Página inicial
  E.paginaInicial.forEach(num => all.push({ num, group:"esp", label:"Página Inicial", code:"FWC" }));

  // Seleções
  DATA.grupos.forEach(g => {
    g.selecoes.forEach(s => {
      for (let i = 1; i <= 20; i++) {
        all.push({ num:`${s.code}${i}`, group:g.id, label:s.nome, code:s.code });
      }
    });
  });

  // History
  E.history.forEach(num => all.push({ num, group:"esp", label:"WC History", code:"FWC" }));

  // Coca-Cola
  E.cocaCola.forEach(num => all.push({ num, group:"esp", label:"Coca-Cola", code:"CC" }));

  return all;
}

// Mapa num -> info
function buildStickerMap() {
  const map = {};
  buildAllStickers().forEach(s => { map[s.num] = s; });
  return map;
}

window.DATA = DATA;
window.buildAllStickers = buildAllStickers;
window.buildStickerMap  = buildStickerMap;

// ============================================================
// CROMOS — Views
// ============================================================

const Views = {

  // ═══════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════
  auth: {
    _mode: "login",

    render() {
      const el = document.getElementById("view-auth");
      el.innerHTML = `
        <div class="auth-card">
          <div class="auth-logo">
            <div class="auth-logo-mark">⚽</div>
            <h1 class="auth-logo-title">CRO<em>MOS</em></h1>
            <p class="auth-logo-sub">Álbum Copa do Mundo 2026</p>
          </div>

          <div class="auth-tabs" id="auth-tabs">
            <button class="auth-tab ${this._mode === "login" ? "active" : ""}" data-tab="login">Entrar</button>
            <button class="auth-tab ${this._mode === "cadastro" ? "active" : ""}" data-tab="cadastro">Criar conta</button>
          </div>

          <div class="auth-form" id="auth-form">
            <div id="cadastro-username-field" style="display:${this._mode === "cadastro" ? "block" : "none"}">
              <div class="field">
                <label>Username</label>
                <div class="input-icon-wrap">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input type="text" id="f-username" placeholder="seu_username" autocomplete="username" maxlength="20" />
                </div>
              </div>
            </div>

            <div class="field">
              <label>E-mail</label>
              <div class="input-icon-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <input type="email" id="f-email" placeholder="seu@email.com" autocomplete="email" />
              </div>
            </div>

            <div class="field">
              <label>Senha</label>
              <div class="input-icon-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" id="f-senha" placeholder="••••••••" autocomplete="${this._mode === "login" ? "current-password" : "new-password"}" />
              </div>
            </div>

            <div id="auth-alert" style="display:none"></div>

            <button class="btn btn-gold btn-full" id="auth-submit">
              ${this._mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </div>
        </div>
      `;

      // Tabs
      el.querySelector("#auth-tabs").addEventListener("click", e => {
        const tab = e.target.closest(".auth-tab");
        if (!tab) return;
        this._mode = tab.dataset.tab;
        this.render();
      });

      // Submit
      el.querySelector("#auth-submit").addEventListener("click", () => this._submit(el));

      // Enter key
      el.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("keydown", e => { if (e.key === "Enter") this._submit(el); });
      });
    },

    async _submit(el) {
      const btn   = el.querySelector("#auth-submit");
      const alert = el.querySelector("#auth-alert");
      const email = el.querySelector("#f-email")?.value?.trim();
      const senha = el.querySelector("#f-senha")?.value;

      alert.style.display = "none";
      btn.disabled = true;
      btn.classList.add("btn-loading");
      btn.textContent = "";

      try {
        if (this._mode === "login") {
          await Auth.login(email, senha);
        } else {
          const username = el.querySelector("#f-username")?.value || "";
          await Auth.register(email, senha, username);
        }
        // Sucesso → App.init() vai redirecionar via onAuth
      } catch (err) {
        const code = err.code || err.message;
        alert.innerHTML = `<div class="alert alert-error">${UI.errorMsg(code)}</div>`;
        alert.style.display = "block";
        btn.disabled = false;
        btn.classList.remove("btn-loading");
        btn.textContent = this._mode === "login" ? "Entrar" : "Criar conta";
      }
    },
  },

  // ═══════════════════════════════════════════
  // ÁLBUM
  // ═══════════════════════════════════════════
  album: {
    _grupo:  "todos",
    _status: "todos",
    _busca:  "",
    _bound:  false,

    render(params = {}) {
      if (params.grupo) this._grupo = params.grupo;
      const el = document.getElementById("view-album");
      el.innerHTML = this._skeleton();
      this._build(el);
      // Vincula listener de stickers apenas uma vez
      Bus.on("stickers", () => this._refresh(el));
    },

    _skeleton() {
      return `
        <div class="album-sticky" id="album-sticky">
          <div class="album-progress-row">
            <span class="album-pct" id="alb-pct">0%</span>
            <div class="progress-bar album-progress-bar"><div class="progress-fill" id="alb-bar" style="width:0%"></div></div>
          </div>
          <div class="album-chips" id="alb-chips"></div>
          <div class="album-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input class="album-search" id="alb-search" type="text" placeholder="Buscar por código (ex: BRA1)…" />
          </div>
          <div class="album-filter-scroll">
            <div class="album-filter-row" id="alb-grupos"></div>
          </div>
        </div>
        <div class="album-body" id="album-body"></div>
      `;
    },

    _build(el) {
      this._buildChips(el);
      this._buildGrupoFilter(el);
      this._refresh(el);

      // Busca
      el.querySelector("#alb-search").addEventListener("input", e => {
        this._busca = e.target.value.toLowerCase();
        this._refresh(el);
      });

      // Click nos stickers (delegação)
      el.querySelector("#album-body").addEventListener("click", async e => {
        const btn = e.target.closest(".sticker-btn");
        if (!btn || btn.disabled) return;
        const card   = btn.closest(".sticker");
        const num    = card.dataset.num;
        const action = btn.dataset.action;
        btn.disabled = true;
        try {
          await Stickers.set(App.user.uid, num, action);
        } catch(err) {
          Toast.show("Erro ao salvar", "err");
        }
        btn.disabled = false;
      });
    },

    _buildChips(el) {
      const chips = [
        { val:"todos",    label:"Todas" },
        { val:"tenho",    label:"✓ Tenho" },
        { val:"falta",    label:"✗ Faltando" },
        { val:"repetida", label:"⟳ Repetidas" },
      ];
      const wrap = el.querySelector("#alb-chips");
      wrap.innerHTML = chips.map(c =>
        `<button class="chip ${this._status === c.val ? "chip-active" : "chip-default"}" data-status="${c.val}">${c.label}</button>`
      ).join("");
      wrap.addEventListener("click", e => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        this._status = chip.dataset.status;
        wrap.querySelectorAll(".chip").forEach(c => {
          c.className = `chip ${this._status === c.dataset.status ? "chip-active" : "chip-default"}`;
        });
        this._refresh(el);
      });
    },

    _buildGrupoFilter(el) {
      const grupos = ["todos", ...DATA.grupos.map(g => g.id), "esp"];
      const labels = { todos:"Todos", esp:"Especiais" };
      const wrap = el.querySelector("#alb-grupos");
      wrap.innerHTML = grupos.map(g =>
        `<button class="chip ${this._grupo === g ? "chip-active" : "chip-default"}" data-g="${g}">${labels[g] || `Grupo ${g}`}</button>`
      ).join("");
      wrap.addEventListener("click", e => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        this._grupo = chip.dataset.g;
        wrap.querySelectorAll(".chip").forEach(c => {
          c.className = `chip ${this._grupo === c.dataset.g ? "chip-active" : "chip-default"}`;
        });
        this._refresh(el);
      });
    },

    _refresh(el) {
      if (!el.isConnected) return;
      const data  = App.stickers;
      const stats = Stickers.stats(data, DATA.meta.total);

      // Atualiza barra
      const pctEl = el.querySelector("#alb-pct");
      const barEl = el.querySelector("#alb-bar");
      if (pctEl) pctEl.textContent = `${stats.pct}%`;
      if (barEl) barEl.style.width = `${stats.pct}%`;

      // Monta seções
      const sections = this._getSections();
      let html = "";
      let total = 0;

      sections.forEach(s => {
        const figs = this._filterFigs(s.stickers, data);
        if (!figs.length) return;
        total += figs.length;
        html += `
          <div class="selecao-section">
            <div class="selecao-header">
              <div class="selecao-flag">${s.badge}</div>
              <span class="selecao-name">${s.name}</span>
              <span class="selecao-count">${figs.filter(f => (data.tenho||{})[f]).length}/${figs.length}</span>
            </div>
            <div class="stickers-grid">
              ${figs.map(num => this._stickerCard(num, data)).join("")}
            </div>
          </div>
        `;
      });

      const body = el.querySelector("#album-body");
      if (body) body.innerHTML = html || `
        <div class="empty">
          <div class="empty-icon">🔍</div>
          <p>Nenhuma figurinha encontrada com os filtros selecionados.</p>
        </div>
      `;
    },

    _getSections() {
      const secs = [];
      const gFilter = this._grupo;

      // Especiais
      if (gFilter === "todos" || gFilter === "esp") {
        secs.push({ badge:"🏆", name:"Página Inicial", stickers: DATA.especiais.paginaInicial });
      }

      // Seleções
      DATA.grupos.forEach(g => {
        if (gFilter !== "todos" && gFilter !== g.id) return;
        g.selecoes.forEach(s => {
          const nums = Array.from({length:20}, (_,i) => `${s.code}${i+1}`);
          secs.push({ badge: s.id || g.id, name: `${s.nome} · Grupo ${g.id}`, stickers: nums });
        });
      });

      // History + Coca-Cola
      if (gFilter === "todos" || gFilter === "esp") {
        secs.push({ badge:"📖", name:"FIFA WC History", stickers: DATA.especiais.history });
        secs.push({ badge:"🥤", name:"Coca-Cola", stickers: DATA.especiais.cocaCola });
      }

      return secs;
    },

    _filterFigs(nums, data) {
      return nums.filter(num => {
        const tenho    = (data.tenho    ||{})[num];
        const repetida = (data.repetidas||{})[num];
        if (this._status === "tenho"    && (!tenho || repetida)) return false;
        if (this._status === "falta"    && tenho)  return false;
        if (this._status === "repetida" && !repetida) return false;
        if (this._busca && !num.toLowerCase().includes(this._busca)) return false;
        return true;
      });
    },

    _stickerCard(num, data) {
      const tenho    = (data.tenho    ||{})[num];
      const repetida = (data.repetidas||{})[num];
      let cls = "s-falta";
      if (repetida) cls = "s-repetida";
      else if (tenho) cls = "s-tenho";

      return `
        <div class="sticker ${cls}" data-num="${num}">
          <span class="sticker-code">${num}</span>
          <div class="sticker-btns">
            <button class="sticker-btn ${cls==="s-tenho"?"active-tenho":""}" data-action="tenho" title="Tenho">✓</button>
            <button class="sticker-btn ${cls==="s-repetida"?"active-repetida":""}" data-action="repetida" title="+1">+</button>
            <button class="sticker-btn ${cls==="s-falta"?"active-falta":""}" data-action="falta" title="Falta">✗</button>
          </div>
        </div>
      `;
    },
  },

  // ═══════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════
  stats: {
    render() {
      const el   = document.getElementById("view-stats");
      const data  = App.stickers;
      const stats = Stickers.stats(data, DATA.meta.total);
      const circ  = 2 * Math.PI * 42; // r=42
      const dash  = (stats.pct / 100) * circ;

      const gruposStats = DATA.grupos.map(g => {
        const total = g.selecoes.length * 20;
        let tenho = 0;
        g.selecoes.forEach(s => {
          for (let i = 1; i <= 20; i++) {
            if ((data.tenho||{})[`${s.code}${i}`]) tenho++;
          }
        });
        return { id:g.id, tenho, total, pct: Math.round(tenho/total*100) };
      });

      el.innerHTML = `
        <div class="page-wrap">
          <div class="stats-hero">
            <div class="stats-donut">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F2B705" stroke-width="8"
                  stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"
                  stroke-linecap="round"/>
              </svg>
              <div class="stats-donut-pct">${stats.pct}%</div>
            </div>
            <div class="stats-hero-info">
              <h2>Seu Álbum</h2>
              <p>${stats.tenho} de ${DATA.meta.total} figurinhas</p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card c-green">
              <div class="stat-card-icon">✅</div>
              <div class="stat-card-val">${stats.tenho}</div>
              <div class="stat-card-lbl">Tenho</div>
            </div>
            <div class="stat-card c-red">
              <div class="stat-card-icon">🔍</div>
              <div class="stat-card-val">${stats.falta}</div>
              <div class="stat-card-lbl">Faltando</div>
            </div>
            <div class="stat-card c-blue">
              <div class="stat-card-icon">🔄</div>
              <div class="stat-card-val">${stats.repetida}</div>
              <div class="stat-card-lbl">Repetidas</div>
            </div>
          </div>

          <div class="stats-grupos-title">Progresso por grupo</div>
          ${gruposStats.map(g => `
            <div class="grupo-row" onclick="App.go('album',{grupo:'${g.id}'})">
              <div class="grupo-row-top">
                <div class="grupo-badge">${g.id}</div>
                <span class="grupo-row-name">Grupo ${g.id}</span>
                <span class="grupo-row-count">${g.tenho}/${g.total}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${g.pct}%"></div></div>
            </div>
          `).join("")}
        </div>
      `;

      Bus.on("stickers", () => this.render());
    },
  },

  // ═══════════════════════════════════════════
  // AMIGOS
  // ═══════════════════════════════════════════
  amigos: {
    _unsub: null,

    render() {
      const el = document.getElementById("view-amigos");
      el.innerHTML = `
        <div class="page-wrap">
          <h1 class="page-title">AMIGOS</h1>

          <div class="friend-search-box">
            <div class="field" style="margin:0">
              <div class="input-icon-wrap">
                <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" id="f-friend-q" placeholder="Buscar por @username…" />
              </div>
            </div>
            <button class="btn btn-gold" id="btn-buscar">Buscar</button>
          </div>
          <div id="friend-result"></div>

          <div id="pedidos-wrap"></div>
          <div id="amigos-wrap"></div>
        </div>
      `;

      this._bindSearch(el);
      this._listenProfile(el);
    },

    _bindSearch(el) {
      const doSearch = () => this._search(el);
      el.querySelector("#btn-buscar").addEventListener("click", doSearch);
      el.querySelector("#f-friend-q").addEventListener("keydown", e => {
        if (e.key === "Enter") doSearch();
      });
    },

    async _search(el) {
      const q   = el.querySelector("#f-friend-q").value.trim();
      const res = el.querySelector("#friend-result");
      if (!q) return;

      res.innerHTML = `<div class="loading-inline"><div class="spinner"></div>Buscando...</div>`;

      const found = await Friends.findByUsername(q);
      if (!found) {
        res.innerHTML = `<div class="friend-result-card not-found">Usuário "@${q}" não encontrado.</div>`;
        return;
      }
      if (found.uid === App.user.uid) {
        res.innerHTML = `<div class="friend-result-card not-found">Esse é você! 😄</div>`;
        return;
      }

      const myProfile = App.profile;
      const isFriend  = (myProfile?.friends || []).includes(found.uid);
      const sent      = (myProfile?.sentRequests || []).includes(found.uid);
      const received  = (myProfile?.friendRequests || []).includes(found.uid);

      let actionHTML = "";
      if (isFriend) {
        actionHTML = `<span class="badge badge-green">✓ Amigos</span>`;
      } else if (received) {
        actionHTML = `
          <button class="btn btn-gold btn-sm" data-accept="${found.uid}">Aceitar</button>
          <button class="btn btn-outline btn-sm" data-decline="${found.uid}">Recusar</button>
        `;
      } else if (sent) {
        actionHTML = `<button class="btn btn-outline btn-sm" data-cancel="${found.uid}">Cancelar pedido</button>`;
      } else {
        actionHTML = `<button class="btn btn-gold btn-sm" data-add="${found.uid}">Adicionar</button>`;
      }

      const color = UI.avatarColor(found.username);
      res.innerHTML = `
        <div class="friend-result-card">
          <div class="avatar avatar-md ${color}">${found.displayName?.[0]?.toUpperCase() || "?"}</div>
          <div class="friend-info">
            <strong>${found.displayName}</strong>
            <span>@${found.username}</span>
          </div>
          <div class="friend-actions">${actionHTML}</div>
        </div>
      `;

      // Bind action buttons in result
      res.querySelector("[data-add]")?.addEventListener("click", async btn => {
        btn.target.disabled = true;
        await Friends.sendRequest(App.user.uid, found.uid);
        Toast.show("Pedido enviado!");
        this._search(el);
      });
      res.querySelector("[data-cancel]")?.addEventListener("click", async btn => {
        btn.target.disabled = true;
        await Friends.cancelRequest(App.user.uid, found.uid);
        Toast.show("Pedido cancelado.");
        this._search(el);
      });
      res.querySelector("[data-accept]")?.addEventListener("click", async btn => {
        btn.target.disabled = true;
        await Friends.acceptRequest(App.user.uid, found.uid);
        Toast.show("Amizade aceita! 🎉");
        this._search(el);
      });
      res.querySelector("[data-decline]")?.addEventListener("click", async btn => {
        btn.target.disabled = true;
        await Friends.declineRequest(App.user.uid, found.uid);
        Toast.show("Pedido recusado.");
        this._search(el);
      });
    },

    _listenProfile(el) {
      // Re-renderiza listas quando perfil muda em tempo real
      Bus.on("profile", () => {
        if (!el.isConnected) { Bus.off("profile"); return; }
        this._renderPedidos(el);
        this._renderAmigos(el);
      });
      this._renderPedidos(el);
      this._renderAmigos(el);
    },

    async _renderPedidos(el) {
      const wrap   = el.querySelector("#pedidos-wrap");
      if (!wrap) return;
      const pedidos = App.profile?.friendRequests || [];
      if (!pedidos.length) { wrap.innerHTML = ""; return; }

      const users = await Friends.getMany(pedidos);
      wrap.innerHTML = `
        <div class="subsection">
          <div class="subsection-title">Pedidos recebidos <span class="count">${users.length}</span></div>
          ${users.map(u => {
            const color = UI.avatarColor(u.username);
            return `
              <div class="friend-item">
                <div class="avatar avatar-md ${color}">${u.displayName?.[0]?.toUpperCase() || "?"}</div>
                <div class="friend-info">
                  <strong>${u.displayName}</strong>
                  <span>@${u.username}</span>
                </div>
                <div class="friend-actions">
                  <button class="btn btn-gold btn-sm" data-accept="${u.uid}">Aceitar</button>
                  <button class="btn btn-ghost btn-sm" data-decline="${u.uid}">✕</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;

      wrap.querySelectorAll("[data-accept]").forEach(btn => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          await Friends.acceptRequest(App.user.uid, btn.dataset.accept);
          Toast.show("Amizade aceita! 🎉");
        });
      });
      wrap.querySelectorAll("[data-decline]").forEach(btn => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          await Friends.declineRequest(App.user.uid, btn.dataset.decline);
          Toast.show("Pedido recusado.");
        });
      });
    },

    async _renderAmigos(el) {
      const wrap = el.querySelector("#amigos-wrap");
      if (!wrap) return;
      const amigoUids = App.profile?.friends || [];

      if (!amigoUids.length) {
        wrap.innerHTML = `
          <div class="empty">
            <div class="empty-icon">👥</div>
            <p>Você ainda não tem amigos.<br>Busque pelo @username para adicionar.</p>
          </div>
        `;
        return;
      }

      wrap.innerHTML = `<div class="loading-inline"><div class="spinner"></div>Carregando...</div>`;
      const amigos = await Friends.getMany(amigoUids);

      wrap.innerHTML = `
        <div class="subsection">
          <div class="subsection-title">Meus amigos <span class="count">${amigos.length}</span></div>
          ${amigos.map(a => {
            const color = UI.avatarColor(a.username);
            return `
              <div class="friend-item">
                <div class="avatar avatar-md ${color}">${a.displayName?.[0]?.toUpperCase() || "?"}</div>
                <div class="friend-info">
                  <strong>${a.displayName}</strong>
                  <span>@${a.username}</span>
                </div>
                <div class="friend-actions">
                  <button class="btn btn-outline btn-sm" data-trocas="${a.uid}" data-name="${a.displayName}">Trocas</button>
                  <button class="btn btn-ghost btn-sm" data-remove="${a.uid}" title="Remover">✕</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;

      wrap.querySelectorAll("[data-trocas]").forEach(btn => {
        btn.addEventListener("click", () => {
          App.go("trocas", { uid: btn.dataset.trocas, name: btn.dataset.name });
        });
      });
      wrap.querySelectorAll("[data-remove]").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Remover esse amigo?")) return;
          btn.disabled = true;
          await Friends.remove(App.user.uid, btn.dataset.remove);
          Toast.show("Amigo removido.");
        });
      });
    },
  },

  // ═══════════════════════════════════════════
  // TROCAS
  // ═══════════════════════════════════════════
  trocas: {
    async render(params = {}) {
      const el   = document.getElementById("view-trocas");
      const { uid, name } = params;

      el.innerHTML = `
        <div class="page-wrap">
          <div class="trocas-header">
            <button class="btn btn-ghost btn-icon" onclick="App.go('amigos')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 class="page-title" style="margin:0">TROCAS <em>@${name || "amigo"}</em></h1>
          </div>
          <div id="trocas-body"><div class="loading-inline"><div class="spinner"></div>Calculando...</div></div>
        </div>
      `;

      if (!uid) return;

      const [minhaData, amigoData] = await Promise.all([
        Promise.resolve(App.stickers),
        Stickers.get(uid),
      ]);

      const { amigoOferece, euOfereco } = Friends.calcTrocas(minhaData, amigoData);

      el.querySelector("#trocas-body").innerHTML = `
        <div class="trocas-summary">
          <div class="troca-card">
            <div class="troca-card-icon">🎁</div>
            <div class="troca-card-num">${amigoOferece.length}</div>
            <div class="troca-card-lbl">@${name} pode te dar</div>
          </div>
          <div class="troca-card">
            <div class="troca-card-icon">🔄</div>
            <div class="troca-card-num">${euOfereco.length}</div>
            <div class="troca-card-lbl">Você pode oferecer</div>
          </div>
        </div>

        <div class="trocas-section">
          <h3>🎁 @${name} tem de repetida e você precisa (${amigoOferece.length})</h3>
          ${amigoOferece.length
            ? `<div class="trocas-chips">${amigoOferece.map(n => `<span class="troca-chip c-green">${n}</span>`).join("")}</div>`
            : `<p style="color:var(--t3);font-size:13px;font-weight:600">Nenhuma troca possível no momento.</p>`
          }
        </div>

        <div class="trocas-section">
          <h3>🔄 Suas repetidas para oferecer (${euOfereco.length})</h3>
          ${euOfereco.length
            ? `<div class="trocas-chips">${euOfereco.map(n => `<span class="troca-chip c-blue">${n}</span>`).join("")}</div>`
            : `<p style="color:var(--t3);font-size:13px;font-weight:600">Você não tem repetidas ainda.</p>`
          }
        </div>
      `;
    },
  },

  // ═══════════════════════════════════════════
  // PERFIL
  // ═══════════════════════════════════════════
  perfil: {
    render() {
      const el    = document.getElementById("view-perfil");
      const p     = App.profile;
      const stats = Stickers.stats(App.stickers, DATA.meta.total);
      const color = UI.avatarColor(p?.username);

      el.innerHTML = `
        <div class="page-wrap">
          <div class="perfil-hero">
            <div class="perfil-avatar">${p?.displayName?.[0]?.toUpperCase() || "?"}</div>
            <div class="perfil-name">${p?.displayName || "—"}</div>
            <div class="perfil-user">@${p?.username || "—"}</div>
          </div>

          <div class="perfil-stats">
            <div class="ps-item">
              <div class="ps-val">${stats.tenho}</div>
              <div class="ps-lbl">Figurinhas</div>
            </div>
            <div class="ps-item">
              <div class="ps-val">${stats.pct}%</div>
              <div class="ps-lbl">Completo</div>
            </div>
            <div class="ps-item">
              <div class="ps-val">${(p?.friends || []).length}</div>
              <div class="ps-lbl">Amigos</div>
            </div>
          </div>

          <div class="code-block">
            <p>Seu @username para adicionar amigos:</p>
            <div class="code-value" id="code-val">@${p?.username || "—"}</div>
            <button class="btn btn-outline" id="btn-copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copiar username
            </button>
          </div>

          <button class="btn btn-danger btn-full" id="btn-logout">Sair da conta</button>
        </div>
      `;

      el.querySelector("#btn-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(`@${p?.username}`).then(() => Toast.show("Username copiado!"));
      });

      el.querySelector("#btn-logout").addEventListener("click", async () => {
        await Auth.logout();
      });

      Bus.on("stickers", () => this.render());
      Bus.on("profile",  () => this.render());
    },
  },
};

window.Views = Views;

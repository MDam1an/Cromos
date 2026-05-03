// ============================================================
// CROMOS — App Controller
// ============================================================

// ── EventBus (único por evento, sem acúmulo) ──
const Bus = (() => {
  const map = {};
  return {
    on(ev, cb)   { map[ev] = cb; },        // sobrescreve, sem acúmulo
    off(ev)      { delete map[ev]; },
    emit(ev, d)  { map[ev]?.(d); },
  };
})();

// ── Toast ──
const Toast = {
  show(msg, type = "ok") {
    let c = document.getElementById("toast-container");
    if (!c) { c = document.createElement("div"); c.id = "toast-container"; document.body.appendChild(c); }
    const t = document.createElement("div");
    t.className = `toast t-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add("show")); });
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, 2800);
  },
};

// ── App State ──
const App = {
  user:        null,   // Firebase user
  profile:     null,   // Firestore user doc
  stickers:    { tenho:{}, repetidas:{} },
  _unsubs:     [],
  view:        null,

  init() {
    Auth.onAuth(async fbUser => {
      // Limpa listeners anteriores
      this._unsubs.forEach(fn => fn());
      this._unsubs = [];

      if (fbUser) {
        this.user = fbUser;
        // Listeners em tempo real
        this._unsubs.push(
          Stickers.listen(fbUser.uid, data => {
            this.stickers = data;
            Bus.emit("stickers", data);
          }),
          Friends.listenUser(fbUser.uid, data => {
            this.profile = data;
            Bus.emit("profile", data);
            this._updateHeaderUsername(data);
          })
        );
        UI.showApp();
        this.go("album");
      } else {
        this.user = null;
        this.profile = null;
        this.stickers = { tenho:{}, repetidas:{} };
        UI.showAuth();
        Views.auth.render();
      }
    });
  },

  go(view, params = {}) {
    if (this.view === view && !params.force) {
      // Re-render sem animação se for mesma view
    }
    this.view = view;

    // Esconde todas as views
    document.querySelectorAll(".view").forEach(v => {
      v.classList.remove("active");
    });

    // Ativa a view correta
    const el = document.getElementById(`view-${view}`);
    if (el) {
      el.classList.add("active");
      // Reseta scroll
      el.scrollTop = 0;
    }

    // Nav ativo
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    const nb = document.querySelector(`.nav-btn[data-view="${view}"]`);
    if (nb) nb.classList.add("active");

    // Renderiza
    switch (view) {
      case "album":  Views.album.render(params);  break;
      case "stats":  Views.stats.render();         break;
      case "amigos": Views.amigos.render();         break;
      case "perfil": Views.perfil.render();         break;
      case "trocas": Views.trocas.render(params);   break;
    }
  },

  _updateHeaderUsername(profile) {
    const el = document.getElementById("hdr-username");
    const av = document.getElementById("hdr-avatar");
    if (el && profile) el.textContent = `@${profile.username}`;
    if (av && profile) av.textContent = profile.displayName?.[0]?.toUpperCase() || "U";
  },
};

// ── UI helpers ──
const UI = {
  showApp() {
    document.getElementById("view-auth").classList.remove("active");
    document.getElementById("bottom-nav").classList.add("visible");
    document.getElementById("hdr-user").style.display = "flex";
  },
  showAuth() {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-auth").classList.add("active");
    document.getElementById("bottom-nav").classList.remove("visible");
    document.getElementById("hdr-user").style.display = "none";
  },
  // Cor de avatar baseada no username
  avatarColor(username) {
    const colors = ["avatar-gold","avatar-blue","avatar-green","avatar-red"];
    let h = 0;
    for (const c of (username || "")) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
  },
  // Parseia erros Firebase
  errorMsg(code) {
    const map = {
      "auth/user-not-found":       "E-mail não encontrado.",
      "auth/wrong-password":       "Senha incorreta.",
      "auth/email-already-in-use": "E-mail já cadastrado.",
      "auth/weak-password":        "Senha muito fraca (mín. 6 caracteres).",
      "auth/invalid-email":        "E-mail inválido.",
      "auth/too-many-requests":    "Muitas tentativas. Aguarde um momento.",
      "auth/invalid-credential":   "E-mail ou senha incorretos.",
      "username/taken":            "Nome de usuário já está em uso.",
      "username/short":            "Username precisa ter pelo menos 3 caracteres.",
      "username/long":             "Username pode ter no máximo 20 caracteres.",
    };
    return map[code] || "Ocorreu um erro. Tente novamente.";
  },
};

window.Bus   = Bus;
window.Toast = Toast;
window.App   = App;
window.UI    = UI;

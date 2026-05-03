// ============================================================
// CROMOS — Firebase Services
// Auth + Firestore: usuários, figurinhas, amigos
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyDQiYsEFTnqGTHvlcC6nmNqB1XRYG5jG8Y",
  authDomain:        "copa2026-tracker.firebaseapp.com",
  projectId:         "copa2026-tracker",
  storageBucket:     "copa2026-tracker.firebasestorage.app",
  messagingSenderId: "615425024576",
  appId:             "1:615425024576:web:69add9e1dd8f3a5e9c35a5",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ──────────────────────────────────────────
// AUTH SERVICE
// ──────────────────────────────────────────
const Auth = {
  async login(email, senha) {
    return auth.signInWithEmailAndPassword(email, senha);
  },

  async register(email, senha, username) {
    // Valida username
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 3) throw { code: "username/short" };
    if (clean.length > 20) throw { code: "username/long" };

    // Verifica disponibilidade ANTES de criar conta
    const exists = await db.collection("usernames").doc(clean).get();
    if (exists.exists) throw { code: "username/taken" };

    const cred = await auth.createUserWithEmailAndPassword(email, senha);
    const uid  = cred.user.uid;

    const batch = db.batch();
    batch.set(db.collection("users").doc(uid), {
      uid,
      username:    clean,
      displayName: username.trim(),
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
      friends:     [],
      sentRequests: [],
      friendRequests: [],
    });
    batch.set(db.collection("usernames").doc(clean), { uid });
    await batch.commit();

    return cred;
  },

  async logout() { return auth.signOut(); },
  onAuth(cb) { return auth.onAuthStateChanged(cb); },
  get current() { return auth.currentUser; },
};

// ──────────────────────────────────────────
// STICKER SERVICE
// ──────────────────────────────────────────
const Stickers = {
  _ref(uid) { return db.collection("stickers").doc(uid); },

  async get(uid) {
    const snap = await this._ref(uid).get();
    return snap.exists ? snap.data() : { tenho: {}, repetidas: {} };
  },

  // status: 'tenho' | 'repetida' | 'falta'
  async set(uid, num, status) {
    const ref = this._ref(uid);
    const upd = {};
    if (status === "tenho") {
      upd[`tenho.${num}`]     = true;
      upd[`repetidas.${num}`] = firebase.firestore.FieldValue.delete();
    } else if (status === "repetida") {
      upd[`tenho.${num}`]     = true;
      upd[`repetidas.${num}`] = true;
    } else {
      upd[`tenho.${num}`]     = firebase.firestore.FieldValue.delete();
      upd[`repetidas.${num}`] = firebase.firestore.FieldValue.delete();
    }
    return ref.set(upd, { merge: true });
  },

  listen(uid, cb) {
    return this._ref(uid).onSnapshot(snap => {
      cb(snap.exists ? snap.data() : { tenho: {}, repetidas: {} });
    });
  },

  stats(data, total) {
    const tenho    = Object.keys(data.tenho    || {}).length;
    const repetida = Object.keys(data.repetidas || {}).length;
    const falta    = total - tenho;
    return { tenho, repetida, falta, pct: Math.round(tenho / total * 100) };
  },
};

// ──────────────────────────────────────────
// FRIENDS SERVICE
// ──────────────────────────────────────────
const Friends = {
  _userRef(uid) { return db.collection("users").doc(uid); },

  // Retorna { uid, username, displayName, friends, sentRequests, friendRequests }
  async getUser(uid) {
    const snap = await this._userRef(uid).get();
    return snap.exists ? { uid, ...snap.data() } : null;
  },

  listenUser(uid, cb) {
    return this._userRef(uid).onSnapshot(snap => {
      cb(snap.exists ? { uid, ...snap.data() } : null);
    });
  },

  async findByUsername(username) {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return null;
    const snap = await db.collection("usernames").doc(clean).get();
    if (!snap.exists) return null;
    return this.getUser(snap.data().uid);
  },

  async getMany(uids) {
    if (!uids?.length) return [];
    const snaps = await Promise.all(uids.map(uid => this._userRef(uid).get()));
    return snaps.filter(s => s.exists).map(s => ({ uid: s.id, ...s.data() }));
  },

  // Envia pedido de amizade
  async sendRequest(myUid, targetUid) {
    const batch = db.batch();
    // targetUid recebe o pedido
    batch.update(this._userRef(targetUid), {
      friendRequests: firebase.firestore.FieldValue.arrayUnion(myUid),
    });
    // eu marco como enviado (para poder mostrar "pedido enviado")
    batch.update(this._userRef(myUid), {
      sentRequests: firebase.firestore.FieldValue.arrayUnion(targetUid),
    });
    return batch.commit();
  },

  // Aceita pedido
  async acceptRequest(myUid, senderUid) {
    const batch = db.batch();
    batch.update(this._userRef(myUid), {
      friends:        firebase.firestore.FieldValue.arrayUnion(senderUid),
      friendRequests: firebase.firestore.FieldValue.arrayRemove(senderUid),
    });
    batch.update(this._userRef(senderUid), {
      friends:      firebase.firestore.FieldValue.arrayUnion(myUid),
      sentRequests: firebase.firestore.FieldValue.arrayRemove(myUid),
    });
    return batch.commit();
  },

  // Recusa pedido
  async declineRequest(myUid, senderUid) {
    const batch = db.batch();
    batch.update(this._userRef(myUid), {
      friendRequests: firebase.firestore.FieldValue.arrayRemove(senderUid),
    });
    batch.update(this._userRef(senderUid), {
      sentRequests: firebase.firestore.FieldValue.arrayRemove(myUid),
    });
    return batch.commit();
  },

  // Cancela pedido enviado
  async cancelRequest(myUid, targetUid) {
    const batch = db.batch();
    batch.update(this._userRef(myUid), {
      sentRequests: firebase.firestore.FieldValue.arrayRemove(targetUid),
    });
    batch.update(this._userRef(targetUid), {
      friendRequests: firebase.firestore.FieldValue.arrayRemove(myUid),
    });
    return batch.commit();
  },

  // Remove amigo
  async remove(myUid, friendUid) {
    const batch = db.batch();
    batch.update(this._userRef(myUid),    { friends: firebase.firestore.FieldValue.arrayRemove(friendUid) });
    batch.update(this._userRef(friendUid),{ friends: firebase.firestore.FieldValue.arrayRemove(myUid) });
    return batch.commit();
  },

  // Calcula trocas possíveis
  calcTrocas(minhaData, amigoData) {
    const meusFaltando  = new Set(
      buildAllStickers().map(s => s.num).filter(n => !(minhaData.tenho||{})[n])
    );
    const amigoRepetidas = Object.keys(amigoData.repetidas || {});
    const euOfereco      = Object.keys(minhaData.repetidas  || {});
    return {
      amigoOferece: amigoRepetidas.filter(n => meusFaltando.has(n)),
      euOfereco,
    };
  },
};

window.Auth     = Auth;
window.Stickers = Stickers;
window.Friends  = Friends;
window.db       = db;

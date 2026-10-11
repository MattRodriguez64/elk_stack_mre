/* Miam&Go — logique commune : données, panier, appels "API" statiques. */
const Shop = (() => {
  const CART_KEY = 'miamgo_panier';
  const ORDER_KEY = 'miamgo_derniere_commande';
  const SERVICE_FEE = 0.99;
  let restaurantsPromise = null;

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
  };

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
      return r.json();
    });
  }

  function restaurants() {
    if (!restaurantsPromise) restaurantsPromise = fetchJson('/data/restaurants.json').then(d => d.restaurants);
    return restaurantsPromise;
  }

  function restaurant(id) {
    return restaurants().then(list => {
      const r = list.find(x => x.id === id);
      if (!r) throw new Error('Restaurant inconnu : ' + id);
      return r;
    });
  }

  // Menu commun à tous les établissements de la chaîne.
  function menu() {
    return fetchJson('/data/menu.json').then(d => d.plats);
  }

  // Identifiant de session (un par onglet), ajouté à chaque appel "API".
  // Métriques : visiteurs uniques et taux de conversion par session (params.sid).
  const SID = (() => {
    try {
      let sid = sessionStorage.getItem('miamgo_sid');
      if (!sid) {
        sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('miamgo_sid', sid);
      }
      return sid;
    } catch (e) { return 'anonyme'; }
  })();

  // Chaque action utilisateur déclenche un GET vers un fichier JSON statique :
  // nginx le journalise avec ses paramètres, c'est ce qu'on analyse dans Kibana.
  function api(path, params, options) {
    const qs = new URLSearchParams(Object.assign({ sid: SID }, params)).toString();
    return fetch('/api/' + path + '?' + qs, Object.assign({ cache: 'no-store' }, options));
  }

  // Temps passé sur la page, envoyé une fois quand l'utilisateur la quitte.
  // Métriques : durée moyenne par page (params.page, params.duree en secondes).
  const pageStart = Date.now();
  let pageTimeSent = false;
  function sendPageTime() {
    if (pageTimeSent) return;
    pageTimeSent = true;
    api('tracking/page.json', {
      page: location.pathname === '/' ? '/index.html' : location.pathname,
      duree: Math.round((Date.now() - pageStart) / 1000),
    }, { keepalive: true });
  }
  window.addEventListener('pagehide', sendPageTime);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendPageTime();
  });

  function emptyCart() { return { resto: null, items: {}, promo: null }; }
  function cart() { return store.get(CART_KEY, emptyCart()); }
  function saveCart(c) { store.set(CART_KEY, c); updateBadge(); }
  function count(c) { return Object.values(c.items).reduce((a, b) => a + b, 0); }

  function clearCart(raison) {
    const c = cart();
    if (count(c) > 0) api('panier/vider.json', { resto: c.resto, articles: count(c), raison });
    saveCart(emptyCart());
  }

  function add(resto, plat) {
    let c = cart();
    if (c.resto && c.resto !== resto.id && count(c) > 0) {
      if (!confirm('Votre panier contient des plats d\'un autre établissement. Le vider pour commander chez ' + resto.nom + ' ?')) return false;
      clearCart('changement_restaurant');
      c = cart();
    }
    c.resto = resto.id;
    c.items[plat.id] = (c.items[plat.id] || 0) + 1;
    saveCart(c);
    // Métriques : plats préférés par établissement / ville / pays.
    api('panier/ajout.json', { resto: resto.id, ville: resto.ville, pays: resto.pays, plat: plat.id, prix: plat.prix, qte: c.items[plat.id] });
    return true;
  }

  function remove(platId) {
    const c = cart();
    if (!c.items[platId]) return;
    const resto = c.resto;
    const qte = c.items[platId] - 1;
    if (qte > 0) c.items[platId] = qte; else delete c.items[platId];
    if (count(c) === 0) { c.resto = null; c.promo = null; }
    saveCart(c);
    api('panier/retrait.json', { resto, plat: platId, qte });
  }

  function setPromo(promo) { const c = cart(); c.promo = promo; saveCart(c); }

  function round(n) { return Math.round(n * 100) / 100; }

  function totals(c, resto, plats, pourboire) {
    const lignes = Object.entries(c.items).map(([id, qte]) => {
      const plat = plats.find(p => p.id === id);
      return plat ? { plat, qte, total: plat.prix * qte } : null;
    }).filter(Boolean);
    const sousTotal = lignes.reduce((s, l) => s + l.total, 0);
    let frais = resto.frais;
    let remise = 0;
    const promoOk = !!c.promo && sousTotal >= (c.promo.minimum || 0);
    if (promoOk) {
      if (c.promo.type === 'pourcentage') remise = sousTotal * c.promo.valeur / 100;
      else if (c.promo.type === 'montant') remise = Math.min(c.promo.valeur, sousTotal);
      else if (c.promo.type === 'livraison') frais = 0;
    }
    const tip = pourboire || 0;
    return {
      lignes, sousTotal, frais, remise, promoOk, pourboire: tip,
      service: SERVICE_FEE,
      total: round(sousTotal - remise + frais + SERVICE_FEE + tip),
      minimumAtteint: sousTotal >= resto.minimum,
    };
  }

  function totalsHtml(t, c) {
    const rows = [
      ['Sous-total', euro(t.sousTotal)],
      ['Frais de livraison', t.frais === 0 ? 'Offerts' : euro(t.frais)],
      ['Frais de service', euro(t.service)],
    ];
    if (t.remise > 0) rows.push(['Code ' + esc(c.promo.code), '− ' + euro(t.remise)]);
    if (t.pourboire > 0) rows.push(['Pourboire livreur', euro(t.pourboire)]);
    return '<dl class="totals">' +
      rows.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('') +
      '<div class="grand"><dt>Total</dt><dd>' + euro(t.total) + '</dd></div></dl>';
  }

  function lastOrder() { return store.get(ORDER_KEY, null); }
  function saveLastOrder(o) { store.set(ORDER_KEY, o); }

  function euro(n) { return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function param(name) { return new URLSearchParams(location.search).get(name) || ''; }

  function updateBadge() {
    const n = count(cart());
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  document.addEventListener('DOMContentLoaded', updateBadge);
  window.addEventListener('storage', updateBadge);

  return {
    restaurants, restaurant, menu, api,
    cart, count, add, remove, clearCart, setPromo, totals, totalsHtml,
    lastOrder, saveLastOrder, euro, esc, param,
  };
})();

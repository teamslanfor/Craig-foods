/* Craig Foods / Slemish Bakery – scripted chat assistant (no AI service, no dependencies). */
(function () {
  'use strict';
  const S = window.SITE || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = `
  .lt-btn{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:10px;padding:8px 20px 8px 8px;border:0;border-radius:999px;background:#451b41;color:#fff;font:800 .95rem 'Fraunces',Georgia,serif;cursor:pointer;box-shadow:0 14px 30px -12px rgba(46,16,41,.6);transition:transform .35s cubic-bezier(.22,.7,.2,1),box-shadow .35s}
  .lt-btn:hover{transform:translateY(-3px);box-shadow:0 18px 34px -12px rgba(46,16,41,.7)}
  .lt-btn i{width:40px;height:40px;border-radius:50%;background:#f6ead9;display:grid;place-items:center;font-style:normal;font-size:1.3rem}
  .lt-panel{position:fixed;right:18px;bottom:90px;z-index:71;width:min(370px,calc(100vw - 36px));height:min(540px,calc(100vh - 120px));background:#fff;border-radius:24px;box-shadow:0 30px 70px -24px rgba(43,27,46,.55);display:flex;flex-direction:column;overflow:hidden;transform:translateY(16px) scale(.97);opacity:0;pointer-events:none;transition:all .35s cubic-bezier(.22,.7,.2,1)}
  .lt-panel.open{transform:none;opacity:1;pointer-events:auto}
  .lt-head{background:#451b41;color:#fff;padding:15px 18px;display:flex;align-items:center;gap:12px}
  .lt-head b{display:block;font:800 1.15rem 'Fraunces',Georgia,serif}
  .lt-head small{color:#e6d4e0;font-size:.78rem}
  .lt-head .x{margin-left:auto;background:rgba(255,255,255,.15);border:0;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:1rem}
  .lt-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fbf5ec}
  .lt-m{max-width:86%;padding:10px 14px;border-radius:18px;font-size:.93rem;line-height:1.5;white-space:pre-line;animation:ltIn .35s ease both}
  .lt-m a{color:#451b41;font-weight:800}
  .lt-bot{background:#fff;border:1px solid #e9dccb;border-bottom-left-radius:5px;color:#3b3040}
  .lt-me{align-self:flex-end;background:#451b41;color:#fff;border-bottom-right-radius:5px}
  .lt-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;background:#fbf5ec}
  .lt-chips button{border:2px solid #451b41;background:#fff;color:#451b41;border-radius:999px;padding:5px 12px;font:700 .82rem 'DM Sans',system-ui,sans-serif;cursor:pointer;transition:all .25s}
  .lt-chips button:hover{background:#451b41;color:#f6ead9}
  .lt-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e9dccb;background:#fff}
  .lt-form input{flex:1;min-width:0;border:2px solid #e9dccb;border-radius:14px;padding:10px 14px;font:inherit;font-size:.94rem}
  .lt-form input:focus{outline:none;border-color:#451b41}
  .lt-form button{width:44px;height:44px;border-radius:14px;border:0;background:#451b41;color:#fff;cursor:pointer;display:grid;place-items:center}
  .lt-form svg{width:18px;height:18px}
  .lt-typing{display:inline-flex;gap:4px}.lt-typing span{width:6px;height:6px;border-radius:50%;background:#c9b8cc;animation:ltDot 1s infinite}.lt-typing span:nth-child(2){animation-delay:.15s}.lt-typing span:nth-child(3){animation-delay:.3s}
  @keyframes ltIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes ltDot{0%,80%,100%{opacity:.3}40%{opacity:1}}
  @media (max-width:640px){.lt-btn span{display:none}.lt-btn{padding:6px;bottom:88px;right:14px}.lt-panel{bottom:150px;right:14px;height:min(500px,calc(100vh - 180px))}}
  @media (prefers-reduced-motion:reduce){.lt-m,.lt-panel{animation:none;transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const sendI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
  const root = document.createElement('div');
  root.innerHTML = `
  <button class="lt-btn" aria-expanded="false" aria-controls="lt-panel"><i aria-hidden="true">🥮</i><span>Ask Craig Foods</span></button>
  <section class="lt-panel" id="lt-panel" role="dialog" aria-label="Chat with Craig Foods">
    <div class="lt-head"><div><b>Craig Foods</b><small>Automated assistant · set answers</small></div><button class="x" aria-label="Close chat">✕</button></div>
    <div class="lt-body" aria-live="polite"></div>
    <div class="lt-chips"></div>
    <form class="lt-form"><label class="sr-only" for="lt-in">Type your message</label><input id="lt-in" autocomplete="off" placeholder="Ask about our range or a trade account…" maxlength="300"><button aria-label="Send">${sendI}</button></form>
  </section>`;
  document.body.appendChild(root);
  const btn = root.querySelector('.lt-btn'), panel = root.querySelector('.lt-panel'), body = root.querySelector('.lt-body'),
    chipBox = root.querySelector('.lt-chips'), form = root.querySelector('.lt-form'), input = root.querySelector('#lt-in');
  let started = false, busy = false;
  const add = (h, who = 'bot') => { const m = document.createElement('div'); m.className = 'lt-m lt-' + who; m.innerHTML = h; body.appendChild(m); body.scrollTop = body.scrollHeight; return m; };
  const say = (h, w = 420) => new Promise((r) => { const tp = add('<span class="lt-typing"><span></span><span></span><span></span></span>'); setTimeout(() => { tp.innerHTML = h; body.scrollTop = body.scrollHeight; r(); }, w); });
  const chips = (l) => { chipBox.innerHTML = ''; l.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => handle(c); chipBox.appendChild(b); }); };
  const MAIN = ['Our range', 'Our favourites', 'Open a trade account', 'Where to buy', 'Contact'];
  const tel = () => `<a href="${S.phoneHref}">${S.phone}</a>`;
  const contact = () => `📞 ${tel()}\n✉️ <a href="mailto:${S.email}">${esc(S.email)}</a>\n📍 ${esc(S.address)}`;
  const intents = [
    { re: /where.*(buy|find|get)|\bbuy\b|stockist|which shops|in shops|supermarket|nisa|costcutter|dunnes|applegreen|musgrave|henderson|spar|centra|mace|eurospar/i, run: () => say(`You’ll find our bakes through Musgrave, Costcutter, Hendersons, NISA, Russells, Dunnes, Savage &amp; Whitten and Applegreen. Ask your local shop to stock us!`).then(() => chips(MAIN)) },
    { re: /trade|account|wholesale|stock|supply|supplier|retailer|shop owner|forecourt|cafe|café|order/i, run: () => say(`We supply shops, forecourts, cafés and wholesalers. Fill in the <a href="trade.html#apply">trade account form</a> with your business details and the team will be in touch, or call ${tel()}.`).then(() => chips(['Our range', 'Delivery areas', 'Contact'])) },
    { re: /deliver|van|area|route|minimum|min order/i, run: () => say(`Delivery days, areas and minimum orders depend on where you are. Send a <a href="trade.html#apply">trade enquiry</a> or call ${tel()} and we’ll talk you through it.`).then(() => chips(MAIN)) },
    { re: /price|cost|how much|list|catalogue|catalog|£/i, run: () => say(`Trade prices and our current product list are available to trade customers. Ask for them on the <a href="trade.html#apply">trade enquiry form</a> or call ${tel()}.`).then(() => chips(MAIN)) },
    { re: /favou?rite|fifteen|diamond|jam roll|classic|popular|best/i, run: () => say(`Our firm favourites are the Northern Irish classics: <strong>Iced Diamonds</strong>, <strong>Jam Rolls</strong> and <strong>Fifteens</strong>. <a href="index.html#favourites">Take a look</a>`).then(() => chips(['Our range', 'Where to buy'])) },
    { re: /range|product|cake|bun|muffin|pastr|biscuit|bread|traybake|what do you (make|sell)/i, run: () => say(`We bake cakes, buns, muffins, pastries, biscuits, breads and traybakes. <a href="range.html">See the range</a>`).then(() => chips(['Our favourites', 'Open a trade account'])) },
    { re: /allerg|gluten|nut|egg|dairy|milk|vegan|halal|ingredient|label/i, run: () => say(`Allergen and ingredient information is printed on every pack. For product specifications, call ${tel()} or <a href="contact.html">send us a message</a>.`).then(() => chips(MAIN)) },
    { re: /histor|since|1969|story|about|who are|family|kerr|slemish|brand/i, run: () => say(`We’ve been baking “a wee taste of home” since 1969. Craig Foods trades as Slemish Bakery, and our sister bakery RJ Kerr’s is part of the Craig Foods family. <a href="about.html">Our story</a>`).then(() => chips(MAIN)) },
    { re: /where are you|location|address|direction|randalstown|antrim|visit|collect/i, run: () => say(`📍 ${esc(S.address)}\n<a href="contact.html#visit">Map & directions</a>`).then(() => chips(MAIN)) },
    { re: /job|career|work for|vacanc|hiring/i, run: () => say(`For jobs, please call ${tel()} or <a href="contact.html">send us a message</a>.`).then(() => chips(MAIN)) },
    { re: /contact|phone|call|number|email|talk|speak/i, run: () => say(`You can reach us here:\n${contact()}`).then(() => chips(MAIN)) },
    { re: /^(hi|hello|hey|hiya|well|good (morning|afternoon|evening))\b/i, run: () => say('Hello there! What can we help you with?').then(() => chips(MAIN)) },
    { re: /thank|cheers|great|perfect|class/i, run: () => say('No bother at all! 😊').then(() => chips(MAIN)) },
  ];
  async function handle(text) {
    if (busy || !text.trim()) return;
    busy = true; add(esc(text), 'me');
    try {
      const map = { 'Our range': 'range', 'Open a trade account': 'trade account', 'Where to buy': 'where buy', 'Our favourites': 'favourites', 'Contact': 'contact', 'Allergens': 'allergen', 'Delivery areas': 'delivery' };
      const q = map[text] || text, hit = intents.find((i) => i.re.test(q));
      if (hit) { await hit.run(); return; }
      await say(`I don’t have a set answer for that one, but our team can help:\n${contact()}`); chips(MAIN);
    } finally { busy = false; }
  }
  const open = async (s) => {
    panel.classList.toggle('open', s); btn.setAttribute('aria-expanded', String(s));
    if (s) { input.focus(); if (!started) { started = true; await say('Hello and welcome to <strong>Craig Foods</strong>, home of Slemish Bakery! 👋 Ask me about our range, where to buy, or opening a trade account.', 300); chips(MAIN); } }
  };
  btn.addEventListener('click', () => open(!panel.classList.contains('open')));
  root.querySelector('.x').addEventListener('click', () => open(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) open(false); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; handle(v); });
})();

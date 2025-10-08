// This code was originally written by Maxime B and 

chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg?.type !== "KROX_START_SCRIPT" || !sender.tab?.id) return;
    chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        world: "MAIN",
        func: startKroxScriptMainWorld,
    });
});

function startKroxScriptMainWorld() {
  if (window.__KROX_STARTED__) return;
  window.__KROX_STARTED__ = true;

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (type, selector, handler, opts) => {
    document.addEventListener(type, (e) => {
      const el = e.target.closest(selector);
      if (!el) return;
      handler.call(el, e, el);
    }, opts);
  };
  const onEnter = (selector, handler) => {
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest(selector);
      if (!el) return;
      const rt = e.relatedTarget;
      if (rt && (rt === el || el.contains(rt))) return; // emulate mouseenter
      handler.call(el, e, el);
    });
  };
  const onLeave = (selector, handler) => {
    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest(selector);
      if (!el) return;
      const rt = e.relatedTarget;
      if (rt && (rt === el || el.contains(rt))) return; // emulate mouseleave
      handler.call(el, e, el);
    });
  };
  const h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  // ---------- inject styles ----------
  const styleEl = h(`<style>
    .btn-finer { padding: 0 10px; color:#fff; outline:1px solid grey; cursor:pointer }
    .btn-finer.add { background: rgba(2,93,34,.75) }
    .btn-finer.rm  { background: rgba(93,2,2,.75) }
    #btns-finer { left:auto }
    .finer-filterable:hover { background: rgba(255,255,255,.2) }
    .finer-filtered { position:relative }
    .finer-filtered-overlay { z-index:-1; position:absolute; inset:0; background: rgba(0,136,0,.25) }
    .finer-search-global-toggle-collapsed { position:absolute; right:5px; top:5px; width:15px; height:15px; background:#382304; cursor:pointer }
    .upArr::before { content:"\\25BE"; position:absolute; font-size:25px; top:-10px; left:-3px }
    .dnArr::before { content:"\\25B8"; position:absolute; font-size:25px; top:-10px; left:-3px }
    #finer-search-global { color:#fff; width:12em; background:rgba(0,0,0,.75); position:fixed; right:10px; top:50px; z-index:1001; font-size:130%; user-select:none }
    #finer-search-global-title { outline:1px solid #8a5609; background:#5a3806; display:block; text-align:center; text-transform:capitalize; font-size:115%; cursor:move }
    .finer-global-btn { background:#0f304d; outline:1px solid #4c4c7d; margin-top:10px; padding:.3em; display:grid; grid-gap:3px; grid-template-areas:"mod-name mod-minus mod-plus"; grid-template-columns:auto 1em 1em; text-transform:capitalize }
    .finer-global-btn-pm { height:1em; border:1px inset rgba(255,255,255,.45); display:flex; align-items:center; justify-content:center; color:#fff; background:#4d390e }
    .finer-global-btn-pm.mod-name { grid-area: mod-name; text-align: left }
    .finer-global-btn-pm.plus { background:#1d8b35; grid-area: mod-plus }
    .finer-global-btn-pm.minus { background:#8b1c1c; grid-area: mod-minus }
    .finer-global-btn-pm.plus:hover, .finer-global-btn-pm.minus:hover { filter:brightness(1.4) }
    .hidden { display:none !important }
    .finer-search-global-section.mods { position:relative; }
    .finer-search-global-section.misc { position:relative; }
  </style>`);
  document.head.appendChild(styleEl);

  // ---------- floating panel ----------
  const globalPanel = h(`
    <div id="finer-search-global">
      <span id="finer-search-global-title">add to filters</span>
      <div class="finer-search-global-toggle-collapsed dnArr"></div>
      <div class="finer-search-global-body hidden">
        <div class="finer-search-global-section mods">
          <span class="finer-search-global-section-title">- Modifiers -</span>
          <div class="finer-search-global-toggle-collapsed dnArr"></div>
          <div class="finer-search-global-section-body hidden">
            ${[
              {name:'all res & life', type:'life,cold,fire,ligt'},
              {name:'all resistances', type:'allR'},
              {name:'life', type:'life'},
              {name:'cold res', type:'cold'},
              {name:'fire res', type:'fire'},
              {name:'lightning res', type:'ligt'},
              {name:'movement speed', type:'move'},
            ].map(({name,type}) => `
              <div class="finer-global-btn" data-type="${type}">
                <span class="finer-global-btn-pm mod-name">${name}</span>
                <span class="finer-global-btn-pm minus" data-action="global-minus">-</span>
                <span class="finer-global-btn-pm plus"  data-action="global-plus">+</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="finer-search-global-section misc">
          <span class="finer-search-global-section-title">- Miscellaneous -</span>
          <div class="finer-search-global-toggle-collapsed dnArr"></div>
          <div class="finer-search-global-section-body hidden">
            <div class="finer-global-btn" data-type="">
              <span class="finer-global-btn-pm mod-name">set Buyout limit</span>
              <span class="finer-global-btn-pm minus" data-action="currency-minus">-</span>
              <span class="finer-global-btn-pm plus"  data-action="currency-plus">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>`);
  // append to #trade if present, else body
  (document.getElementById('trade') || document.body).appendChild(globalPanel);

  // ---------- overlay/button templates ----------
  const filteredOverlay = () => h(`<div class="finer-filtered-overlay"></div>`);
  const buttonsTemplate = () => h(`
    <span class="lc l" id="btns-finer">
      <span class="btn-finer add" data-action="add-filter"  title="add this mod to your search filters">+</span>
      <span class="btn-finer rm"  data-action="rmv-filter"  title="remove this mod from your search results">-</span>
    </span>`);

  // ---------- state for dragging ----------
  let draggingEl = null;
  let dragOff = null;

  // ---------- map & utilities you already had ----------
  const modMap = { life:"total_life", cold:"total_cold_resistance", fire:"total_fire_resistance", ligt:"total_lightning_resistance", move:"increased_movement_speed", allR:"total_elemental_resistance" };
  const createFilter = (id) => id && ({ id, value:{}, disabled:false });

  // NOTE: These finder helpers are brittle across Vue versions; consider replacing
  const finder = (vm, v) => vm?.$vnode?.tag?.includes?.(v);
  const findVueItem = (tags) => tags.reduce((acc, v) => acc?.$children?.find?.(e => finder(e, v)), window.app);
  const ItemResultPanelVueItem = () => findVueItem(["item-results-panel"]);
  const findVueResultItem = (_itemId) => findVueItem(["item-results-panel","resultset"])?.$children?.find?.(e => e.itemId === _itemId);
  const ItemSearchGroupsVueItems = (_type) => {
    const panel = findVueItem(["item-search-panel","item-filter-panel"]);
    return panel?.$children?.filter?.(e => finder(e,"stat-filter-group") && (_type ? e.group.type === _type : true)) || [];
  };

  // ---------- main behaviors (vanilla) ----------
  // step 1: hover a result row -> check filters
  onEnter('.resultset > .row', (e, row) => {
    if (row.classList.contains('finer-processed')) return;
    const rowid = row.getAttribute('data-id');
    const mods = row.querySelector('.content')?.querySelectorAll('[class*="Mod"]') || [];
    const ISGs = ItemSearchGroupsVueItems();

    mods.forEach((mod) => {
      const sEl = mod.querySelector('.lc.s');
      const modHash = (sEl?.dataset?.field || '').slice(5); // strip 'stat.'
      if (!modHash) return;
      mod.dataset.hash = modHash;
      mod.dataset.rowid = rowid;

      const isInFilters = ISGs.some(isg => isg.filters.some(f => f.id === modHash));
      if (isInFilters) {
        mod.classList.add('finer-filtered');
        mod.appendChild(filteredOverlay());
      } else {
        mod.classList.add('finer-filterable');
      }
    });

    row.classList.add('finer-processed');
  });

  // step 2: hover a mod -> add/remove finer filter buttons
  onEnter('.itemBoxContent > .content > div', (e, el) => {
    if (!el.classList.contains('finer-filterable')) return;
    if (el.querySelector('#btns-finer')) return;
    el.appendChild(buttonsTemplate()); // clone per hover target
  });
  onLeave('.itemBoxContent > .content > div', (e, el) => {
    const btns = el.querySelector('#btns-finer');
    if (btns) btns.remove();
  });

  // step 3: click ± inside the hover buttons
  on('click', '[data-action="add-filter"]', (e, el) => {
    addOrRemoveFilter(e, true, el);
  });
  on('click', '[data-action="rmv-filter"]', (e, el) => {
    addOrRemoveFilter(e, false, el);
  });

  // step 4: global panel clicks
  on('click', '.finer-global-btn [data-action="global-plus"], .finer-global-btn [data-action="global-minus"]', (e, btn) => {
    addPseudoMods(e, btn);
  });
  on('click', '.finer-global-btn [data-action="currency-plus"], .finer-global-btn [data-action="currency-minus"]', (e, btn) => {
    addCurrencyLimit(e, btn);
  });
  on('click', '.finer-search-global-toggle-collapsed', (e, toggler) => {
    toggler.classList.toggle('dnArr');
    toggler.classList.toggle('upArr');
    const body = toggler.parentElement.querySelector('[class*="body"]');
    body && body.classList.toggle('hidden');
  });

  // step 5: drag the floating panel
  on('mousedown', '#finer-search-global-title', (e, title) => {
    draggingEl = title.parentElement;
    const rect = draggingEl.getBoundingClientRect();
    dragOff = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.preventDefault();
  });
  document.addEventListener('mouseup', () => { draggingEl = null; dragOff = null; });
  document.addEventListener('mousemove', (e) => {
    if (!draggingEl || !dragOff) return;
    const maxX = window.innerWidth  - draggingEl.offsetWidth;
    const maxY = window.innerHeight - draggingEl.offsetHeight;
    const left = Math.max(0, Math.min(e.clientX - dragOff.x, maxX));
    const top  = Math.max(0, Math.min(e.clientY - dragOff.y, maxY));
    Object.assign(draggingEl.style, { left: `${left}px`, top: `${top}px`, right: 'auto' });
  });
  window.addEventListener('resize', () => {
    const el = $('#finer-search-global');
    if (!el) return;
    // keep pinned to right/top after resize
    Object.assign(el.style, { right: '10px', top: '50px', left: 'auto' });
  });

  // keyup: prefix "~"
  document.addEventListener('keyup', (e) => {
    const input = e.target.closest('.multiselect__input');
    if (!input) return;
    if (!input.value.startsWith('~') && !input.value.startsWith(' ') && e.key !== 'Backspace') {
      input.value = `~${input.value}`;
    }
  });

  // ---------- your PoE-specific logic (adapted to vanilla) ----------
  function addPseudoMods(e, btn) {
    const more = btn.classList.contains('plus');
    const hashes = (btn.closest('.finer-global-btn')?.dataset?.type || '').split(',').filter(Boolean);

    const ISG_AND = ItemSearchGroupsVueItems('and')?.find(g => g.index === 0);
    let reload = false;

    hashes.forEach((hash) => {
      const reHashed = `pseudo.pseudo_${modMap[hash]}`;
      const current = ISG_AND?.filters?.find(f => f.id === reHashed);
      if (current) {
        const idx = ISG_AND.filters.indexOf(current);
        const curVal = ISG_AND.state.filters[idx].value || {};
        const curMin = curVal.min || 0;
        if (curMin || more) ISG_AND.updateFilter(idx, { min: curMin + (more ? 10 : -10) });
        else ISG_AND.removeFilter(idx);
        reload = true;
      } else if (more) {
        ISG_AND.selectFilter(createFilter(reHashed));
        reload = true;
      }
    });

    if (reload) {
      window.app.save(true);
      document.querySelector('.btn.search-btn')?.click();
    }
  }

  function addCurrencyLimit(e, btn) {
    const more = btn.classList.contains('plus');
    const panel = findVueItem(["item-search-panel","item-filter-panel"]);
    const trade_filters = panel?.$children?.find?.(c => c?.$vnode?.key === "trade_filters");
    const price = trade_filters?.state?.filters?.price ?? {};
    const max = price.max ?? 0;

    const patch = more ? { max: (max || 4) + 1 } : (max ? { max: max - 1 || null } : {});
    // NOTE: index 3 is from your original; keep it if that's correct in PoE UI today
    trade_filters?.updateFilter?.(3, patch);

    window.app.save(true);
    document.querySelector('.btn.search-btn')?.click();
  }

  function addOrRemoveFilter(e, isAnd, btn) {
    const filterType = isAnd ? 'and' : 'not';
    const modEl = btn.closest('div'); // the hovered mod div
    const rowId = modEl?.dataset?.rowid;
    const VueElem = findVueResultItem(rowId) || {};
    const statHash = modEl?.dataset?.hash;
    const newFilter = createFilter(statHash);
    const group = ItemSearchGroupsVueItems(filterType)?.find(g => g.index !== 0);

    if (group) group.selectFilter(newFilter);
    else VueElem.$store?.commit?.('pushStatGroup', { type: filterType, filters: [newFilter] });

    // toast + search
    try {
      const msg = VueElem.translate?.(`the stat ${statHash} has been ${isAnd ? 'added to' : 'removed from'} your stat filters.`);
      window.app?.$refs?.toastr?.Add?.({ msg, progressbar: false, timeout: 3000 });
    } catch {}
    window.app?.save?.(true);
    ItemResultPanelVueItem()?.search?.();
  }

  // NOTE: checkFilters stays mostly the same; we already implemented it above.
}
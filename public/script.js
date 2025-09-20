// ==============================
// Config
// ==============================
const API_URL = '/products';

// ==============================
// Elementos
// ==============================
const $grid   = document.getElementById('grid');
const $tpl    = document.getElementById('card-tpl');
const $search = document.getElementById('search');
const $sort   = document.getElementById('sort');

// opcionais (se existirem no HTML, já funcionam)
const $inStockOnly = document.getElementById('inStockOnly'); // checkbox "Em estoque"
const $cartCount   = document.getElementById('cartCount');   // badge do carrinho

// Drawer do carrinho
const $openCart     = document.getElementById('openCart');
const $cartDrawer   = document.getElementById('cartDrawer');
const $closeCart    = document.getElementById('closeCart');
const $cartItems    = document.getElementById('cartItems');
const $cartSubtotal = document.getElementById('cartSubtotal');
const $goCheckout   = document.getElementById('goCheckout');

// ==============================
// Estado
// ==============================
let products = [];
let view = [];
const state = { inStockOnly: false, limit: 12 };

// FIX: mapa para lookup rápido por slug
const productBySlug = new Map(); // slug -> produto

// ==============================
// Utils
// ==============================
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brl = (cents) => money.format((cents || 0) / 100);

/** Debounce simples para inputs */
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Toast de feedback (requer .toast no CSS; se não tiver, ainda funciona) */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
}

/** Skeletons enquanto carrega */
function showSkeletons(n = 12) {
  if (!$grid) return;
  $grid.innerHTML = Array.from({ length: n })
    .map(
      () => `
      <div class="card">
        <div class="thumb skel" style="height:200px;border-radius:12px"></div>
        <div class="skel" style="height:18px;margin-top:12px;border-radius:8px"></div>
        <div class="skel" style="height:14px;margin-top:8px;width:60%;border-radius:8px"></div>
      </div>
    `,
    )
    .join('');
}

/** Carrinho (localStorage) */
function getCart() { try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; } }
function setCart(items) { localStorage.setItem('cart', JSON.stringify(items)); }
function updateCartBadge() {
  if (!$cartCount) return;
  const totalQty = getCart().reduce((s, i) => s + i.qty, 0);
  $cartCount.textContent = totalQty;
  // opcional: esconder quando zero
  $cartCount.style.display = totalQty ? 'inline-block' : 'none';
}

// ==============================
// FIX: helpers de estoque por produto (slug)
// ==============================
function getStockBySlug(slug) {
  const p = productBySlug.get(slug);
  // se ainda não carregou, retorno "infinito" para não travar; o normalize fará o acerto depois
  return typeof p?.stock === 'number' ? Number(p.stock) : Infinity;
}

function clampQtyByStock(slug, qty) {
  const stock = getStockBySlug(slug);
  return Math.max(0, Math.min(qty, stock));
}

// Normaliza o carrinho (ex.: estoque caiu desde a última visita)
function normalizeCartAgainstStock() {
  const items = getCart();
  let changed = false;
  const normalized = [];

  for (const it of items) {
    const clamped = clampQtyByStock(it.slug, it.qty);
    if (clamped !== it.qty) changed = true;
    if (clamped > 0) normalized.push({ ...it, qty: clamped });
    else changed = true; // remover itens sem estoque
  }

  if (changed) {
    setCart(normalized);
    updateCartBadge();
  }
}

// ==============================
// Mapa de time -> arquivo
// ==============================
const TEAM_MAP = {
  // Europa
  'barcelona': 'barcelona',
  'real madrid': 'realmadrid',
  'realmadrid': 'realmadrid',
  'psg': 'psg',
  'paris saint germain': 'psg',
  'manchester city': 'city',
  'city': 'city',
  'man city': 'city',
  'manchester united': 'united',
  'united': 'united',
  'bayern': 'bayern',
  'borussia dortmund': 'borussia',
  'borussia': 'borussia',
  'chelsea': 'chelsea',
  'juventus': 'juventus',
  'milan': 'milan',

  // Brasil
  'atlético mineiro': 'atleticomineiro',
  'atletico mineiro': 'atleticomineiro',
  'atleticomineiro': 'atleticomineiro',
  'palmeiras': 'palmeiras',
  'corinthians': 'corinthians',
  'cruzeiro': 'cruzeiro',
  'flamengo': 'flamengo',
  'grêmio': 'gremio',
  'gremio': 'gremio',
  'santos': 'santos',
  'são paulo': 'saopaulo',
  'sao paulo': 'saopaulo',
  'saopaulo': 'saopaulo',
  'botafogo': 'botafogo',
  'internacional': 'internacional',
};

/** Normaliza texto (minúsculo, sem acento) */
function norm(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Encontra o “basename” da imagem com base em slug/name do produto */
function resolveTeamBase(product) {
  const text = norm(`${product.slug ?? ''} ${product.name ?? ''}`);
  const keys = Object.keys(TEAM_MAP).sort((a, b) => b.length - a.length); // casa chaves maiores primeiro
  for (const key of keys) {
    if (text.includes(norm(key))) return TEAM_MAP[key];
  }
  return null;
}

/** Monta a URL da imagem; se não achou time, retorna null */
function getImageSrc(product) {
  const base = resolveTeamBase(product);
  return base ? `/img/${base}.png` : null;
}

// ==============================
// Data fetch
// ==============================
async function load() {
  try {
    showSkeletons(state.limit);
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao carregar produtos');
    products = await res.json();

    // FIX: popular mapa por slug
    productBySlug.clear();
    for (const p of products) {
      if (p?.slug) productBySlug.set(p.slug, p);
    }

    // FIX: normalizar carrinho baseado no estoque atualizado
    normalizeCartAgainstStock();

    view = [...products];
    applyFilters(); // já renderiza com filtros atuais
  } catch (e) {
    if ($grid) $grid.innerHTML = `<p style="opacity:.8">Erro: ${e.message}</p>`;
  }
}

// ==============================
// Render
// ==============================
function render() {
  if (!$grid || !$tpl) return;
  $grid.innerHTML = '';

  for (const p of view) {
    const node = $tpl.content.cloneNode(true);

    // Título / preço
    node.querySelector('.card-title').textContent = p.name;
    node.querySelector('.price').textContent = brl(p.priceCents ?? 0);

    // Estoque
    const $stock = node.querySelector('.stock');
    const stockVal = Number(p.stock ?? 0);
    $stock.textContent = `Estoque: ${stockVal}`;
    if (stockVal > 0) $stock.classList.add('ok');

    // Link (mantém teu comportamento atual)
    const $link = node.querySelector('.link');
    if ($link) $link.href = `product.html?slug=${encodeURIComponent(p.slug || '')}`;

    // Imagem + tag
    const $thumb = node.querySelector('.thumb');
    const $img   = node.querySelector('.thumb-img');
    const $tag   = node.querySelector('.tag');

    const src = getImageSrc(p);
    if (src && $img) {
      // atributos para performance e suavidade
      $img.src = src;
      $img.alt = p.name || 'Produto';
      $img.loading = 'lazy';
      $img.decoding = 'async';
      $img.setAttribute('width', '320');
      $img.setAttribute('height', '320');

      // etiqueta amigável
      const label = src.split('/').pop().replace('.png', '');
      $tag.textContent = label
        .replace('realmadrid', 'Real Madrid')
        .replace('psg', 'PSG')
        .replace('saopaulo', 'São Paulo')
        .replace('atleticomineiro', 'Atlético-MG')
        .replace('city', 'Man City')
        .replace('united', 'Man United')
        .replace(/^./, (c) => c.toUpperCase());

      // fallback para placeholder se a imagem falhar
      $img.onerror = () => {
        $img.remove();
        $thumb.classList.add('placeholder');
        $tag.textContent = '';
      };
    } else {
      // sem match -> placeholder
      if ($img) $img.remove();
      $thumb.classList.add('placeholder');
      $tag.textContent = '';
    }

    // Botão "Adicionar ao carrinho" dentro do card (se existir no template)
    const $add = node.querySelector('.add');
    if ($add) {
      // FIX: desabilitar completamente se não há estoque
      if (stockVal <= 0) {
        $add.disabled = true;
        $add.title = 'Sem estoque';
      }

      $add.addEventListener('click', () => {
        // FIX: proteger pelo estoque (clamp)
        const items = getCart();
        const idx = items.findIndex((i) => i.slug === p.slug);
        const currentQty = idx >= 0 ? items[idx].qty : 0;
        const nextQty = clampQtyByStock(p.slug, currentQty + 1);

        if (nextQty === currentQty) {
          toast(`Limite de estoque (${stockVal})`);
          return;
        }

        if (idx >= 0) {
          items[idx].qty = nextQty;
        } else {
          // quando adiciona a primeira vez, já respeita estoque
          const initialQty = clampQtyByStock(p.slug, 1);
          if (initialQty <= 0) {
            toast('Sem estoque');
            return;
          }
          items.push({ slug: p.slug, name: p.name, price: p.priceCents ?? 0, image: src, qty: initialQty });
        }
        setCart(items);
        updateCartBadge();
        toast('Adicionado ao carrinho');
      });
    }

    $grid.appendChild(node);
  }
}

// ==============================
// Filtros / Ordenação
// ==============================
function applyFilters() {
  const q = norm($search?.value ?? '');
  const inStockOnly = $inStockOnly ? $inStockOnly.checked : state.inStockOnly;

  // filtra
  view = products.filter((p) => {
    const matchesText =
      norm(p.name ?? '').includes(q) || norm(p.slug ?? '').includes(q);
    const matchesStock = !inStockOnly || (Number(p.stock ?? 0) > 0);
    return matchesText && matchesStock;
  });

  // ordena
  switch ($sort?.value) {
    case 'price':
      view.sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0));
      break;
    case 'stock':
      view.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
      break;
    default:
      view.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR'));
      break;
  }

  render();
}

// ==============================
// Drawer do carrinho
// ==============================
function renderCart(){
  if(!$cartItems || !$cartSubtotal) return;
  const items = getCart();

  if(!items.length){
    $cartItems.innerHTML = `<p style="opacity:.75">Seu carrinho está vazio.</p>`;
    $cartSubtotal.textContent = brl(0);
    return;
  }

  $cartItems.innerHTML = items.map((i,idx)=>{
    // FIX: mostrar estoque máximo por item (opcional)
    const max = getStockBySlug(i.slug);
    const capped = clampQtyByStock(i.slug, i.qty);
    // se o carrinho estiver com valor acima, já mostra “travado”
    const qtyDisplay = capped !== i.qty ? `${capped} / ${max}` : `${i.qty}`;

    return `
      <div class="cart-line" data-idx="${idx}" data-slug="${i.slug}">
        <img src="${i.image||''}" alt="">
        <div>
          <div class="name">${i.name || i.slug}</div>
          <div class="price">${brl(i.price || 0)}</div>
          <div class="qty-controls">
            <button class="dec">-</button>
            <span class="qty">${qtyDisplay}</span>
            <button class="inc">+</button>
            <button class="rm">remover</button>
          </div>
          ${Number.isFinite(max) ? `<small style="opacity:.7">Máx: ${max}</small>` : ''}
        </div>
        <div class="line-total"><strong>${brl((i.price||0)*capped)}</strong></div>
      </div>
    `;
  }).join('');

  // FIX: subtotal leva em conta quantidade “clampada”
  const subtotal = items.reduce((s,i)=> s + (i.price||0)*clampQtyByStock(i.slug, i.qty), 0);
  $cartSubtotal.textContent = brl(subtotal);
}

// ==============================
// Listeners
// ==============================
if ($search) $search.addEventListener('input', debounce(applyFilters, 300));
if ($sort)   $sort.addEventListener('change', applyFilters);
if ($inStockOnly) {
  state.inStockOnly = $inStockOnly.checked;
  $inStockOnly.addEventListener('change', () => {
    state.inStockOnly = $inStockOnly.checked;
    applyFilters();
  });
}

// Drawer open/close
if($openCart){
  $openCart.addEventListener('click', ()=>{
    if(!$cartDrawer) return;
    $cartDrawer.classList.remove('hidden');

    // FIX: normaliza antes de renderizar (caso estoque tenha mudado)
    normalizeCartAgainstStock();
    renderCart();
  });
}
if($closeCart){
  $closeCart.addEventListener('click', ()=> $cartDrawer?.classList.add('hidden'));
}
if($cartDrawer){
  $cartDrawer.addEventListener('click', (e)=>{
    if(e.target === $cartDrawer) $cartDrawer.classList.add('hidden');
  });
}
// Eventos dentro do drawer
if($cartItems){
  $cartItems.addEventListener('click', (e)=>{
    const line = e.target.closest('.cart-line'); if(!line) return;
    const idx = Number(line.dataset.idx);
    const slug = line.dataset.slug;
    const items = getCart();
    if(Number.isNaN(idx) || !items[idx]) return;

    // estoque atual do produto
    const max = getStockBySlug(slug);

    if(e.target.classList.contains('inc')) {
      // FIX: clamp no "+" do carrinho
      const next = clampQtyByStock(slug, items[idx].qty + 1);
      if (next === items[idx].qty) {
        toast(`Limite de estoque (${Number.isFinite(max) ? max : items[idx].qty})`);
      } else {
        items[idx].qty = next;
        setCart(items);
        renderCart();
        updateCartBadge();
      }
      return;
    }

    if(e.target.classList.contains('dec')) {
      // mantém mínimo 1 (se houver estoque); se estoque zerou, remove
      if (max <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx].qty = Math.max(1, items[idx].qty - 1);
      }
      setCart(items);
      renderCart();
      updateCartBadge();
      return;
    }

    if(e.target.classList.contains('rm'))  {
      items.splice(idx,1);
      setCart(items);
      renderCart();
      updateCartBadge();
      return;
    }
  });
}

if($goCheckout){
  $goCheckout.addEventListener('click', async ()=>{
    // Integração futura com /cart/validate e /checkout
    toast('Checkout fake: em breve conectamos com o backend!');
  });
}

// ==============================
// Boot
// ==============================
updateCartBadge();
load();

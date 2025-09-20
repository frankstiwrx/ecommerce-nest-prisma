const API_URL = '/products';

// util money
const money = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const brl = (c)=> money.format((c||0)/100);

// simples norm e TEAM_MAP igual do index (para imagem/tag e relacionados)
const TEAM_MAP = {
  'barcelona':'barcelona','real madrid':'realmadrid','realmadrid':'realmadrid',
  'psg':'psg','paris saint germain':'psg',
  'manchester city':'city','city':'city','man city':'city',
  'manchester united':'united','united':'united',
  'bayern':'bayern','borussia dortmund':'borussia','borussia':'borussia',
  'chelsea':'chelsea','juventus':'juventus','milan':'milan',
  'atlético mineiro':'atleticomineiro','atletico mineiro':'atleticomineiro','atleticomineiro':'atleticomineiro',
  'palmeiras':'palmeiras','corinthians':'corinthians','cruzeiro':'cruzeiro','flamengo':'flamengo',
  'grêmio':'gremio','gremio':'gremio','santos':'santos','são paulo':'saopaulo','sao paulo':'saopaulo','saopaulo':'saopaulo',
};
const norm = (s='')=> s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
function resolveTeamBase(p){
  const text = norm(`${p.slug??''} ${p.name??''}`);
  const keys = Object.keys(TEAM_MAP).sort((a,b)=>b.length-a.length);
  for(const k of keys){ if(text.includes(norm(k))) return TEAM_MAP[k]; }
  return null;
}
function getImageSrc(p){ const base = resolveTeamBase(p); return base? `/img/${base}.png` : null; }

function getCart(){ try{return JSON.parse(localStorage.getItem('cart')||'[]');}catch{return[];} }
function setCart(items){ localStorage.setItem('cart', JSON.stringify(items)); }

// FIX: badge opcional (caso exista no layout da página de produto)
function updateCartBadge(){
  const el = document.getElementById('cartCount');
  if(!el) return;
  const total = getCart().reduce((s,i)=>s+i.qty,0);
  el.textContent = total;
  el.style.display = total ? 'inline-block' : 'none';
}

// FIX: toast simples (igual ao index)
function toast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1400);
}

function qs(n){ return document.querySelector(n); }

// FIX: clamp helper por estoque local do produto
function clampQty(qty, stock){
  qty = Number.isFinite(qty) ? qty : 1;
  return Math.max(0, Math.min(qty, Math.max(0, stock)));
}

async function main(){
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const $img = qs('#pImg'), $tag = qs('#pTag'), $title = qs('#pTitle'), $price = qs('#pPrice');
  const $team = qs('#pTeam'), $stock = qs('#pStock'), $desc = qs('#pDesc');
  const $qty = qs('#qty'), $dec = qs('#qtyDec'), $inc = qs('#qtyInc'), $add = qs('#addBtn');
  const $relGrid = qs('#relGrid'), $tpl = qs('#rel-card');

  if(!slug){
    qs('main').innerHTML = `<p style="opacity:.8">Produto não encontrado.</p>`;
    return;
  }

  // carrega produto
  const res = await fetch(`${API_URL}/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if(!res.ok){ qs('main').innerHTML = `<p style="opacity:.8">Produto não encontrado.</p>`; return; }
  const p = await res.json();

  // preencher
  $title.textContent = p.name || slug;
  $price.textContent = brl(p.priceCents ?? p.price ?? 0);
  $team.textContent = p.team || '—';
  const stockVal = Number(p.stock ?? 0);
  $stock.textContent = stockVal>0 ? `Estoque: ${stockVal}` : 'Esgotado';
  if(stockVal>0) $stock.classList.add('ok');

  // descrição (fallback se não houver no back)
  $desc.textContent = p.description || `Camisa oficial ${p.name || ''}. Tecido respirável e caimento confortável.`;

  // imagem/tag
  const src = p.image || getImageSrc(p);
  if(src){
    $img.src = src; $img.alt = p.name || 'Produto'; $img.loading='lazy'; $img.decoding='async';
    $img.width=480; $img.height=480;
    const label = src.split('/').pop().replace('.png','');
    $tag.textContent = label
      .replace('realmadrid','Real Madrid').replace('psg','PSG')
      .replace('saopaulo','São Paulo').replace('atleticomineiro','Atlético-MG')
      .replace('city','Man City').replace('united','Man United')
      .replace(/^./,c=>c.toUpperCase());
    $img.onerror = ()=>{ $img.remove(); qs('.p-hero').classList.add('placeholder'); $tag.textContent=''; };
  } else {
    $img.remove(); qs('.p-hero').classList.add('placeholder'); $tag.textContent='';
  }

  // ==============================
  // FIX: Controles de quantidade com clamp por estoque
  // ==============================
  // define limites do input
  if ($qty) {
    $qty.min = stockVal > 0 ? 1 : 0;         // se não há estoque, min = 0
    $qty.max = Math.max(0, stockVal);        // max = estoque atual
    $qty.value = stockVal > 0 ? 1 : 0;       // valor inicial coerente
  }

  // botões +/- respeitam estoque
  $dec?.addEventListener('click', ()=>{
    const v = Number($qty.value || 1);
    const next = clampQty(v - 1, stockVal);
    // se estoque zero, segura em 0
    $qty.value = stockVal > 0 ? Math.max(1, next) : 0;
  });
  $inc?.addEventListener('click', ()=>{
    const v = Number($qty.value || 1);
    const next = clampQty(v + 1, stockVal);
    // se subir e bater no teto, avisa
    if (next === v && stockVal > 0) toast(`Limite de estoque (${stockVal})`);
    $qty.value = stockVal > 0 ? Math.max(1, next) : 0;
  });

  // clamp ao digitar manualmente
  const clampInput = ()=>{
    let v = parseInt($qty.value || '1', 10);
    if (Number.isNaN(v)) v = 1;
    v = clampQty(v, stockVal);
    // se há estoque, mínimo 1; senão 0
    $qty.value = stockVal > 0 ? Math.max(1, v) : 0;
  };
  $qty?.addEventListener('input', clampInput);
  $qty?.addEventListener('change', clampInput);

  // botão "Adicionar" respeita o estoque
  if(stockVal <= 0){
    $add.disabled = true;
    $add.textContent = 'Sem estoque';
  }

  $add?.addEventListener('click', ()=>{
    // quantidade final clampada
    const desired = parseInt($qty.value || '1', 10);
    const qty = clampQty(desired, stockVal);
    if (qty <= 0) { toast('Sem estoque'); return; }

    const items = getCart();
    const idx = items.findIndex(i=> i.slug===p.slug);
    if(idx>=0){
      const combined = clampQty(items[idx].qty + qty, stockVal); // FIX: protege ao somar
      if (combined === items[idx].qty){
        toast(`Limite de estoque (${stockVal})`);
        return;
      }
      items[idx].qty = combined;
    } else {
      items.push({ slug:p.slug, name:p.name, price:(p.priceCents ?? p.price ?? 0), image: src, qty });
    }
    setCart(items);
    updateCartBadge(); // FIX: atualiza badge se existir
    toast('Adicionado ao carrinho');
  });

  // ==============================
  // relacionados
  // ==============================
  try{
    const allRes = await fetch(API_URL, { cache: 'no-store' });
    const all = allRes.ok ? await allRes.json() : [];
    const baseText = norm(p.team || p.name || '');
    const related = all
      .filter(x=> x.slug !== p.slug)
      .filter(x=> {
        const t = norm(`${x.team||''} ${x.name||''}`);
        return baseText && t.includes(baseText);
      })
      .slice(0, 8);

    if(related.length){
      $relGrid.innerHTML = '';
      for(const r of related){
        const node = $tpl.content.cloneNode(true);
        node.querySelector('.card-title').textContent = r.name;
        node.querySelector('.price').textContent = brl(r.priceCents ?? r.price ?? 0);

        const srcR = r.image || getImageSrc(r);
        const $imgR = node.querySelector('.thumb-img');
        const $tagR = node.querySelector('.tag');
        if(srcR && $imgR){
          $imgR.src = srcR; $imgR.alt = r.name; $imgR.loading='lazy'; $imgR.decoding='async';
          $imgR.width=320; $imgR.height=320;
          const label = srcR.split('/').pop().replace('.png','');
          $tagR.textContent = label
            .replace('realmadrid','Real Madrid').replace('psg','PSG')
            .replace('saopaulo','São Paulo').replace('atleticomineiro','Atlético-MG')
            .replace('city','Man City').replace('united','Man United')
            .replace(/^./,c=>c.toUpperCase());
          $imgR.onerror = ()=>{ $imgR.remove(); node.querySelector('.thumb').classList.add('placeholder'); $tagR.textContent=''; };
        } else {
          if($imgR) $imgR.remove();
          node.querySelector('.thumb').classList.add('placeholder');
          $tagR.textContent = '';
        }

        node.querySelector('.link').href = `/product.html?slug=${encodeURIComponent(r.slug)}`;
        $relGrid.appendChild(node);
      }
    } else {
      $relGrid.innerHTML = `<p style="opacity:.75">Sem itens relacionados.</p>`;
    }
  } catch {}
}

main();

// Se o Nest serve o HTML e a API na MESMA origem/porta, deixe vazio:
const API = '';
// Troque depois quando tiver auth:
const USER_ID = 1;

const $grid = document.getElementById('cartGrid');
const $total = document.getElementById('cartTotal');
const $btnClear = document.getElementById('btnClear');
const $btnCheckout = document.getElementById('btnCheckout');
const $addTest = document.getElementById('addTest');

async function fetchJSON(url, opts) {
  const r = await fetch(url, { headers: { 'Content-Type':'application/json' }, ...opts });
  if (!r.ok) throw new Error((await r.text()) || r.statusText);
  return r.json();
}

async function loadCart() {
  // tenta buscar produtos; se falhar, seguimos só com o carrinho
  let products = [];
  try { products = await fetchJSON(`${API}/products`); } catch {}
  const map = new Map(products.map(p => [p.id, p]));

  const cart = await fetchJSON(`${API}/cart/${USER_ID}`);

  $grid.innerHTML = '';
  for (const it of cart.items) {
    const p = map.get(it.productId) || {};
    const name = p?.name || `Produto #${it.productId}`;
    const price = Number(p?.price ?? 0);
    const img = p?.imageUrl || '/img/placeholder.png';
    const line = price * it.quantity;

    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <img src="${img}" alt="${name}">
      <div class="grow">
        <div>${name}</div>
        <div class="price">R$ ${price.toFixed(2)}</div>
      </div>
      <div class="qty">
        <button data-dec>−</button>
        <input data-qty type="number" min="1" value="${it.quantity}" style="width:64px;text-align:center">
        <button data-inc>+</button>
      </div>
      <div class="price">R$ ${line.toFixed(2)}</div>
      <button data-remove title="Remover" class="danger">✕</button>
    `;

    row.querySelector('[data-inc]').onclick = () => updateQty(it.productId, it.quantity + 1);
    row.querySelector('[data-dec]').onclick = () => updateQty(it.productId, Math.max(1, it.quantity - 1));
    row.querySelector('[data-qty]').onchange = (e) => updateQty(it.productId, Math.max(1, Number(e.target.value || 1)));
    row.querySelector('[data-remove]').onclick = () => removeItem(it.productId);

    $grid.appendChild(row);
  }

  $total.textContent = `Total: R$ ${Number(cart.total || 0).toFixed(2)}`;
}

async function updateQty(productId, quantity) {
  await fetchJSON(`${API}/cart/update`, {
    method: 'PATCH',
    body: JSON.stringify({ userId: USER_ID, productId, quantity })
  });
  await loadCart();
}
async function removeItem(productId) {
  await fetchJSON(`${API}/cart/remove`, {
    method: 'DELETE',
    body: JSON.stringify({ userId: USER_ID, productId })
  });
  await loadCart();
}

// Botões
$btnClear.onclick = async () => {
  await fetchJSON(`${API}/cart/${USER_ID}/clear`, { method: 'DELETE' });
  await loadCart();
};
$btnCheckout.onclick = async () => {
  try {
    await fetchJSON(`${API}/cart/checkout`, {
      method: 'POST',
      body: JSON.stringify({ userId: USER_ID })
    });
    alert('Compra finalizada! ✅');
    await loadCart();
  } catch (e) {
    alert('Falha ao finalizar: ' + e.message);
  }
};
// “Adicionar item #1” pra testar sem catálogo
$addTest.onclick = async () => {
  await fetchJSON(`${API}/cart/add`, {
    method: 'POST',
    body: JSON.stringify({ userId: USER_ID, productId: 1, quantity: 1 })
  });
  await loadCart();
};

loadCart().catch(err => console.error(err));

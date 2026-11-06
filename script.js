let products = [];
let cart = [];
let orders = JSON.parse(localStorage.getItem('japos_orders')) || [];

// 1. Splash Animation Control
function enterApp() {
  const splash = document.getElementById('splash-screen');
  splash.style.opacity = '0';
  setTimeout(() => splash.style.visibility = 'hidden', 800);
}

// 2. Fetch Products
async function fetchProducts() {
  try {
    const res = await fetch('api.php?action=get_products');
    if (res.ok) {
      products = await res.json();
    } else {
      throw new Error();
    }
  } catch (e) {
    // Fallback data
    products = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Produk Sample JAPOS SHOP #${i + 1}`,
      category: ['Elektronik', 'Fashion', 'Aksesoris', 'Home & Living', 'Gadgets'][i % 5],
      price: (i + 1) * 25000,
      rating: (4.0 + (i % 10) * 0.1).toFixed(1),
      image: `https://picsum.photos/seed/japos${i + 1}/400/300`
    }));
  }
  renderProducts(products);
}

function renderProducts(items) {
  const container = document.getElementById('product-list');
  container.innerHTML = items.map(p => `
    <div class="product-card">
      <img src="${p.image}" class="product-img" alt="${p.name}">
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <div class="product-title">${p.name}</div>
        <div class="product-rating"><i class="fa-solid fa-star"></i> ${p.rating}</div>
        <div class="product-price">Rp ${p.price.toLocaleString('id-ID')}</div>
        <button class="btn-add" onclick="addToCart(${p.id})">Tambah Keranjang</button>
      </div>
    </div>
  `).join('');
}

function filterProducts() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const category = document.getElementById('category-filter').value;

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search);
    const matchesCat = category === 'ALL' || p.category === category;
    return matchesSearch && matchesCat;
  });

  renderProducts(filtered);
}

// 3. Cart Functions
function addToCart(id) {
  const item = products.find(p => p.id === id);
  cart.push(item);
  document.getElementById('cart-count').innerText = cart.length;
  alert(`${item.name} berhasil ditambahkan!`);
}

function toggleCart() {
  const modal = document.getElementById('cart-modal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  if (modal.style.display === 'flex') renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  if (cart.length === 0) {
    container.innerHTML = '<p>Keranjang masih kosong.</p>';
    document.getElementById('cart-total').innerText = 'Total: Rp 0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, index) => {
    total += item.price;
    return `
      <div class="cart-item">
        <img src="${item.image}">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>Rp ${item.price.toLocaleString('id-ID')}</p>
        </div>
        <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }).join('');
  document.getElementById('cart-total').innerText = `Total: Rp ${total.toLocaleString('id-ID')}`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  document.getElementById('cart-count').innerText = cart.length;
  renderCart();
}

// 4. Checkout Function (Menggunakan Data Profil)
async function checkout() {
  if (cart.length === 0) return alert('Keranjang kosong!');

  // Cek Data Profil
  const profile = JSON.parse(localStorage.getItem('japos_profile'));
  if (!profile || !profile.name || !profile.phone || !profile.address) {
    alert('Silakan lengkapi Data Profil Anda (Ikon User di kanan atas) sebelum checkout!');
    toggleCart(); 
    toggleProfile(); 
    return;
  }

  const orderData = {
    name: profile.name,
    phone: profile.phone,
    address: profile.address,
    payment: "COD",
    items: cart,
    total: cart.reduce((acc, item) => acc + item.price, 0)
  };

  try {
    const res = await fetch('api.php?action=create_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (data.status === 'success') {
      orders.unshift(data.order);
    } else {
      throw new Error();
    }
  } catch (e) {
    // Fallback jika API PHP tidak merespon
    const fallbackOrder = {
      id: 'JAPOS-SHOP-' + Math.floor(100000 + Math.random() * 900000),
      total_price: orderData.total,
      status: 'Di Proses',
      created_at: new Date().toLocaleString()
    };
    orders.unshift(fallbackOrder);
  }

  localStorage.setItem('japos_orders', JSON.stringify(orders));
  cart = [];
  document.getElementById('cart-count').innerText = '0';
  alert('Pesanan berhasil dibuat!');
  toggleCart();
  toggleOrders(); 
}

// 5. Orders Tracking
function toggleOrders() {
  const modal = document.getElementById('orders-modal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  if (modal.style.display === 'flex') renderOrders();
}

function renderOrders() {
  const container = document.getElementById('orders-container');
  if (orders.length === 0) {
    container.innerHTML = '<p>Belum ada transaksi.</p>';
    return;
  }

  container.innerHTML = orders.map((o, idx) => `
    <div style="border: 1px solid var(--gray-light); padding:15px; border-radius:8px; margin-bottom:15px;">
      <h4>Pesanan #${o.id}</h4>
      <p>Total: Rp ${(o.total_price || 0).toLocaleString('id-ID')}</p>
      
      <div class="status-tracker">
        <div class="status-step ${o.status === 'Di Proses' || o.status === 'Di Antar' || o.status === 'Produk Sampai' ? 'active' : ''}">
          <i class="fa-solid fa-box"></i>
          <p>Di Proses</p>
        </div>
        <div class="status-step ${o.status === 'Di Antar' || o.status === 'Produk Sampai' ? 'active' : ''}">
          <i class="fa-solid fa-truck"></i>
          <p>Di Antar</p>
        </div>
        <div class="status-step ${o.status === 'Produk Sampai' ? 'completed' : ''}">
          <i class="fa-solid fa-house-chimney-check"></i>
          <p>Produk Sampai</p>
        </div>
      </div>

      <button onclick="advanceOrderStatus('${o.id}', ${idx})" style="padding:6px 12px; background:var(--secondary); color:white; border:none; border-radius:4px; cursor:pointer;">Simulasi Lanjut Status</button>
    </div>
  `).join('');
}

async function advanceOrderStatus(orderId, index) {
  const stages = ['Di Proses', 'Di Antar', 'Produk Sampai'];
  let currentIdx = stages.indexOf(orders[index].status);
  if (currentIdx < stages.length - 1) {
    const nextStatus = stages[currentIdx + 1];
    orders[index].status = nextStatus;
    localStorage.setItem('japos_orders', JSON.stringify(orders));

    try {
      await fetch('api.php?action=update_order_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: nextStatus })
      });
    } catch (e) {}

    renderOrders();
  }
}

// 6. Profile Functions
function toggleProfile() {
  const modal = document.getElementById('profile-modal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  if (modal.style.display === 'flex') loadProfile();
}

function loadProfile() {
  const profile = JSON.parse(localStorage.getItem('japos_profile')) || {
    name: '', phone: '', address: ''
  };
  document.getElementById('prof-name').value = profile.name;
  document.getElementById('prof-phone').value = profile.phone;
  document.getElementById('prof-address').value = profile.address;
}

function saveProfile() {
  const profile = {
    name: document.getElementById('prof-name').value,
    phone: document.getElementById('prof-phone').value,
    address: document.getElementById('prof-address').value
  };
  
  if (!profile.name || !profile.phone || !profile.address) {
    return alert('Harap lengkapi semua data profil!');
  }

  localStorage.setItem('japos_profile', JSON.stringify(profile));
  alert('Data Profil berhasil disimpan!');
  toggleProfile();
}

// Inisialisasi awal saat halaman dimuat
fetchProducts();
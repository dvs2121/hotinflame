const API_BASE = window.API_BASE || 'http://localhost:5002/api';
let activeBrand = localStorage.getItem('activeBrand') || 'deeksha';
let selectedDishes = JSON.parse(localStorage.getItem('selectedDishes') || '[]');
let currentFilter = 'all';

async function apiRequest(path, options = {}) {
    const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
    const token = sessionStorage.getItem('userToken');
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
    if (!response.ok) throw new Error(result.message || 'Request failed');
    return result;
}
function showToast(message) { const toast = document.getElementById('toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
function imageUrl(path) { return path ? `${API_BASE.replace(/\/api\/?$/, '')}${path}` : ''; }

function switchBrand(brand) {
    activeBrand = brand; localStorage.setItem('activeBrand', brand); currentFilter = 'all';
    document.querySelectorAll('.brand-btn').forEach(button => button.classList.toggle('active', button.dataset.brand === brand));
    const flame = brand === 'flamein'; document.body.classList.toggle('brand-flamein', flame);
    document.getElementById('nav-brand-title').innerHTML = flame ? 'THEFLAMEIN <span>HOT</span>' : 'DEEKSHA <span>CATERERS</span>';
    document.getElementById('hero-tag').innerHTML = flame ? '<i class="fas fa-fire"></i> Fiery & Authentic' : '<i class="fas fa-star"></i> Premier Catering Service';
    document.getElementById('hero-title').innerHTML = flame ? 'Ignite Your <span>Taste Buds</span>' : "Celebrate Life's <span>Golden Moments</span>";
    document.getElementById('hero-desc').textContent = flame ? 'Experience the bold, fiery flavours of TheFlameIn Hot. Perfect for corporate lunches, late-night cravings, and spicy food lovers.' : 'From lavish weddings and birthdays to intimate gatherings — Deeksha Caterers brings the authentic, rich flavours of Gujarat to your table with grace and elegance.';
    document.getElementById('menu-tag').textContent = flame ? 'Spicy Specialties' : 'Our Specialties'; document.getElementById('menu-title').textContent = flame ? 'TheFlameIn Hot Menu' : 'Famous Gujarati Dishes';
    document.getElementById('menu-desc').textContent = flame ? 'Bold flavours, grilled to perfection, and served with passion.' : 'A curated selection of authentic cuisine for every occasion';
    document.getElementById('footer-brand-title').textContent = flame ? 'TheFlameIn Hot' : 'Deeksha Caterers'; document.getElementById('footer-copy-brand').textContent = flame ? 'TheFlameIn Hot' : 'Deeksha Caterers';
    renderDishes(); renderGallery();
}
async function renderDishes() {
    const grid = document.getElementById('dishes-grid'); if (!grid) return;
    try {
        const dishes = (await apiRequest(`/dishes?type=${encodeURIComponent(activeBrand)}&available=true`)).data || [];
        const categories = ['all', ...new Set(dishes.map(dish => dish.category))];
        document.getElementById('filter-tabs').innerHTML = categories.map(category => `<button class="filter-tab ${currentFilter === category ? 'active' : ''}" onclick="setFilter('${escapeHtml(category)}')">${category === 'all' ? 'All' : escapeHtml(category.charAt(0).toUpperCase() + category.slice(1))}</button>`).join('');
        const filtered = dishes.filter(dish => currentFilter === 'all' || dish.category === currentFilter);
        grid.innerHTML = filtered.length ? filtered.map(dish => `<div class="dish-card">${dish.image ? `<img class="dish-img" src="${imageUrl(dish.image)}" alt="${escapeHtml(dish.name)}">` : '<div class="dish-img-placeholder">🍽️</div>'}<div class="dish-badge">${escapeHtml(dish.category)}</div><div class="dish-body"><div class="dish-name">${escapeHtml(dish.name)}</div><div class="dish-desc">${escapeHtml(dish.description)}</div>${dish.imageCaption ? `<div class="dish-caption">${escapeHtml(dish.imageCaption)}</div>` : ''}<div class="dish-footer"><button class="add-cart-btn" onclick="toggleDishSelection('${dish._id}', '${escapeHtml(dish.name)}', '${activeBrand}', '${escapeHtml(dish.image || '')}')"><i class="fas ${selectedDishes.some(item => item.id === dish._id) ? 'fa-check' : 'fa-plus'}"></i> ${selectedDishes.some(item => item.id === dish._id) ? 'Selected' : 'Select'}</button></div></div></div>`).join('') : '<div class="no-results" style="grid-column:1/-1;text-align:center;padding:40px"><p>No dishes found in this category.</p></div>';
    } catch (error) { grid.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;padding:40px"><p>Menu is temporarily unavailable.</p></div>'; }
}
function setFilter(filter) { currentFilter = filter; renderDishes(); }
function toggleDishSelection(id, name, brand, image) { const index = selectedDishes.findIndex(item => item.id === id); if (index >= 0) selectedDishes.splice(index, 1); else selectedDishes.push({ id, name, brand, image, quantity: 1 }); localStorage.setItem('selectedDishes', JSON.stringify(selectedDishes)); updateCartUI(); renderDishes(); showToast(index >= 0 ? 'Dish removed from cart.' : 'Dish added to cart.'); }
function updateCartUI() { const count = document.getElementById('cart-count'); const list = document.getElementById('cart-items-list'); if (!count || !list) return; count.textContent = selectedDishes.reduce((total, item) => total + item.quantity, 0); list.innerHTML = selectedDishes.length ? selectedDishes.map(item => `<div class="cart-item">${item.image ? `<img class="cart-item-image" src="${imageUrl(item.image)}" alt="${escapeHtml(item.name)}">` : '<span class="cart-item-emoji">🍽️</span>'}<div class="cart-item-info"><div class="cart-item-name">${escapeHtml(item.name)}</div><small>${item.brand === 'flamein' ? 'The FlameIn Hot' : 'Deeksha Caterers'}</small><button class="cart-remove" onclick="removeFromCart('${item.id}')">Remove</button></div><div class="cart-qty"><button class="qty-btn" aria-label="Decrease ${escapeHtml(item.name)} quantity" onclick="changeQty('${item.id}',-1)">-</button><span class="qty-num">${item.quantity}</span><button class="qty-btn" aria-label="Increase ${escapeHtml(item.name)} quantity" onclick="changeQty('${item.id}',1)">+</button></div></div>`).join('') : '<div class="empty-cart" style="text-align:center;padding:40px 20px"><p>No dishes selected</p></div>'; }
function changeQty(id, delta) { const item = selectedDishes.find(entry => entry.id === id); if (!item) return; item.quantity += delta; if (item.quantity <= 0) selectedDishes = selectedDishes.filter(entry => entry.id !== id); localStorage.setItem('selectedDishes', JSON.stringify(selectedDishes)); updateCartUI(); }
function removeFromCart(id) { selectedDishes = selectedDishes.filter(item => item.id !== id); localStorage.setItem('selectedDishes', JSON.stringify(selectedDishes)); updateCartUI(); }
function clearCart() { selectedDishes = []; localStorage.setItem('selectedDishes', '[]'); updateCartUI(); }
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('open'); document.getElementById('cart-overlay').classList.toggle('open'); }
function goToOrderForm() { toggleCart(); document.getElementById('order').scrollIntoView({ behavior: 'smooth' }); document.getElementById('o-notes').value = selectedDishes.length ? `Selected Dishes: ${selectedDishes.map(item => `${item.name} (x${item.quantity})`).join(', ')}\n\nSpecial Requirements: ` : ''; }
async function sendCartOnWhatsApp() { if (!selectedDishes.length) return showToast('Add at least one dish to your cart.'); showToast('Preparing your order for WhatsApp…'); try { const result = await apiRequest('/settings/whatsapp'); if (!result.data.number) throw new Error('WhatsApp ordering is not configured yet.'); const lines = selectedDishes.map((item, index) => `${index + 1}. ${item.name} — Qty: ${item.quantity} (${item.brand === 'flamein' ? 'The FlameIn Hot' : 'Deeksha Caterers'})`); const message = `Hello, I would like to enquire about the following dishes:\n\n${lines.join('\n\n')}`; window.open(`https://wa.me/${result.data.number}?text=${encodeURIComponent(message)}`, '_blank'); } catch (error) { showToast(error.message); } }

async function submitQuotation(event) {
    event.preventDefault();
    const payload = { customerName: document.getElementById('o-name').value.trim(), email: document.getElementById('o-email').value.trim(), phone: document.getElementById('o-phone').value.trim(), eventType: document.getElementById('o-event').value, eventDate: document.getElementById('o-date').value, guestCount: Number(document.getElementById('o-guests').value), selectedDishes, customRequirements: document.getElementById('o-notes').value, message: `Brand: ${activeBrand}; Venue: ${document.getElementById('o-address').value}; Time: ${document.getElementById('o-time').value}` };
    try { await apiRequest('/quotations', { method: 'POST', body: JSON.stringify(payload) }); const message = `New quotation request\nName: ${payload.customerName}\nPhone: ${payload.phone}\nEvent: ${payload.eventType}\nDate: ${payload.eventDate}\nGuests: ${payload.guestCount}\nDetails: ${payload.customRequirements}`; window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank'); showToast('Quotation submitted successfully'); document.getElementById('quotation-form').reset(); } catch (error) { if (error.message.includes('Authentication')) sessionStorage.removeItem('userToken'); showToast(error.message); }
}
function getCurrentLocation() { if (!navigator.geolocation) return showToast('Geolocation is not supported'); document.getElementById('loc-btn-text').textContent = '📍 Getting location…'; navigator.geolocation.getCurrentPosition(position => { const lat = position.coords.latitude.toFixed(4); const lng = position.coords.longitude.toFixed(4); document.getElementById('o-lat').value = lat; document.getElementById('o-lng').value = lng; document.getElementById('location-display').textContent = `📍 Location captured: Lat ${lat}, Lng ${lng}`; document.getElementById('location-display').style.display = 'block'; document.getElementById('loc-btn-text').textContent = '✅ Location Captured'; }, () => { document.getElementById('loc-btn-text').textContent = '📍 Use Current Location'; showToast('Unable to get location'); }); }
async function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    try {
        const result = await apiRequest(`/gallery?type=${encodeURIComponent(activeBrand)}`);
        const items = result.data || [];
        grid.innerHTML = items.length ? items.map(item => `
            <div class="gallery-item" data-caption="${escapeHtml(item.caption || '')}">
                <img src="${imageUrl(item.image)}" alt="${escapeHtml(item.title || 'Event gallery image')}">
                <div class="gallery-overlay">
                    <div>
                        <h4>${escapeHtml(item.title || 'Event Highlight')}</h4>
                        ${item.caption ? `<p>${escapeHtml(item.caption)}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('') : '<div class="no-results" style="grid-column:1/-1;text-align:center;padding:40px"><p>No gallery images yet for this brand.</p></div>';
    } catch (error) {
        grid.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;padding:40px"><p>Gallery is temporarily unavailable.</p></div>';
    }
}
function toggleMobileNav() { document.getElementById('mobile-nav').classList.toggle('open'); }
function closeMobileNav() { document.getElementById('mobile-nav').classList.remove('open'); }
function closeBanner() { document.getElementById('promo-banner').classList.add('hidden'); sessionStorage.setItem('bannerClosed', 'true'); }
function bindDeveloperPopup() {
    const overlay = document.getElementById('dev-popup-overlay');
    const floatCard = document.getElementById('dev-float-card');
    const floatingWrapper = document.getElementById('dev-floating-wrapper');
    const floatButton = floatingWrapper?.querySelector('.dev-float-btn');
    const closeButton = floatingWrapper?.querySelector('.dev-card-close');
    const popupClose = overlay?.querySelector('.dev-popup-close');

    const openCard = () => floatCard?.classList.add('open');
    const closeCard = () => floatCard?.classList.remove('open');
    const dismissCard = () => {
        closeCard();
        sessionStorage.setItem('developerBannerClosed', 'true');
    };
    const openPopup = () => overlay?.classList.add('open');
    const closePopup = () => overlay?.classList.remove('open');

    floatButton?.addEventListener('click', () => {
        closeCard();
        openPopup();
    });
    closeButton?.addEventListener('click', (event) => {
        event.stopPropagation();
        dismissCard();
    });
    popupClose?.addEventListener('click', closePopup);
    overlay?.addEventListener('click', (event) => {
        if (event.target === overlay) closePopup();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePopup();
            closeCard();
        }
    });
    floatCard?.addEventListener('click', () => {
        closeCard();
        openPopup();
    });

    if (sessionStorage.getItem('developerBannerClosed') !== 'true') {
        setTimeout(openCard, 900);
    }
}
window.addEventListener('load', () => { if (sessionStorage.getItem('bannerClosed') === 'true') document.getElementById('promo-banner')?.classList.add('hidden'); switchBrand(activeBrand); updateCartUI(); bindDeveloperPopup(); });

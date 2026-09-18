const API_BASE = window.API_BASE || 'https://hotinflame.onrender.com/api';
let adminToken = sessionStorage.getItem('adminToken') || '';
let cachedDishes = [];
let selectedDishModule = 'deeksha';
let pendingConfirmation = null;

async function apiRequest(path, options = {}) {
    const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
    if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
    if (!response.ok) throw new Error(result.message || 'Request failed');
    return result;
}
function showAdminToast(message) { const toast = document.getElementById('admin-toast') || document.getElementById('login-message'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
function imageUrl(path) { return path ? `${API_BASE.replace(/\/api\/?$/, '')}${path}` : ''; }

async function adminLogin(event) {
    event.preventDefault();
    try { const result = await apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('admin-user').value.trim(), password: document.getElementById('admin-pass').value }) }); adminToken = result.data.token; sessionStorage.setItem('adminToken', adminToken); sessionStorage.setItem('isAdminLoggedIn', 'true'); window.location.href = 'admin.html'; } catch (error) { showAdminToast(error.message); }
}
function adminLogout() { adminToken = ''; sessionStorage.removeItem('adminToken'); sessionStorage.removeItem('isAdminLoggedIn'); window.location.href = 'admin-login.html'; }
async function ensureAdmin() { if (!adminToken) { window.location.href = 'admin-login.html'; return false; } try { await apiRequest('/admin/me'); return true; } catch { adminLogout(); return false; } }
function switchAdminTab(tab, button) { document.querySelectorAll('.admin-tab').forEach(item => item.classList.remove('active')); document.querySelectorAll('.admin-content').forEach(item => item.classList.remove('active')); button.classList.add('active'); document.getElementById(`tab-${tab}`).classList.add('active'); ({ dishes: () => renderDishes(selectedDishModule), orders: renderOrders, gallery: renderAdminGallery, settings: loadWhatsAppNumber, categories: renderCategories })[tab]?.(); }
async function loadDishes() { cachedDishes = (await apiRequest('/dishes')).data || []; return cachedDishes; }
async function renderDishes(type) { const grid = document.getElementById('admin-dishes-grid'); if (!grid) return; selectedDishModule = type; const dishes = (await loadDishes()).filter(dish => dish.type === type); grid.innerHTML = dishes.length ? dishes.map(dish => `<article class="admin-dish-card"><div class="admin-dish-img">${dish.image ? `<img src="${imageUrl(dish.image)}" alt="${escapeHtml(dish.name)}" style="width:100%;height:150px;object-fit:cover">` : '<div class="dish-img-placeholder">🍽️</div>'}</div><div class="admin-dish-body"><span class="dish-badge">${escapeHtml(dish.category)}</span><h3>${escapeHtml(dish.name)}</h3><p>${escapeHtml(dish.description)}</p>${dish.imageCaption ? `<p class="dish-caption"><i class="fas fa-image"></i> ${escapeHtml(dish.imageCaption)}</p>` : ''}<div class="admin-card-actions"><button class="admin-save-btn" onclick="openDishForm('${type}','${dish._id}')"><i class="fas fa-pen"></i> Edit</button><button class="admin-save-btn" onclick="toggleAvailability('${dish._id}', ${!dish.available})">${dish.available ? 'Available' : 'Hidden'}</button><button class="admin-delete-btn" aria-label="Delete ${escapeHtml(dish.name)}" onclick="deleteDish('${dish._id}')"><i class="fas fa-trash"></i></button></div></div></article>`).join('') : '<p>No dishes in this module yet.</p>'; }
function switchDishModule(type) { selectedDishModule = type; document.getElementById('dish-module-deeksha').className = `btn ${type === 'deeksha' ? 'btn-gold' : 'btn-outline'}`; document.getElementById('dish-module-flamein').className = `btn ${type === 'flamein' ? 'btn-gold' : 'btn-outline'}`; renderDishes(type); }
function openDishForm(type = selectedDishModule, id = '') { const dish = cachedDishes.find(item => item._id === id); selectedDishModule = type; document.getElementById('dish-modal').classList.add('open'); document.getElementById('dish-modal-brand').value = type; document.getElementById('dish-modal-id').value = id; document.getElementById('dish-modal-title').textContent = dish ? 'Edit dish' : 'Add dish'; document.getElementById('dish-modal-name').value = dish?.name || ''; document.getElementById('dish-modal-cat').value = dish?.category || 'starter'; document.getElementById('dish-modal-desc').value = dish?.description || ''; document.getElementById('dish-modal-caption').value = dish?.imageCaption || ''; document.getElementById('dish-modal-img').value = ''; showDishPreview(dish?.image ? imageUrl(dish.image) : ''); }
function closeDishForm() { document.getElementById('dish-modal').classList.remove('open'); }
function showDishPreview(source) { const image = document.getElementById('dish-image-preview'); const label = document.getElementById('dish-image-preview-label'); image.src = source || ''; image.hidden = !source; label.hidden = Boolean(source); }
document.getElementById('dish-modal-img')?.addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { event.target.value = ''; showAdminToast('Use a JPG, PNG, or WEBP image up to 5 MB.'); return; } showDishPreview(URL.createObjectURL(file)); showAdminToast('Image preview ready.'); });
function askForConfirmation(title, message, action) { document.getElementById('confirm-title').textContent = title; document.getElementById('confirm-message').textContent = message; pendingConfirmation = action; document.getElementById('confirm-modal').classList.add('open'); document.getElementById('confirm-action').focus(); }
function closeConfirm() { pendingConfirmation = null; document.getElementById('confirm-modal').classList.remove('open'); }
document.getElementById('confirm-action')?.addEventListener('click', async () => { const action = pendingConfirmation; closeConfirm(); if (action) await action(); });
async function saveDishForm() { const id = document.getElementById('dish-modal-id').value; const form = new FormData(); form.append('name', document.getElementById('dish-modal-name').value.trim()); form.append('category', document.getElementById('dish-modal-cat').value); form.append('description', document.getElementById('dish-modal-desc').value.trim()); form.append('imageCaption', document.getElementById('dish-modal-caption').value.trim()); form.append('type', document.getElementById('dish-modal-brand').value); const file = document.getElementById('dish-modal-img').files[0]; if (file) form.append('image', file); const save = async () => { try { await apiRequest(id ? `/admin/dishes/${id}` : '/admin/dishes', { method: id ? 'PUT' : 'POST', body: form }); closeDishForm(); await renderDishes(form.get('type')); showAdminToast(id ? 'Dish updated successfully.' : 'Dish added successfully.'); } catch (error) { showAdminToast(error.message); } }; if (id) askForConfirmation('Updating dish', 'Are you sure you want to update this dish?', save); else save(); }
async function deleteDish(id) { const dish = cachedDishes.find(item => item._id === id); askForConfirmation('Deleting dish', 'Are you sure you want to delete this dish?', async () => { try { await apiRequest(`/admin/dishes/${id}`, { method: 'DELETE' }); await renderDishes(dish?.type || selectedDishModule); showAdminToast('Dish deleted successfully.'); } catch (error) { showAdminToast(error.message); } }); }
async function toggleAvailability(id, available) { const dish = cachedDishes.find(item => item._id === id); if (!dish) return; const form = new FormData(); form.append('name', dish.name); form.append('category', dish.category); form.append('description', dish.description); form.append('imageCaption', dish.imageCaption || ''); form.append('type', dish.type); form.append('available', available); askForConfirmation('Updating dish', 'Are you sure you want to update this dish?', async () => { try { await apiRequest(`/admin/dishes/${id}`, { method: 'PUT', body: form }); await renderDishes(dish.type); showAdminToast('Availability updated.'); } catch (error) { showAdminToast(error.message); } }); }
async function renderOrders() { const filter = document.getElementById('order-filter').value; const orders = ((await apiRequest('/admin/quotations')).data || []).filter(item => filter === 'all' || item.status === filter); document.getElementById('orders-list').innerHTML = orders.length ? orders.map(order => `<article class="order-record"><div class="order-record-head"><div><strong>${escapeHtml(order.customerName)}</strong><span>${new Date(order.createdAt).toLocaleString()}</span></div><select onchange="updateOrderStatus('${order._id}', this.value)">${['pending','contacted','confirmed','completed','cancelled'].map(status => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><div class="order-record-grid"><span><b>Event</b>${escapeHtml(order.eventType)} · ${escapeHtml(new Date(order.eventDate).toLocaleDateString())}</span><span><b>Guests</b>${order.guestCount}</span><span><b>Phone</b>${escapeHtml(order.phone)}</span><span><b>Email</b>${escapeHtml(order.email)}</span></div><p><b>Details:</b> ${escapeHtml(order.customRequirements || order.message || 'None')}</p></article>`).join('') : '<div class="empty-admin-state">No quotations match this status.</div>'; }
async function updateOrderStatus(id, status) { askForConfirmation('Updating quotation', 'Are you sure you want to update this quotation status?', async () => { try { await apiRequest(`/admin/quotations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); await renderOrders(); showAdminToast('Quotation status updated'); } catch (error) { showAdminToast(error.message); } }); }
async function renderCategories() { const categories = (await apiRequest('/categories')).data || []; document.getElementById('categories-list').innerHTML = categories.map(category => `<article class="order-record"><div class="order-record-head"><strong>${escapeHtml(category.name)}</strong><button class="admin-delete-btn" onclick="deleteCategory('${category._id}')"><i class="fas fa-trash"></i></button></div><p>${escapeHtml(category.description || 'No description')}</p></article>`).join('') || '<div class="empty-admin-state">No categories yet.</div>'; }
async function addCategory() { const name = prompt('Category name:'); if (!name) return; const description = prompt('Category description:', '') || ''; try { await apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify({ name, description }) }); await renderCategories(); showAdminToast('Category added'); } catch (error) { showAdminToast(error.message); } }
async function deleteCategory(id) { askForConfirmation('Deleting category', 'Are you sure you want to delete this category?', async () => { try { await apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }); await renderCategories(); } catch (error) { showAdminToast(error.message); } }); }
async function loadWhatsAppNumber() { try { const result = await apiRequest('/admin/settings/whatsapp'); document.getElementById('set-whatsapp').value = result.data.number; document.getElementById('whatsapp-current').textContent = result.data.number ? `Current: ${result.data.number}` : 'No number configured yet.'; } catch (error) { showAdminToast(error.message); } }
function saveWhatsAppNumber() { const number = document.getElementById('set-whatsapp').value.trim(); askForConfirmation('Updating WhatsApp number', 'Are you sure you want to update the WhatsApp order number?', async () => { try { const result = await apiRequest('/admin/settings/whatsapp', { method: 'PUT', body: JSON.stringify({ number }) }); document.getElementById('whatsapp-current').textContent = `Current: ${result.data.number}`; showAdminToast('WhatsApp order number updated.'); } catch (error) { showAdminToast(error.message); } }); }
async function renderAdminGallery() {
    const grid = document.getElementById('gallery-admin-grid');
    if (!grid) return;
    const brand = document.getElementById('gallery-brand-select')?.value || 'deeksha';
    try {
        const result = await apiRequest(`/admin/gallery?type=${encodeURIComponent(brand)}`);
        const items = result.data || [];
        grid.innerHTML = items.length ? items.map(item => `
            <article class="gallery-admin-card">
                <img src="${imageUrl(item.image)}" alt="${escapeHtml(item.title || 'Gallery image')}">
                <div>
                    <h3>${escapeHtml(item.title || 'Gallery image')}</h3>
                    <p>${escapeHtml(item.caption || 'No caption provided.')}</p>
                    <div class="admin-card-actions">
                        <button class="admin-save-btn" onclick="openGalleryForm('${item._id}', '${brand}')"><i class="fas fa-pen"></i> Edit</button>
                        <button class="admin-delete-btn" onclick="deleteGalleryImage('${item._id}', '${escapeHtml(item.title || 'this gallery image')}')"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            </article>
        `).join('') : '<div class="empty-admin-state">No gallery images yet for this brand.</div>';
    } catch (error) {
        grid.innerHTML = '<div class="empty-admin-state">Gallery could not be loaded right now.</div>';
        showAdminToast(error.message);
    }
}
async function openGalleryForm(id = '', brand = document.getElementById('gallery-brand-select')?.value || 'deeksha') {
    const modal = document.getElementById('gallery-form-modal');
    const titleInput = document.getElementById('gallery-form-title-input');
    const captionInput = document.getElementById('gallery-form-caption');
    const fileInput = document.getElementById('gallery-form-file');
    const submitButton = document.getElementById('gallery-submit-btn');
    const formTitle = document.getElementById('gallery-form-title');
    const hiddenId = document.getElementById('gallery-form-id');
    const hiddenBrand = document.getElementById('gallery-form-brand');
    hiddenId.value = id;
    hiddenBrand.value = brand;
    formTitle.textContent = id ? 'Edit gallery image' : 'Add gallery image';
    submitButton.textContent = id ? 'Update image' : 'Add image';
    titleInput.value = '';
    captionInput.value = '';
    fileInput.value = '';
    const preview = document.getElementById('gallery-image-preview');
    const previewLabel = document.getElementById('gallery-image-preview-label');
    preview.src = '';
    preview.hidden = true;
    previewLabel.hidden = false;

    if (id) {
        try {
            const result = await apiRequest(`/admin/gallery?type=${encodeURIComponent(brand)}`);
            const galleryItem = (result.data || []).find(item => item._id === id) || null;
            if (galleryItem) {
                titleInput.value = galleryItem.title || '';
                captionInput.value = galleryItem.caption || '';
                preview.src = imageUrl(galleryItem.image);
                preview.hidden = false;
                previewLabel.hidden = true;
                sessionStorage.setItem('galleryCache', JSON.stringify(result.data || []));
            }
        } catch (error) {
            showAdminToast(error.message);
        }
    }
    modal.classList.add('open');
}
function closeGalleryForm() { document.getElementById('gallery-form-modal').classList.remove('open'); }
function previewGalleryUpload(file) {
    const preview = document.getElementById('gallery-image-preview');
    const previewLabel = document.getElementById('gallery-image-preview-label');
    if (!file || !file.type.startsWith('image/')) {
        preview.src = '';
        preview.hidden = true;
        previewLabel.hidden = false;
        return;
    }
    const objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    previewLabel.hidden = true;
}
function validateGalleryFile(file) {
    if (!file) return 'Please choose an image.';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Only JPG, PNG, and WEBP images are supported.';
    if (file.size > 5 * 1024 * 1024) return 'Image size must be under 5 MB.';
    return '';
}
document.getElementById('gallery-form-file')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateGalleryFile(file);
    if (error) {
        event.target.value = '';
        showAdminToast(error);
        previewGalleryUpload(null);
        return;
    }
    previewGalleryUpload(file);
    showAdminToast('Image preview ready.');
});
async function saveGalleryItem() {
    const id = document.getElementById('gallery-form-id').value;
    const brand = document.getElementById('gallery-form-brand').value;
    const file = document.getElementById('gallery-form-file').files[0];
    const title = document.getElementById('gallery-form-title-input').value.trim();
    const caption = document.getElementById('gallery-form-caption').value.trim();
    const submitButton = document.getElementById('gallery-submit-btn');
    if (!id && !file) {
        showAdminToast('Please select an image to upload.');
        return;
    }
    if (file) {
        const error = validateGalleryFile(file);
        if (error) { showAdminToast(error); return; }
    }

    const saveAction = async () => {
        const previousText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = id ? 'Updating...' : 'Uploading...';
        try {
            const form = new FormData();
            if (title) form.append('title', title);
            if (caption) form.append('caption', caption);
            form.append('type', brand);
            if (file) form.append('image', file);

            const path = id ? `/admin/gallery/${id}` : '/admin/gallery';
            const method = id ? 'PUT' : 'POST';
            await apiRequest(path, { method, body: form });
            closeGalleryForm();
            await renderAdminGallery();
            showAdminToast(id ? 'Gallery image updated.' : 'Gallery image added.');
        } catch (error) {
            showAdminToast(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = previousText;
        }
    };

    const message = id ? 'Are you sure you want to update this gallery image and caption?' : 'Are you sure you want to add this image to the Art Gallery?';
    askForConfirmation(id ? 'Update gallery image' : 'Add gallery image', message, saveAction);
}
async function deleteGalleryImage(id) {
    const deleteAction = async () => {
        const trigger = document.querySelector(`button[onclick*="deleteGalleryImage('${id}'"]`);
        if (trigger) {
            trigger.disabled = true;
            trigger.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        }
        try {
            await apiRequest(`/admin/gallery/${id}`, { method: 'DELETE' });
            await renderAdminGallery();
            showAdminToast('Gallery image deleted.');
        } catch (error) {
            showAdminToast(error.message);
        } finally {
            if (trigger) {
                trigger.disabled = false;
                trigger.innerHTML = '<i class="fas fa-trash"></i> Delete';
            }
        }
    };
    askForConfirmation('Delete gallery image', 'Are you sure you want to permanently delete this gallery image?', deleteAction);
}
if (document.getElementById('gallery-submit-btn')) {
    document.getElementById('gallery-submit-btn').addEventListener('click', saveGalleryItem);
}
window.addEventListener('load', async () => { if (!document.getElementById('admin-dishes-grid')) return; if (!(await ensureAdmin())) return; await renderDishes(selectedDishModule); await renderOrders(); await renderAdminGallery(); });

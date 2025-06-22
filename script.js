// === Проверка авторизации ===
function checkAuth() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// === Обновление иконки аккаунта / кнопки выхода ===
function updateAuthUI() {
    const accountIcon = document.getElementById("accountIcon");
    if (!accountIcon) return;

    if (checkAuth()) {
        // Кнопка "Выход"
        accountIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>`;
        accountIcon.title = "Выйти";
        accountIcon.onclick = function(e) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('pendingProductId');
                localStorage.removeItem('cart');
                updateAuthUI();
                window.location.reload(); // Перезагрузка для обновления интерфейса
            }
        };
    } else {
        // Иконка аккаунта
        accountIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>`;
        accountIcon.title = "Войти";
        accountIcon.onclick = function(e) {
            e.preventDefault();
            openLoginModal();
        };
    }
}

// === Открытие модального окна авторизации ===
function openLoginModal(productId = null) {
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) return;

    if (checkAuth()) return; // Запрет повторного входа

    loginModal.style.display = 'flex';
    if (productId) localStorage.setItem('pendingProductId', productId);
}

// === Закрытие модального окна ===
function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.style.display = 'none';
}

// === Обработка формы входа ===
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (email && password) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        closeLoginModal();
        updateAuthUI();

        alert('Вы успешно вошли!');

        const pendingId = localStorage.getItem('pendingProductId');
        if (pendingId) {
            localStorage.removeItem('pendingProductId');
            const id = parseInt(pendingId);
            const addButton = document.querySelector(`.add-to-cart[data-id="${id}"]`);
            if (addButton) addButton.click();
        }

        if (window.location.pathname.includes('enter.html')) {
            window.location.href = 'index.html';
        }
    } else {
        alert('Пожалуйста, заполните все поля');
    }
});

// === Закрытие по клику вне формы ===
document.getElementById('loginModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeLoginModal();
});

// === Счётчик корзины ===
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

// === Отображение товаров в корзине ===
function renderCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');

    if (!container) return;

    container.innerHTML = '';
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Ваша корзина пуста.</p>';
        summary.innerHTML = '';
        return;
    }

    let totalPrice = 0;

    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';

        // Картинка
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.name;
        image.className = 'cart-item-image';
        itemDiv.appendChild(image);

        // Информация о букете
        const details = document.createElement('div');
        details.className = 'cart-item-details';

        const name = document.createElement('div');
        name.className = 'cart-item-name';
        name.textContent = item.name;

        const price = document.createElement('div');
        price.className = 'cart-item-price';
        price.textContent = `${item.price} ₽`;

        details.appendChild(name);
        details.appendChild(price);
        itemDiv.appendChild(details);

        // Кнопки +/- и количество
        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';

        const minusBtn = document.createElement('button');
        minusBtn.textContent = '-';
        minusBtn.className = 'quantity-btn minus-btn';
        minusBtn.dataset.id = item.id;

        const quantityText = document.createElement('span');
        quantityText.className = 'quantity-display';
        quantityText.textContent = item.quantity || 1;

        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.className = 'quantity-btn plus-btn';
        plusBtn.dataset.id = item.id;

        controls.appendChild(minusBtn);
        controls.appendChild(quantityText);
        controls.appendChild(plusBtn);

        itemDiv.appendChild(controls);
        container.appendChild(itemDiv);

        // Обработчики событий для кнопок
        minusBtn.addEventListener('click', () => {
            changeQuantity(item.id, -1);
        });

        plusBtn.addEventListener('click', () => {
            changeQuantity(item.id, +1);
        });
        
        totalPrice += item.price * (item.quantity || 1);
    });

    // Обновление суммы
    summary.innerHTML = `
        <div class="summary-row">
            <strong>Итого:</strong>
            <span class="total-price">${totalPrice} ₽</span>
        </div>
    `;
}

// === Изменение количества товара ===
function changeQuantity(id, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(i => i.id === id);

    if (itemIndex > -1) {
        const item = cart[itemIndex];
        item.quantity = (item.quantity || 1) + delta;

        if (item.quantity <= 0) {
            cart.splice(itemIndex, 1); // Удаление товара, если количество = 0
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        updateCartCount();
    }
}

// === При загрузке страницы ===
window.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    updateCartCount();
    renderCartItems();

    document.querySelectorAll('.cart-icon').forEach(icon => {
        icon.addEventListener('click', function(e) {
            if (!checkAuth()) {
                e.preventDefault();
                openLoginModal();
            }
        });
    });

    // Защита от прямого доступа к корзине без авторизации
    if (window.location.pathname.endsWith('korzina.html') && !checkAuth()) {
        const productsGrid = document.querySelector('.products-grid');
        if (productsGrid) productsGrid.innerHTML = `
            <p style="text-align:center;">Для просмотра корзины войдите в аккаунт.</p>
        `;
    }
});
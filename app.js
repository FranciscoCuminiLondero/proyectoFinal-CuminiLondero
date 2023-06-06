// Variables Globales
let cart = []; // Array que almacena los productos del carrito
let productData = []; // Array que almacena los datos de los productos
let selectedProducts = {}; // Objeto que registra los productos seleccionados
const checkoutButton = document.getElementById('checkout-button');
const checkoutForm = document.getElementById('checkout-form');
const enviarButton = document.getElementById('enviar-button');
const cartItemsUl = document.getElementById('cart-items');
const cartTotalP = document.getElementById('cart-total'); 

// Función para actualizar el almacenamiento local con los productos del carrito
function updateCartStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Función para crear un elemento de producto en el carrito
function createCartItemElement(product) {
    const cartItemLi = document.createElement('li');
    const cartItemName = document.createElement('span');
    const cartItemPrice = document.createElement('span');
    const removeButton = document.createElement('button');

    cartItemName.textContent = product.nombre;
    cartItemPrice.textContent = ` - $${product.precio} ARS `;
    removeButton.textContent = 'Eliminar';

    // Evento para eliminar un producto del carrito
    removeButton.addEventListener('click', function () {
        Toastify({
            text: "Eliminado del carrito",
            duration: 2000,
            style: {
                background: "linear-gradient(to right, #e80c0c, #8a0303)",
            }
        }).showToast();
        cart.splice(cart.indexOf(product), 1);
        delete selectedProducts[product.nombre];
        cartItemLi.remove();
        updateCartStorage();
        updateCartTotalAndDisplay();
    });

    cartItemLi.appendChild(cartItemName);
    cartItemLi.appendChild(cartItemPrice);
    cartItemLi.appendChild(removeButton);

    return cartItemLi;
}

// Evento para mostrar el formulario de checkout
checkoutButton.addEventListener('click', function () {
    checkoutForm.style.display = 'block';
    document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
});

// Evento para finalizar la compra
enviarButton.addEventListener('click', checkout);

// Función para actualizar el total del carrito
function updateCartTotal() {
    return cart.reduce((acc, product) => acc + product.precio, 0);
}

// Función para actualizar el total del carrito y mostrarlo en el DOM
function updateCartTotalAndDisplay() {
    const total = updateCartTotal();
    if (total === 0) {
        cartTotalP.textContent = 'Carrito vacío';
        checkoutButton.style.display = 'none';
        checkoutForm.style.display = 'none';
    } else {
        cartTotalP.textContent = `Total carrito: $${total} ARS`;
        checkoutButton.style.display = 'block';
    }
}

// Función para finalizar compra
function checkout() {
    const form = document.getElementById('form');
    const mensaje = document.getElementById('mensaje');
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const dni = document.getElementById('dni').value;

    // Validaciones del formulario
    if (nombre.trim() === '' || apellido.trim() === '' || email.trim() === '' || dni.trim() === '') {
        mensaje.textContent = 'Completar todos los campos del formulario';
        mensaje.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mensaje.textContent = 'Ingrese un correo electrónico válido';
        mensaje.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (dni.length !== 8) {
        mensaje.textContent = 'Ingrese un número de DNI válido';
        mensaje.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    let total = updateCartTotal();

    // Evento para confirmar la compra
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        Swal.fire({
            icon: 'warning',
            title: `
            ¿Querés confirmar la compra?
            Total: $${total} ARS
            `,
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: 'Confirmar compra',
            confirmButtonColor: '#3e8e41',
            denyButtonText: `Seguir comprando`,
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire(`
                ¡La compra se realizó con éxito ${nombre} ${apellido}!
                Nos comunicaremos con usted por ${email} para coordinar el pago
                ¡Muchas Gracias!`, '', 'success');
                cart = [];
                selectedProducts = {};
                updateCartStorage();
                updateCartTotalAndDisplay();
                localStorage.clear();
                setTimeout(function () {
                    location.reload();
                }, 5000);
                checkoutForm.style.display = 'none';
                form.reset();
            } else if (result.isDenied) {
                Swal.fire('No se confirmó la compra...', '', 'error');
                checkoutForm.style.display = 'none';
                mensaje.textContent = '';
            }
        });
    });
}

// Función asincrónica para cargar los productos desde un archivo JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        productData = await response.json();
        const productsDiv = document.getElementById('products');

        // Iterar sobre productos y crear elementos en el DOM
        productData.forEach(function (product) {
            const productDiv = document.createElement('div');
            const name = document.createElement('h3');
            const price = document.createElement('h4');
            const details = document.createElement('p');
            const addButton = document.createElement('button');

            name.textContent = product.nombre;
            price.textContent = `Precio: $${product.precio} ARS`;
            details.textContent = product.descripcion;
            addButton.textContent = 'Agregar al carrito';

            // Evento para agregar un producto al carrito
            addButton.addEventListener('click', function () {
                if (!selectedProducts[product.nombre]) {
                    cart.push(product);
                    selectedProducts[product.nombre] = true;

                    Toastify({
                        text: "Agregado al carrito",
                        duration: 2000,
                        style: {
                            background: "linear-gradient(to right, #0023b0, #7700ff)",
                        }
                    }).showToast();

                    const cartItemLi = createCartItemElement(product);
                    cartItemsUl.appendChild(cartItemLi);
                    updateCartStorage();
                    updateCartTotalAndDisplay();
                }
            });

            productDiv.appendChild(name);
            productDiv.appendChild(price);
            productDiv.appendChild(details);
            productDiv.appendChild(addButton);

            productsDiv.appendChild(productDiv);
        });

        // Agregar productos previamente seleccionados al carrito
        cart.forEach(function (product) {
            const cartItemLi = createCartItemElement(product);
            cartItemsUl.appendChild(cartItemLi);
            selectedProducts[product.nombre] = true;
        });

        updateCartTotalAndDisplay();
    } catch (error) {
        console.log('Error al cargar los productos:', error);
    }
}

// Función para filtrar los productos por precio máximo
function filterProducts() {
    const precioMax = parseInt(document.getElementById('precioMax').value);

    const productsDiv = document.getElementById('products');
    productsDiv.innerHTML = '';

    const filteredProducts = productData.filter(product => product.precio <= precioMax);

    // Iterar sobre los productos filtrados y crear elementos en el DOM
    filteredProducts.forEach(function (product) {
        const productDiv = document.createElement('div');
        const name = document.createElement('h3');
        const price = document.createElement('h4');
        const details = document.createElement('p');
        const addButton = document.createElement('button');

        name.textContent = product.nombre;
        price.textContent = `Precio: $${product.precio} ARS`;
        details.textContent = product.descripcion;
        addButton.textContent = 'Agregar al carrito';

        // Evento click para agregar un producto al carrito
        addButton.addEventListener('click', function () {
            if (!selectedProducts[product.nombre]) {
                cart.push(product);
                selectedProducts[product.nombre] = true;

                Toastify({
                    text: "Agregado al carrito",
                    duration: 2000,
                    style: {
                        background: "linear-gradient(to right, #0023b0, #7700ff)",
                    }
                }).showToast();

                const cartItemLi = createCartItemElement(product);
                cartItemsUl.appendChild(cartItemLi);
                updateCartStorage();
                updateCartTotalAndDisplay();
            }
        });

        productDiv.appendChild(name);
        productDiv.appendChild(price);
        productDiv.appendChild(details);
        productDiv.appendChild(addButton);

        productsDiv.appendChild(productDiv);
    });
}

// Evento para filtrar los productos
document.getElementById('filtrar-button').addEventListener('click', filterProducts);

// Evento para filtrar los productos al presionar Enter en el campo de precio máximo
document.getElementById('precioMax').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        filterProducts();
    }
});

// Obtener el carrito almacenado en el almacenamiento local
const storedCart = localStorage.getItem('cart');
if (storedCart) {
    cart = JSON.parse(storedCart);
}

// Cargar los productos al cargar la página
loadProducts();

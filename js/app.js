// =====================================================
// CONFIGURACIÓN DE DATOS
// =====================================================

// GitHub - fuente principal
const API_GITHUB =
    "https://raw.githubusercontent.com/Juan-Manuel-JMP/techstore-api/main/db.json";

// db.json local - respaldo 
const DB_LOCAL = "./json/db.json";

// Clave para guardar la última copia válida
const CACHE_PRODUCTOS = "nexttech_productos_cache";


// =====================================================
// ESTADO
// =====================================================

let productos = [];

let carrito =
    JSON.parse(localStorage.getItem("carrito")) || [];


// =====================================================
// DOM
// =====================================================

const gridProductos =
    document.getElementById("grid-productos");

const contadorCarrito =
    document.getElementById("contador-carrito");

const modalCarrito =
    document.getElementById("modal-carrito");

const btnCarrito =
    document.getElementById("btn-carrito");

const cerrarCarrito =
    document.getElementById("cerrar-carrito");

const listaCarrito =
    document.getElementById("lista-carrito");

const totalCarrito =
    document.getElementById("total-carrito");

const btnCheckout =
    document.getElementById("btn-checkout");

const modalPreview =
    document.getElementById("modal-preview");

const cerrarPreview =
    document.getElementById("cerrar-preview");

const previewDetalles =
    document.getElementById("preview-detalles");

const filtroBotones =
    document.querySelectorAll(".filtro-btn");

const menuToggle =
    document.getElementById("menu-toggle");

const navMenu =
    document.getElementById("nav-menu");


// =====================================================
// INICIO
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    obtenerProductos();

    actualizarCarritoUI();

    configurarEventos();

});


// =====================================================
// OBTENER PRODUCTOS
// =====================================================
//
// PRIORIDAD:
//
// 1. GitHub
// 2. db.json local
// 3. localStorage
//
// =====================================================

async function obtenerProductos() {

    // -------------------------------------------------
    // 1. INTENTAR GITHUB
    // -------------------------------------------------

    try {

        console.log("Intentando cargar productos desde GitHub...");

        const respuestaGitHub = await fetch(
            `${API_GITHUB}?t=${Date.now()}`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!respuestaGitHub.ok) {

            throw new Error(
                `GitHub respondió HTTP ${respuestaGitHub.status}`
            );

        }

        const datosGitHub =
            await respuestaGitHub.json();

        const productosGitHub =
            normalizarProductos(datosGitHub);

        if (!productosGitHub.length) {

            throw new Error(
                "El db.json de GitHub no contiene productos válidos."
            );

        }

        productos =
            productosGitHub;

        guardarCacheProductos(productos);

        console.log(
            `✅ ${productos.length} productos cargados desde GitHub.`
        );

        renderizarProductos(productos);

        return;

    } catch (error) {

        console.warn(
            "⚠️ GitHub no disponible:",
            error.message
        );

    }


    // -------------------------------------------------
    // 2. INTENTAR DB.JSON LOCAL
    // -------------------------------------------------

    try {

        console.log(
            "Intentando cargar respaldo local /json/db.json..."
        );

        const respuestaLocal =
            await fetch(
                `${DB_LOCAL}?t=${Date.now()}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

        if (!respuestaLocal.ok) {

            throw new Error(
                `db.json local respondió HTTP ${respuestaLocal.status}`
            );

        }

        const datosLocal =
            await respuestaLocal.json();

        const productosLocal =
            normalizarProductos(datosLocal);

        if (!productosLocal.length) {

            throw new Error(
                "El db.json local no contiene productos válidos."
            );

        }

        productos =
            productosLocal;

        guardarCacheProductos(productos);

        console.log(
            `📦 ${productos.length} productos cargados desde ./db.json`
        );

        renderizarProductos(productos);

        return;

    } catch (error) {

        console.warn(
            "No se pudo cargar ./db.json:",
            error.message
        );

    }


    // -------------------------------------------------
    // 3. INTENTAR CACHE LOCAL
    // -------------------------------------------------

    try {

        console.log(
            "Intentando recuperar productos desde localStorage..."
        );

        const cache =
            localStorage.getItem(
                CACHE_PRODUCTOS
            );

        if (!cache) {

            throw new Error(
                "No existe una copia guardada."
            );

        }

        const datosCache =
            JSON.parse(cache);

        const productosCache =
            normalizarProductos(datosCache);

        if (!productosCache.length) {

            throw new Error(
                "La copia almacenada no contiene productos válidos."
            );

        }

        productos =
            productosCache;

        console.log(
            `${productos.length} productos recuperados desde localStorage.`
        );

        renderizarProductos(productos);

        return;

    } catch (error) {

        console.error(
            "No se pudo cargar ninguna fuente de productos:",
            error.message
        );

        productos = [];

        mostrarErrorProductos();

    }

}


// =====================================================
// NORMALIZAR PRODUCTOS
// =====================================================
//
// Permite trabajar tanto si db.json tiene:
//
// {
//     "productos": [...]
//
// }
//
// como si directamente tiene:
//
// [...]
//
// =====================================================

function normalizarProductos(datos) {

    let lista = [];

    if (Array.isArray(datos)) {

        lista = datos;

    } else if (
        datos &&
        Array.isArray(datos.productos)
    ) {

        lista = datos.productos;

    }


    return lista
        .filter(producto => producto)
        .map(producto => ({

            id:
                Number(producto.id),

            nombre:
                producto.nombre || "Producto sin nombre",

            categoria:
                producto.categoria || "Otros",

            precio:
                Number(producto.precio) || 0,

            descripcion:
                producto.descripcion ||
                "Sin descripción disponible.",

            imagen:
                producto.imagen ||
                ""

        }))
        .filter(producto =>
            Number.isFinite(producto.id)
        );

}


// =====================================================
// CACHE DE PRODUCTOS
// =====================================================

function guardarCacheProductos(lista) {

    try {

        localStorage.setItem(
            CACHE_PRODUCTOS,
            JSON.stringify(lista)
        );

    } catch (error) {

        console.warn(
            "No se pudo guardar la cache:",
            error.message
        );

    }

}


// =====================================================
// ERROR DE PRODUCTOS
// =====================================================

function mostrarErrorProductos() {

    gridProductos.innerHTML = `

        <div
            class="empty-products"
            style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 3rem;
            "
        >

            <i
                class="fa-solid fa-triangle-exclamation"
                style="
                    font-size: 2rem;
                    color: #f59e0b;
                    margin-bottom: 1rem;
                "
            ></i>

            <p>
                No se pudieron cargar los productos.
            </p>

            <small
                style="
                    display: block;
                    margin-top: 0.5rem;
                    color: #94a3b8;
                "
            >
                Verifica la conexión y que exista el archivo db.json.
            </small>

        </div>

    `;

}


// =====================================================
// RENDER PRODUCTOS
// =====================================================

function renderizarProductos(arrayProductos) {

    gridProductos.innerHTML = "";

    if (!arrayProductos.length) {

        gridProductos.innerHTML = `

            <div
                class="empty-products"
                style="grid-column: 1 / -1;"
            >

                <p>
                    No hay productos en esta categoría.
                </p>

            </div>

        `;

        return;

    }


    arrayProductos.forEach(prod => {

        const card =
            document.createElement("article");

        card.classList.add("card");


        card.innerHTML = `

            <div class="card-img-container">

                <span class="tag-categoria">
                    ${escaparHTML(prod.categoria)}
                </span>

                <img
                    src="${escaparAtributo(prod.imagen)}"
                    alt="${escaparAtributo(prod.nombre)}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23111827%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-family=%22Arial%22 font-size=%2224%22%3EImagen no disponible%3C/text%3E%3C/svg%3E';"
                >

            </div>


            <div class="card-body">

                <h3>
                    ${escaparHTML(prod.nombre)}
                </h3>

                <p>
                    ${escaparHTML(prod.descripcion)}
                </p>


                <div class="card-footer-flex">

                    <span class="precio">
                        $${formatearPrecio(prod.precio)}
                    </span>

                </div>


                <div class="card-actions">

                    <button
                        class="btn-preview"
                        type="button"
                        onclick="abrirPreview(${prod.id})"
                    >

                        <i class="fa-solid fa-eye"></i>

                        Ver

                    </button>


                    <button
                        class="btn-agregar"
                        type="button"
                        onclick="agregarAlCarrito(${prod.id})"
                    >

                        <i class="fa-solid fa-cart-plus"></i>

                        Comprar

                    </button>

                </div>

            </div>

        `;


        gridProductos.appendChild(card);

    });

}


// =====================================================
// IMAGEN DE RESPALDO
// =====================================================

function imagenRespaldo(event) {

    const img =
        event.currentTarget;

    if (img.dataset.fallbackUsado) {
        return;
    }

    img.dataset.fallbackUsado = "true";

    img.src =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="600"
                height="400"
                viewBox="0 0 600 400"
            >

                <rect
                    width="600"
                    height="400"
                    fill="#111827"
                />

                <text
                    x="50%"
                    y="50%"
                    dominant-baseline="middle"
                    text-anchor="middle"
                    fill="#94a3b8"
                    font-family="Arial"
                    font-size="24"
                >
                    Imagen no disponible
                </text>

            </svg>
        `);

}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(valor) {

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// ESCAPAR ATRIBUTOS
// =====================================================

function escaparAtributo(valor) {

    return escaparHTML(valor);

}


// =====================================================
// FORMATEAR PRECIO
// =====================================================

function formatearPrecio(precio) {

    return Number(precio || 0)
        .toFixed(2);

}


// =====================================================
// MODALES
// =====================================================

function abrirModal(modal) {

    modal.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );

}


function cerrarModal(modal) {

    modal.style.display = "none";

    const algunModalAbierto =
        modalCarrito.style.display === "flex" ||
        modalPreview.style.display === "flex";

    if (!algunModalAbierto) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


// =====================================================
// EVENTOS
// =====================================================

function configurarEventos() {


    // -------------------------------------------------
    // CARRITO
    // -------------------------------------------------

    btnCarrito.addEventListener(
        "click",
        () =>
            abrirModal(modalCarrito)
    );


    cerrarCarrito.addEventListener(
        "click",
        () =>
            cerrarModal(modalCarrito)
    );


    // -------------------------------------------------
    // PREVIEW
    // -------------------------------------------------

    cerrarPreview.addEventListener(
        "click",
        () =>
            cerrarModal(modalPreview)
    );


    // -------------------------------------------------
    // CLICK FUERA
    // -------------------------------------------------

    window.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modalCarrito
            ) {

                cerrarModal(
                    modalCarrito
                );

            }


            if (
                event.target ===
                modalPreview
            ) {

                cerrarModal(
                    modalPreview
                );

            }

        }
    );


    // -------------------------------------------------
    // ESC
    // -------------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            if (
                modalCarrito.style.display ===
                "flex"
            ) {

                cerrarModal(
                    modalCarrito
                );

            }


            if (
                modalPreview.style.display ===
                "flex"
            ) {

                cerrarModal(
                    modalPreview
                );

            }

        }
    );


    // -------------------------------------------------
    // MENÚ MOBILE
    // -------------------------------------------------

    menuToggle.addEventListener(
        "click",
        () => {

            const activo =
                navMenu.classList.toggle(
                    "active"
                );

            menuToggle.setAttribute(
                "aria-expanded",
                activo
                    ? "true"
                    : "false"
            );

        }
    );


    navMenu
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    navMenu.classList.remove(
                        "active"
                    );

                    menuToggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        });


    // -------------------------------------------------
    // FILTROS
    // -------------------------------------------------

    filtroBotones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                event => {

                    filtroBotones.forEach(
                        b =>
                            b.classList.remove(
                                "activo"
                            )
                    );


                    event.currentTarget.classList.add(
                        "activo"
                    );


                    const categoria =
                        event.currentTarget
                            .getAttribute(
                                "data-categoria"
                            );


                    if (
                        categoria ===
                        "todos"
                    ) {

                        renderizarProductos(
                            productos
                        );

                        return;

                    }


                    const filtrados =
                        productos.filter(
                            producto =>
                                producto.categoria ===
                                categoria
                        );


                    renderizarProductos(
                        filtrados
                    );

                }
            );

        }
    );


    // -------------------------------------------------
    // CHECKOUT
    // -------------------------------------------------

    btnCheckout.addEventListener(
        "click",
        ejecutarPasarelaDePago
    );

}


// =====================================================
// PREVIEW PRODUCTO
// =====================================================

window.abrirPreview =
    function(id) {

        const producto =
            productos.find(
                p =>
                    p.id === id
            );


        if (!producto) {

            return;

        }


        previewDetalles.innerHTML = `

            <div class="preview-producto">

                <div class="preview-image-wrapper">

                    <img
                        src="${escaparAtributo(producto.imagen)}"
                        alt="${escaparAtributo(producto.nombre)}"
                        class="preview-imagen"
                        onerror="imagenRespaldo(event)"
                    >

                </div>


                <span
                    class="tag-categoria preview-categoria"
                >
                    ${escaparHTML(producto.categoria)}
                </span>


                <h2>
                    ${escaparHTML(producto.nombre)}
                </h2>


                <p>
                    ${escaparHTML(producto.descripcion)}
                </p>


                <h3 class="preview-precio">
                    $${formatearPrecio(producto.precio)}
                </h3>


                <button
                    class="btn-success"
                    type="button"
                    onclick="
                        agregarAlCarrito(${producto.id});
                        cerrarModal(modalPreview);
                    "
                >

                    <i class="fa-solid fa-cart-plus"></i>

                    Agregar al Carrito

                </button>

            </div>

        `;


        abrirModal(
            modalPreview
        );

    };


// =====================================================
// AGREGAR AL CARRITO
// =====================================================

window.agregarAlCarrito =
    function(id) {

        const producto =
            productos.find(
                p =>
                    p.id === id
            );


        if (!producto) {

            return;

        }


        const itemEnCarrito =
            carrito.find(
                item =>
                    item.id === id
            );


        if (itemEnCarrito) {

            itemEnCarrito.cantidad++;

        } else {

            carrito.push({

                ...producto,

                cantidad: 1

            });

        }


        sincronizarStorage();

        actualizarCarritoUI();


        Swal.fire({

            icon: "success",

            title: "¡Producto agregado!",

            text:
                `${producto.nombre} se agregó correctamente al carrito.`,

            timer: 1400,

            showConfirmButton: false,

            background: "#1e293b",

            color: "#f8fafc",

            iconColor: "#10b981"

        });

    };


// =====================================================
// ACTUALIZAR CARRITO
// =====================================================

function actualizarCarritoUI() {

    listaCarrito.innerHTML = "";

    let totalAcumulado = 0;

    let cantidadTotalItems = 0;


    if (!carrito.length) {

        listaCarrito.innerHTML = `

            <div class="empty-cart">

                <p>
                    Tu carrito está vacío.
                </p>

            </div>

        `;

    }


    carrito.forEach(item => {

        totalAcumulado +=
            Number(item.precio) *
            Number(item.cantidad);


        cantidadTotalItems +=
            Number(item.cantidad);


        const div =
            document.createElement(
                "div"
            );


        div.classList.add(
            "cart-item"
        );


        div.innerHTML = `

            <img
                src="${escaparAtributo(item.imagen)}"
                alt="${escaparAtributo(item.nombre)}"
                onerror="imagenRespaldo(event)"
            >


            <div class="cart-item-info">

                <h4>
                    ${escaparHTML(item.nombre)}
                </h4>

                <p>
                    $${formatearPrecio(item.precio)}
                    × ${item.cantidad}
                </p>

            </div>


            <button
                class="btn-eliminar-item"
                type="button"
                onclick="eliminarItemCarrito(${item.id})"
                title="Eliminar producto"
                aria-label="Eliminar ${escaparAtributo(item.nombre)}"
            >

                <i class="fa-solid fa-trash"></i>

            </button>

        `;


        listaCarrito.appendChild(
            div
        );

    });


    contadorCarrito.textContent =
        cantidadTotalItems;


    totalCarrito.textContent =
        totalAcumulado.toFixed(2);

}


// =====================================================
// ELIMINAR ITEM
// =====================================================

window.eliminarItemCarrito =
    function(id) {

        carrito =
            carrito.filter(
                item =>
                    item.id !== id
            );


        sincronizarStorage();

        actualizarCarritoUI();

    };


// =====================================================
// LOCAL STORAGE
// =====================================================

function sincronizarStorage() {

    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );

}


// =====================================================
// CHECKOUT
// =====================================================

async function ejecutarPasarelaDePago() {

    if (!carrito.length) {

        Swal.fire({

            icon: "warning",

            title: "Carrito Vacío",

            text:
                "Debes agregar al menos un producto para proceder al pago.",

            background: "#1e293b",

            color: "#f8fafc"

        });

        return;

    }


    cerrarModal(
        modalCarrito
    );


    const {
        value: datosTarjeta
    } = await Swal.fire({

        title:
            "Pasarela de Pago Segura",

        html: `
            <div class="payment-form">

                <label for="p-nombre">
                    Nombre en la Tarjeta
                </label>

                <input
                    id="p-nombre"
                    class="swal2-input"
                    placeholder="Ej. Juan Manuel"
                >

                <label for="p-tarjeta">
                    Número de Tarjeta
                </label>

                <input
                    id="p-tarjeta"
                    class="swal2-input"
                    placeholder="4532 •••• •••• 8920"
                    maxlength="16"
                    inputmode="numeric"
                >

                <div class="payment-row">
                    <div>
                        <label for="p-exp">
                            Expiración
                        </label>

                        <input
                            id="p-exp"
                            class="swal2-input"
                            placeholder="MM/AA"
                            maxlength="5"
                        >

                    </div>


                    <div>

                        <label for="p-cvv">
                            CVV / CVC
                        </label>

                        <input
                            id="p-cvv"
                            class="swal2-input"
                            placeholder="123"
                            type="password"
                            maxlength="4"
                            inputmode="numeric"
                        >
                    </div>
                </div>
            </div>
        `,

        focusConfirm: false,

        showCancelButton: true,

        confirmButtonText:
            "Confirmar y Pagar",

        cancelButtonText:
            "Cancelar",

        background: "#1e293b",

        color: "#f8fafc",

        confirmButtonColor:
            "#6366f1",

        preConfirm: () => {

            const nombre =
                document
                    .getElementById(
                        "p-nombre"
                    )
                    .value
                    .trim();


            const tarjeta =
                document
                    .getElementById(
                        "p-tarjeta"
                    )
                    .value
                    .replace(
                        /\s/g,
                        ""
                    );


            const exp =
                document
                    .getElementById(
                        "p-exp"
                    )
                    .value
                    .trim();


            const cvv =
                document
                    .getElementById(
                        "p-cvv"
                    )
                    .value
                    .trim();


            if (
                !nombre ||
                tarjeta.length < 16 ||
                !exp ||
                !cvv
            ) {

                Swal.showValidationMessage(
                    "Por favor completa todos los datos correctamente."
                );

                return false;

            }


            return {

                nombre

            };

        }

    });


    if (!datosTarjeta) {

        return;

    }


    Swal.fire({

        title:
            "Procesando Transacción...",

        text:
            "Conectando con la entidad financiera.",

        allowOutsideClick: false,

        background: "#1e293b",

        color: "#f8fafc",

        didOpen: () => {

            Swal.showLoading();

        }

    });


    setTimeout(
        () => {

            Swal.fire({

                icon: "success",

                title:
                    "¡Compra Exitosa!",

                text:
                    `¡Felicidades ${datosTarjeta.nombre}! Tu pedido de tecnología está siendo procesado para envío express.`,

                confirmButtonText:
                    "Finalizar",

                background: "#1e293b",

                color: "#f8fafc",

                confirmButtonColor:
                    "#10b981"

            });


            carrito = [];

            sincronizarStorage();

            actualizarCarritoUI();

        },
        2200
    );

}


document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM listo, iniciando app');

    // === 1. LÓGICA DE HORARIO (Centralizada) ===
    const ahora = new Date();
    const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    // Horario: 12:30 (750 min) a 15:00 (900 min)
    const dentroDelHorario = totalMinutos >= 750 && totalMinutos <= 900;
    
    console.log(`⏰ Minutos actuales: ${totalMinutos} | ¿Está en horario?: ${dentroDelHorario}`);

    // Destacar "Menú del Día" en el nav si está en horario
    const menuDiaLink = document.querySelector(".menu-dia-link");
    if (menuDiaLink) {
        dentroDelHorario ? menuDiaLink.classList.add("destacado") : menuDiaLink.classList.remove("destacado");
    }

    // === 2. MENÚ HAMBURGUESA + SCROLL SUAVE ===
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('menuNav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        document.querySelectorAll('.menu-nav a').forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const id = href.slice(1);
                    const el = document.getElementById(id);
                    if (!el) return;
                    const y = el.getBoundingClientRect().top + window.scrollY - 110;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                    nav.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        });
    }

    // === 3. CONFIGURACIÓN Y CARGA DE FIREBASE ===
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js").then(async ({ initializeApp }) => {
        const { getDatabase, ref, get, child } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");

        const firebaseConfig = {
            apiKey: "AIzaSyAjPnsWU7bdiRl12bYM-UdgpEJZcePBcnE",
            authDomain: "menubarrancas.firebaseapp.com",
            databaseURL: "https://menubarrancas-default-rtdb.firebaseio.com",
            projectId: "menubarrancas",
            storageBucket: "menubarrancas.firebasestorage.app",
            messagingSenderId: "415717810155",
            appId: "1:415717810155:web:8a41095ab084acea65c3ae"
        };

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);

        async function cargarCarta() {
            const menuContainer = document.getElementById('menu');
            if (!menuContainer) return;

            try {
                const snapshot = await get(child(ref(db), '/'));
                if (!snapshot.exists()) {
                    console.warn("⚠️ No se encontraron datos en Firebase.");
                    return;
                }

                const data = snapshot.val();
                const base = data.entrada || data;
                menuContainer.innerHTML = '';

                // 1. Renderizar Menú del Día
                if (base['menu-dia']) {
                    renderMenuDia(base['menu-dia'], menuContainer);
                }

                // 2. Renderizar Platos y Bebidas
                const grupos = ['platos', 'bebidas'];
                grupos.forEach(grupo => {
                    if (base[grupo]) {
                        Object.entries(base[grupo]).forEach(([id, categoria]) => {
                            renderSeccion(id, categoria, menuContainer);
                        });
                    }
                });

                console.log("✅ Menú cargado con éxito");

            } catch (err) {
                console.error('💥 Error cargando carta:', err);
            }
        }

        function renderMenuDia(data, container) {
            const section = document.createElement("section");
            section.className = "menu-dia";
            section.id = "menu-dia";

            // Helper para convertir {0: "...", 1: "..."} o Array en una lista real
            const obtenerLista = (campo) => {
                const valor = data[campo];
                if (!valor) return [];
                return Array.isArray(valor) ? valor : Object.values(valor);
            };

            const listaPlatos = obtenerLista('Platos');
            const listaPostres = obtenerLista('Postres');
            const listaBebidas = obtenerLista('Bebidas');

            section.innerHTML = `
                <div class="menu-dia-header ${dentroDelHorario ? "" : "fuera-horario"}">
                    <h2>${data.Categoria || 'Menú del Día'}</h2>
                    <p class="horario">Disponible de ${data.Horario || '12:30 a 15:00'}</p>
                    <p class="precio">$${Number(data.Precio).toLocaleString("es-AR")} <small>p/p</small></p>
                    ${!dentroDelHorario ? '<button id="btnVerDia" class="btn-ver-menu">Ver opciones igualmente</button>' : ''}
                </div>
                <div class="menu-dia-opciones ${dentroDelHorario ? 'open' : ''}" id="contDia" style="${dentroDelHorario ? 'display:flex;' : 'display:none;'}">
                    <div class="columna">
                        <h3>Principales</h3>
                        <ul>${listaPlatos.length > 0 ? listaPlatos.map(p => `<li>${p}</li>`).join('') : '<li>Consultar</li>'}</ul>
                    </div>
                    <div class="columna">
                        <h3>Postres</h3>
                        <ul>${listaPostres.length > 0 ? listaPostres.map(p => `<li>${p}</li>`).join('') : '<li>Consultar</li>'}</ul>
                    </div>
                    <div class="columna">
                        <h3>Bebidas</h3>
                        <ul>${listaBebidas.length > 0 ? listaBebidas.map(p => `<li>${p}</li>`).join('') : '<li>Consultar</li>'}</ul>
                    </div>
                </div>
            `;
            container.appendChild(section);

            const btn = section.querySelector("#btnVerDia");
            if (btn) {
                btn.onclick = () => {
                    const cont = section.querySelector("#contDia");
                    const isHidden = cont.style.display === "none";
                    cont.style.display = isHidden ? "flex" : "none";
                    btn.textContent = isHidden ? "Ocultar opciones" : "Ver opciones igualmente";
                };
            }
        }

        function renderSeccion(id, categoria, container) {
            const items = categoria.Platos || categoria.Bebidas || [];
            if (Object.keys(items).length === 0) return;

            const section = document.createElement('section');
            section.className = 'menu-section';
            section.id = id;
            section.innerHTML = `<div class="section-header"><h2>${categoria.Categoria || id}</h2></div>`;

            Object.values(items).forEach(item => {
                const nombre = item.Plato || item.bebida || 'Sin nombre';
                const precioNum = Number(item.Precio || item.precio);
                const precioFormat = !isNaN(precioNum) && precioNum > 0 ? `$${precioNum.toLocaleString('es-AR')}` : '';

                const itemDiv = document.createElement('div');
                itemDiv.className = 'menu-item';
                itemDiv.innerHTML = `
                    <div class="info">
                        <h3>${nombre}</h3>
                        <p>${item.Descripcion || ''}</p>
                    </div>
                    <span class="price">${precioFormat}</span>
                `;
                section.appendChild(itemDiv);
            });
            container.appendChild(section);
        }

        cargarCarta();

    }).catch(err => console.error("❌ Error Firebase:", err));

    // === 4. EFECTOS VISUALES (Sticky Header) ===
    window.addEventListener("scroll", () => {
        document.querySelectorAll(".section-header").forEach(header => {
            const rect = header.getBoundingClientRect();
            if (rect.top <= 0 && rect.bottom > 0) {
                header.classList.add("is-sticky");
            } else {
                header.classList.remove("is-sticky");
            }
        });
    });
});

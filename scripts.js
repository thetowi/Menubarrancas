document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM listo, iniciando app');

    // === DESTACAR "MENÚ DEL DÍA" SI ESTÁ EN HORARIO ===
    const ahora = new Date();
    const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    const dentroDelHorario = totalMinutos >= 750 && totalMinutos <= 900;

    const menuDiaLink = document.querySelector(".menu-dia-link");
    if (menuDiaLink) {
        dentroDelHorario ? menuDiaLink.classList.add("destacado") : menuDiaLink.classList.remove("destacado");
    }

    // ===== MENÚ HAMBURGUESA + SCROLL SUAVE =====
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('menuNav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        document.querySelectorAll('.menu-nav a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const id = a.getAttribute('href').slice(1);
                const el = document.getElementById(id);
                if (!el) return;
                const y = el.getBoundingClientRect().top + window.scrollY - 110;
                window.scrollTo({ top: y, behavior: 'smooth' });
                nav.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
// === CONFIGURACIÓN DE HORARIO ===
    const ahora = new Date();
    const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    const dentroDelHorario = totalMinutos >= 750 && totalMinutos <= 900; 
    console.log(`⏰ Minutos actuales: ${totalMinutos} | ¿Está en horario?: ${dentroDelHorario}`);

    // === FIREBASE ===
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
                        console.log("raw_data_from_firebase:", data); // 👀 MIRA ESTO EN CONSOLA
        
                        const base = data.entrada || data;
                        console.log("base_para_renderizar:", base); // 👀 MIRA ESTO EN CONSOLA
        
                        menuContainer.innerHTML = '';
        
                        // 1. CARGAR MENÚ DEL DÍA
                        if (base['menu-dia']) {
                            console.log("🔎 Detectado 'menu-dia':", base['menu-dia']);
                            renderMenuDia(base['menu-dia'], menuContainer);
                        } else {
                            console.error("❌ No existe la clave 'menu-dia' en la base de datos.");
                        }
        
                        // 2. CARGAR PLATOS Y BEBIDAS RESTANTES
                        const grupos = ['platos', 'bebidas'];
                        grupos.forEach(grupo => {
                            if (base[grupo]) {
                                Object.entries(base[grupo]).forEach(([id, categoria]) => {
                                    renderSeccion(id, categoria, menuContainer);
                                });
                            }
                        });
        
                    } catch (err) {
                        console.error('💥 Error cargando carta:', err);
                    }
                }
        
                function renderMenuDia(data, container) {
                    console.log("Datos recibidos en renderMenuDia:", data);
                
                    const section = document.createElement("section");
                    section.className = "menu-dia";
                    section.id = "menu-dia";
                
                    // --- CORRECCIÓN DE JERARQUÍA ---
                    // Convertimos el objeto {0: "plato", 1: "plato"} en una lista real ["plato", "plato"]
                    // Buscamos específicamente "Platos", "Postres" y "Bebidas" (con Mayúscula inicial)
                    const obtenerLista = (campo) => {
                        const valor = data[campo]; 
                        if (!valor) return [];
                        // Si es objeto lo volvemos array, si ya es array lo dejamos igual
                        return Array.isArray(valor) ? valor : Object.values(valor);
                    };
                
                    const listaPlatos = obtenerLista('Platos');
                    const listaPostres = obtenerLista('Postres');
                    const listaBebidas = obtenerLista('Bebidas');
                
                    console.log("Listas procesadas:", { listaPlatos, listaPostres, listaBebidas });
                
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
                
                    // Evento del botón
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
        
                // --- LAS OTRAS FUNCIONES SE MANTIENEN ---
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
                        itemDiv.innerHTML = `<div class="info"><h3>${nombre}</h3><p>${item.Descripcion || ''}</p></div><span class="price">${precioFormat}</span>`;
                        section.appendChild(itemDiv);
                    });
                    container.appendChild(section);
                }
        
                cargarCarta();
        
            }).catch(err => console.error("❌ Error Firebase:", err));
        });
    // STICKY HEADER
    window.addEventListener("scroll", () => {
        document.querySelectorAll(".section-header").forEach(header => {
            const rect = header.getBoundingClientRect();
            if (rect.top <= 0 && rect.bottom > 0) header.classList.add("is-sticky");
            else header.classList.remove("is-sticky");
        });
    });
});

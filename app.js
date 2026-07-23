"use strict";

const CLAVE_DIRECCION_SERVIDOR =
    "giowMediaServerAddress";

const direccionServidorInput =
    document.getElementById("direccionServidor");

const estadoServidor =
    document.getElementById("estadoServidor");

const contadorCanciones =
    document.getElementById("contadorCanciones");

const listaCanciones =
    document.getElementById("listaCanciones");

const mensajeVacio =
    document.getElementById("mensajeVacio");

const cancionActual =
    document.getElementById("cancionActual");

const estadoReproduccion =
    document.getElementById("estadoReproduccion");

const reproductorAudio =
    document.getElementById("reproductorAudio");

const barraProgreso =
    document.getElementById("barraProgreso");

const tiempoActual =
    document.getElementById("tiempoActual");

const duracionTotal =
    document.getElementById("duracionTotal");

const botonProbarConexion =
    document.getElementById("botonProbarConexion");

const botonActualizar =
    document.getElementById("botonActualizar");

const botonGuardarDireccion =
    document.getElementById("botonGuardarDireccion");

const botonAnterior =
    document.getElementById("botonAnterior");

const botonReproducir =
    document.getElementById("botonReproducir");

const botonPausar =
    document.getElementById("botonPausar");

const botonDetener =
    document.getElementById("botonDetener");

const botonSiguiente =
    document.getElementById("botonSiguiente");

let canciones = [];
let indiceActual = -1;

function obtenerDireccionServidor() {
    let direccion =
        direccionServidorInput.value.trim();

    if (!direccion) {
        direccion =
            "http://0.0.0.0:5245";
    }

    return direccion.replace(/\/+$/, "");
}

function guardarDireccionServidor() {
    const direccion =
        obtenerDireccionServidor();

    localStorage.setItem(
        CLAVE_DIRECCION_SERVIDOR,
        direccion
    );

    direccionServidorInput.value =
        direccion;

    alert(
        `Dirección guardada:\n${direccion}`
    );
}

function cargarDireccionGuardada() {
    const direccionGuardada =
        localStorage.getItem(
            CLAVE_DIRECCION_SERVIDOR
        );

    if (direccionGuardada) {
        direccionServidorInput.value =
            direccionGuardada;
    }
}

function establecerEstadoServidor(
    mensaje,
    tipo = "normal"
) {
    estadoServidor.textContent = mensaje;

    estadoServidor.classList.remove(
        "estado-correcto",
        "estado-error",
        "estado-advertencia"
    );

    if (tipo === "correcto") {
        estadoServidor.classList.add(
            "estado-correcto"
        );
    }

    if (tipo === "error") {
        estadoServidor.classList.add(
            "estado-error"
        );
    }

    if (tipo === "advertencia") {
        estadoServidor.classList.add(
            "estado-advertencia"
        );
    }
}

async function probarConexion(
    mostrarMensaje = false
) {
    const direccion =
        obtenerDireccionServidor();

    establecerEstadoServidor(
        "Comprobando servidor...",
        "advertencia"
    );

    try {
        const respuesta = await fetch(
            `${direccion}/api/status`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}.`
            );
        }

        establecerEstadoServidor(
            "Servidor conectado",
            "correcto"
        );

        if (mostrarMensaje) {
            alert(
                "Giow Music Player se conectó correctamente con el servidor."
            );
        }

        return true;
    } catch (error) {
        console.error(error);

        establecerEstadoServidor(
            "Servidor desconectado",
            "error"
        );

        if (mostrarMensaje) {
            alert(
                `No fue posible conectar con el servidor.\n\n${error.message}`
            );
        }

        return false;
    }
}

async function cargarBiblioteca() {
    const conectado =
        await probarConexion(false);

    if (!conectado) {
        canciones = [];
        indiceActual = -1;
        mostrarCanciones();
        return;
    }

    const direccion =
        obtenerDireccionServidor();

    try {
        const respuesta = await fetch(
            `${direccion}/api/library/music`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `No se pudo cargar la biblioteca. Código ${respuesta.status}.`
            );
        }

        const datos =
            await respuesta.json();

        canciones =
            Array.isArray(datos)
                ? datos
                : [];

        mostrarCanciones();
    } catch (error) {
        console.error(error);

        canciones = [];
        mostrarCanciones();

        alert(
            `Error al cargar la biblioteca.\n\n${error.message}`
        );
    }
}

function mostrarCanciones() {
    listaCanciones.innerHTML = "";

    contadorCanciones.textContent =
        canciones.length === 1
            ? "1 canción"
            : `${canciones.length} canciones`;

    mensajeVacio.classList.toggle(
        "oculto",
        canciones.length > 0
    );

    canciones.forEach(
        (cancion, indice) => {
            const elemento =
                document.createElement("button");

            elemento.type = "button";
            elemento.className = "cancion";

            if (indice === indiceActual) {
                elemento.classList.add(
                    "seleccionada"
                );
            }

            const nombre =
                obtenerNombreVisible(cancion);

            const extension =
                cancion.extension ||
                obtenerExtension(cancion.name);

            const tamano =
                formatearTamano(
                    cancion.sizeBytes
                );

            elemento.innerHTML = `
                <span class="icono-cancion">
                    ♫
                </span>

                <span class="informacion-cancion">
                    <span class="nombre-cancion">
                        ${escaparHtml(nombre)}
                    </span>

                    <span class="extension-cancion">
                        ${escaparHtml(extension)}
                    </span>
                </span>

                <span class="tamano-cancion">
                    ${escaparHtml(tamano)}
                </span>
            `;

            elemento.addEventListener(
                "click",
                () => reproducirCancion(indice)
            );

            listaCanciones.appendChild(
                elemento
            );
        }
    );
}

function reproducirCancion(indice) {
    if (
        indice < 0 ||
        indice >= canciones.length
    ) {
        return;
    }

    indiceActual = indice;

    const cancion =
        canciones[indiceActual];

    const direccionArchivo =
        construirDireccionArchivo(cancion);

    reproductorAudio.src =
        direccionArchivo;

    cancionActual.textContent =
        obtenerNombreVisible(cancion);

    estadoReproduccion.textContent =
        "Cargando...";

    mostrarCanciones();

    reproductorAudio
        .play()
        .catch(error => {
            console.error(error);

            estadoReproduccion.textContent =
                "No se pudo iniciar la reproducción";
        });
}

function construirDireccionArchivo(cancion) {
    const direccionServidor =
        obtenerDireccionServidor();

    const ruta =
        cancion.streamUrl ||
        cancion.url ||
        `/api/files/music/${encodeURIComponent(cancion.name)}`;

    try {
        return new URL(
            ruta,
            `${direccionServidor}/`
        ).toString();
    } catch {
        const rutaCorregida =
            ruta.startsWith("/")
                ? ruta
                : `/${ruta}`;

        return `${direccionServidor}${rutaCorregida}`;
    }
}

function reproducirActual() {
    if (indiceActual === -1) {
        if (canciones.length > 0) {
            reproducirCancion(0);
        }

        return;
    }

    reproductorAudio
        .play()
        .catch(error => {
            console.error(error);
        });
}

function pausarReproduccion() {
    reproductorAudio.pause();

    estadoReproduccion.textContent =
        "Pausado";
}

function detenerReproduccion() {
    reproductorAudio.pause();
    reproductorAudio.currentTime = 0;

    barraProgreso.value = 0;
    tiempoActual.textContent = "0:00";

    estadoReproduccion.textContent =
        "Detenido";
}

function reproducirSiguiente() {
    if (canciones.length === 0) {
        return;
    }

    const siguienteIndice =
        indiceActual >= canciones.length - 1
            ? 0
            : indiceActual + 1;

    reproducirCancion(
        siguienteIndice
    );
}

function reproducirAnterior() {
    if (canciones.length === 0) {
        return;
    }

    const indiceAnterior =
        indiceActual <= 0
            ? canciones.length - 1
            : indiceActual - 1;

    reproducirCancion(
        indiceAnterior
    );
}

function actualizarProgreso() {
    const duracion =
        reproductorAudio.duration;

    const posicion =
        reproductorAudio.currentTime;

    if (
        Number.isFinite(duracion) &&
        duracion > 0
    ) {
        barraProgreso.value =
            (posicion / duracion) * 100;

        duracionTotal.textContent =
            formatearTiempo(duracion);
    } else {
        barraProgreso.value = 0;
        duracionTotal.textContent = "0:00";
    }

    tiempoActual.textContent =
        formatearTiempo(posicion);
}

function cambiarPosicion() {
    const duracion =
        reproductorAudio.duration;

    if (
        !Number.isFinite(duracion) ||
        duracion <= 0
    ) {
        return;
    }

    const porcentaje =
        Number(barraProgreso.value);

    reproductorAudio.currentTime =
        (porcentaje / 100) * duracion;
}

function obtenerNombreVisible(cancion) {
    const nombre =
        cancion.displayName ||
        cancion.name ||
        "Canción sin nombre";

    return nombre.replace(
        /\.[^/.]+$/,
        ""
    );
}

function obtenerExtension(nombre = "") {
    const partes =
        nombre.split(".");

    if (partes.length < 2) {
        return "";
    }

    return `.${partes.pop()}`;
}

function formatearTamano(bytes) {
    const cantidad =
        Number(bytes);

    if (
        !Number.isFinite(cantidad) ||
        cantidad < 0
    ) {
        return "";
    }

    if (cantidad >= 1024 ** 3) {
        return `${(
            cantidad / 1024 ** 3
        ).toFixed(2)} GB`;
    }

    if (cantidad >= 1024 ** 2) {
        return `${(
            cantidad / 1024 ** 2
        ).toFixed(2)} MB`;
    }

    if (cantidad >= 1024) {
        return `${(
            cantidad / 1024
        ).toFixed(2)} KB`;
    }

    return `${cantidad} bytes`;
}

function formatearTiempo(segundos) {
    if (
        !Number.isFinite(segundos) ||
        segundos < 0
    ) {
        return "0:00";
    }

    const minutos =
        Math.floor(segundos / 60);

    const segundosRestantes =
        Math.floor(segundos % 60)
            .toString()
            .padStart(2, "0");

    return `${minutos}:${segundosRestantes}`;
}

function escaparHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

botonGuardarDireccion.addEventListener(
    "click",
    async () => {
        guardarDireccionServidor();
        await cargarBiblioteca();
    }
);

botonProbarConexion.addEventListener(
    "click",
    () => probarConexion(true)
);

botonActualizar.addEventListener(
    "click",
    cargarBiblioteca
);

botonReproducir.addEventListener(
    "click",
    reproducirActual
);

botonPausar.addEventListener(
    "click",
    pausarReproduccion
);

botonDetener.addEventListener(
    "click",
    detenerReproduccion
);

botonSiguiente.addEventListener(
    "click",
    reproducirSiguiente
);

botonAnterior.addEventListener(
    "click",
    reproducirAnterior
);

barraProgreso.addEventListener(
    "input",
    cambiarPosicion
);

reproductorAudio.addEventListener(
    "loadedmetadata",
    actualizarProgreso
);

reproductorAudio.addEventListener(
    "timeupdate",
    actualizarProgreso
);

reproductorAudio.addEventListener(
    "playing",
    () => {
        estadoReproduccion.textContent =
            "Reproduciendo";
    }
);

reproductorAudio.addEventListener(
    "pause",
    () => {
        if (
            reproductorAudio.currentTime > 0 &&
            !reproductorAudio.ended
        ) {
            estadoReproduccion.textContent =
                "Pausado";
        }
    }
);

reproductorAudio.addEventListener(
    "ended",
    reproducirSiguiente
);

reproductorAudio.addEventListener(
    "error",
    () => {
        estadoReproduccion.textContent =
            "Error de reproducción";
    }
);

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        cargarDireccionGuardada();
        await cargarBiblioteca();
    }
);

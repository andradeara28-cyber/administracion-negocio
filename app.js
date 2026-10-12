import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBjOSyB_qth2eQAZTNSNEEbGE8YdQgtR6U",
    authDomain: "aguachilazo-4e000.firebaseapp.com",
    projectId: "aguachilazo-4e000",
    storageBucket: "aguachilazo-4e000.firebasestorage.app",
    messagingSenderId: "806792024993",
    appId: "1:806792024993:web:0b0ee1937be873bb7531e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function obtenerFechaHoy() {
    let d = new Date();
    let year = d.getFullYear();
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

window.fechaSeleccionada = obtenerFechaHoy();
window.datosDiaActual = { saldoInicial: 0, ventas: [], gastos: [] };

document.getElementById('selectorFecha').value = window.fechaSeleccionada;

window.cargarDatosFirebase = async function() {
    let fecha = window.fechaSeleccionada;
    try {
        let docRef = doc(db, "registrosAguachiles", fecha);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            window.datosDiaActual = docSnap.data();
        } else {
            window.datosDiaActual = { saldoInicial: 0, ventas: [], gastos: [] };
        }
    } catch (error) {
        console.error("Error al cargar de Firebase:", error);
    }
    actualizarInterfaz();
}

window.guardarDatosFirebase = async function() {
    let fecha = window.fechaSeleccionada;
    try {
        let docRef = doc(db, "registrosAguachiles", fecha);
        await setDoc(docRef, window.datosDiaActual);
    } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("Hubo un error al guardar en la nube.");
    }
    actualizarInterfaz();
}

window.cambiarFechaVisualizacion = function() {
    let selector = document.getElementById('selectorFecha').value;
    if (selector) {
        window.fechaSeleccionada = selector;
        window.cargarDatosFirebase();
    }
}

window.irAFechaHoy = function() {
    window.fechaSeleccionada = obtenerFechaHoy();
    document.getElementById('selectorFecha').value = window.fechaSeleccionada;
    window.cargarDatosFirebase();
}

window.guardarSaldo = function() {
    let saldo = parseFloat(document.getElementById('inputSaldo').value) || 0;
    window.datosDiaActual.saldoInicial = saldo;
    window.guardarDatosFirebase();
    let modal = bootstrap.Modal.getInstance(document.getElementById('modalSaldo'));
    modal.hide();
}

window.pedirCantidadYVender = function(nombre, precioUnitario) {
    let input = prompt(`¿Cuántos de "${nombre}" te compraron?`, "1");
    if (input === null) return;
    let cantidad = parseInt(input);
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Por favor ingresa un número válido mayor a 0.");
        return;
    }
    let precioTotal = precioUnitario * cantidad;
    window.datosDiaActual.ventas.push({ nombre, cantidad, precio: precioTotal });
    window.guardarDatosFirebase();
}

window.eliminarVenta = function(index) {
    window.datosDiaActual.ventas.splice(index, 1);
    window.guardarDatosFirebase();
}

window.registrarGasto = function() {
    let nombre = document.getElementById('gastoNombre').value.trim();
    let cantidad = document.getElementById('gastoCantidad').value.trim();
    let precio = parseFloat(document.getElementById('gastoPrecio').value) || 0;

    if(!nombre || precio <= 0) {
        alert('Por favor ingresa un nombre y un precio válido.');
        return;
    }

    window.datosDiaActual.gastos.push({ nombre, cantidad, precio });
    window.guardarDatosFirebase();

    document.getElementById('gastoNombre').value = '';
    document.getElementById('gastoCantidad').value = '';
    document.getElementById('gastoPrecio').value = '';

    let modal = bootstrap.Modal.getInstance(document.getElementById('modalGasto'));
    modal.hide();
}

window.eliminarGasto = function(index) {
    window.datosDiaActual.gastos.splice(index, 1);
    window.guardarDatosFirebase();
}

window.reiniciarDia = function() {
    if(confirm(`¿Estás segura de reiniciar los registros del día ${window.fechaSeleccionada}?`)) {
        window.datosDiaActual = { saldoInicial: 0, ventas: [], gastos: [] };
        window.guardarDatosFirebase();
    }
}

function actualizarInterfaz() {
    let datos = window.datosDiaActual;

    document.getElementById('txtFechaCaja').innerText = window.fechaSeleccionada;
    document.getElementById('txtSaldoInicial').innerText = `$${datos.saldoInicial.toFixed(2)}`;
    document.getElementById('inputSaldo').value = datos.saldoInicial;

    let totalVentas = datos.ventas.reduce((acc, item) => acc + item.precio, 0);
    let totalGastos = datos.gastos.reduce((acc, item) => acc + item.precio, 0);
    let gananciaNeta = totalVentas - totalGastos;
    let efectivoCaja = datos.saldoInicial + totalVentas - totalGastos;

    document.getElementById('lblTotalVentas').innerText = `$${totalVentas.toFixed(2)}`;
    document.getElementById('lblTotalGastos').innerText = `$${totalGastos.toFixed(2)}`;
    document.getElementById('lblGananciaNeta').innerText = `$${gananciaNeta.toFixed(2)}`;
    document.getElementById('lblEfectivoCaja').innerText = `$${efectivoCaja.toFixed(2)}`;

    let htmlVentas = '';
    if(datos.ventas.length === 0) {
        htmlVentas = `<tr><td colspan="4" class="text-center text-muted py-3">No hay ventas registradas en esta fecha.</td></tr>`;
    } else {
        datos.ventas.forEach((v, index) => {
            htmlVentas += `
                <tr>
                    <td class="fw-semibold">${v.nombre}</td>
                    <td><span class="badge bg-success">${v.cantidad} pz</span></td>
                    <td>$${v.precio.toFixed(2)}</td>
                    <td class="text-end"><button class="btn btn-outline-danger btn-sm" onclick="eliminarVenta(${index})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        });
    }
    document.getElementById('tablaVentasBody').innerHTML = htmlVentas;

    let htmlGastos = '';
    if(datos.gastos.length === 0) {
        htmlGastos = `<tr><td colspan="4" class="text-center text-muted py-3">No hay gastos registrados en esta fecha.</td></tr>`;
    } else {
        datos.gastos.forEach((g, index) => {
            htmlGastos += `
                <tr>
                    <td class="fw-semibold">${g.nombre}</td>
                    <td>${g.cantidad || '-'}</td>
                    <td>$${g.precio.toFixed(2)}</td>
                    <td class="text-end"><button class="btn btn-outline-danger btn-sm" onclick="eliminarGasto(${index})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        });
    }
    document.getElementById('tablaGastosBody').innerHTML = htmlGastos;
}

window.cargarDatosFirebase();

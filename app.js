// Estado y fecha actual
function obtenerFechaHoy() {
    let d = new Date();
    let year = d.getFullYear();
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

window.fechaSeleccionada = obtenerFechaHoy();
document.getElementById('selectorFecha').value = window.fechaSeleccionada;

function obtenerDatosLocal() {
    let data = localStorage.getItem('aguachilazo_' + window.fechaSeleccionada);
    if (data) {
        return JSON.parse(data);
    }
    return { saldoInicial: 0, ventas: [], gastos: [] };
}

function guardarDatosLocal(datos) {
    localStorage.setItem('aguachilazo_' + window.fechaSeleccionada, JSON.stringify(datos));
    actualizarInterfaz();
}

function cerrarModalSeguro(modalId) {
    let modalElement = document.getElementById(modalId);
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

window.cambiarFechaVisualizacion = function() {
    let selector = document.getElementById('selectorFecha').value;
    if (selector) {
        window.fechaSeleccionada = selector;
        actualizarInterfaz();
    }
}

window.irAFechaHoy = function() {
    window.fechaSeleccionada = obtenerFechaHoy();
    document.getElementById('selectorFecha').value = window.fechaSeleccionada;
    actualizarInterfaz();
}

window.guardarSaldo = function() {
    let saldo = parseFloat(document.getElementById('inputSaldo').value) || 0;
    let datos = obtenerDatosLocal();
    datos.saldoInicial = saldo;
    guardarDatosLocal(datos);
    cerrarModalSeguro('modalSaldo');
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
    let datos = obtenerDatosLocal();
    datos.ventas.push({ nombre, cantidad, precio: precioTotal });
    guardarDatosLocal(datos);
}

window.eliminarVenta = function(index) {
    let datos = obtenerDatosLocal();
    datos.ventas.splice(index, 1);
    guardarDatosLocal(datos);
}

window.registrarGasto = function() {
    let nombre = document.getElementById('gastoNombre').value.trim();
    let cantidad = document.getElementById('gastoCantidad').value.trim();
    let precio = parseFloat(document.getElementById('gastoPrecio').value) || 0;

    if(!nombre || precio <= 0) {
        alert('Por favor ingresa un nombre y un precio válido.');
        return;
    }

    let datos = obtenerDatosLocal();
    datos.gastos.push({ nombre, cantidad, precio });
    guardarDatosLocal(datos);

    document.getElementById('gastoNombre').value = '';
    document.getElementById('gastoCantidad').value = '';
    document.getElementById('gastoPrecio').value = '';

    cerrarModalSeguro('modalGasto');
}

window.eliminarGasto = function(index) {
    let datos = obtenerDatosLocal();
    datos.gastos.splice(index, 1);
    guardarDatosLocal(datos);
}

window.reiniciarDia = function() {
    if(confirm(`¿Estás segura de reiniciar los registros del día ${window.fechaSeleccionada}?`)) {
        let datos = { saldoInicial: 0, ventas: [], gastos: [] };
        guardarDatosLocal(datos);
    }
}

function actualizarInterfaz() {
    let datos = obtenerDatosLocal();

    document.getElementById('txtFechaCaja').innerText = window.fechaSeleccionada;
    document.getElementById('txtSaldoInicial').innerText = `$${(datos.saldoInicial || 0).toFixed(2)}`;
    document.getElementById('inputSaldo').value = datos.saldoInicial || 0;

    let totalVentas = (datos.ventas || []).reduce((acc, item) => acc + item.precio, 0);
    let totalGastos = (datos.gastos || []).reduce((acc, item) => acc + item.precio, 0);
    let gananciaNeta = totalVentas - totalGastos;
    let efectivoCaja = (datos.saldoInicial || 0) + totalVentas - totalGastos;

    document.getElementById('lblTotalVentas').innerText = `$${totalVentas.toFixed(2)}`;
    document.getElementById('lblTotalGastos').innerText = `$${totalGastos.toFixed(2)}`;
    document.getElementById('lblGananciaNeta').innerText = `$${gananciaNeta.toFixed(2)}`;
    document.getElementById('lblEfectivoCaja').innerText = `$${efectivoCaja.toFixed(2)}`;

    let htmlVentas = '';
    if(!datos.ventas || datos.ventas.length === 0) {
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
    if(!datos.gastos || datos.gastos.length === 0) {
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

// Carga inicial
actualizarInterfaz();

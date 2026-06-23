let textoGuardado = ''
let nombreGuardado = ''

//Carga todas las materias guardadas del json
async function cargarMaterias() {
  const res = await fetch('/api/materias')
  const materias = await res.json()
  const lista = document.getElementById('lista-materias')
  lista.innerHTML = ''

  if (materias.length == 0) {
    lista.innerHTML = '<p style="color:#999; margin-bottom:1rem;">Todavía no hay materias. ¡Creá una!</p>';
    return
  }

  materias.forEach(m => {
    let card = document.createElement('div')
    card.className = 'CartaMateria'
    card.innerHTML = `
      <a href="quiz.html?id=${m.id}">${m.nombre}</a>
      <div class="card-acciones">
        <span>${m.preguntas.length} preguntas</span>
        <button onclick="eliminarMateria(${m.id})" class="btn-eliminar">🗑️</button>
      </div>
    `
    lista.appendChild(card)
  })
}

//Cerrar el popup de crear materia 
function cerrarPopupCrear(){
  document.getElementById('overlay-crear').classList.add('oculto')
  document.getElementById('input-nombre').value = ''
  document.getElementById('input-texto').value = ''
}

const BotonAbrirPanelCreacion = document.getElementById("btn-nuevo")
BotonAbrirPanelCreacion.addEventListener("click", function(){
  document.getElementById('overlay-crear').classList.remove('oculto')
})

const BotonCerrarPopup = document.getElementById("BotonCerrarPopup")
BotonCerrarPopup.addEventListener("click", function(){
  cerrarPopupCrear()
})

const BotonCrearMateria = document.getElementById("BotonCrearMateria")
BotonCrearMateria.addEventListener("click", function(){
  let nombre = document.getElementById('input-nombre').value.trim()
  let texto = document.getElementById('input-texto').value.trim()

  if (!nombre) { alert('Ingresá un nombre válido para la materia.'); return }
  if (!texto) { alert('Ingresá el texto a estudiar.'); return }

  nombreGuardado = nombre
  textoGuardado = texto

  cerrarPopupCrear()
  document.getElementById('overlay-cantidad').classList.remove('oculto')
})

function cerrarPopupCantidad() {
  document.getElementById('overlay-cantidad').classList.add('oculto')
}

const BotonCerrarPopupPreguntas = document.getElementById("BotonCerrarPopupPreguntas")
BotonCerrarPopupPreguntas.addEventListener("click", function(){
  cerrarPopupCantidad()
})

const BotonCrearMateriaFinal = document.getElementById("BotonCrearMateriaFinal")
BotonCrearMateriaFinal.addEventListener("click", function(){
  generarMateria()
})

//El boton que elimina la materia
async function eliminarMateria(id) {
  await fetch(`/api/materias/${id}`, { method: 'DELETE' })
  cargarMaterias()
}

//Genera la materia
async function generarMateria() {
  const cantidad = document.getElementById('input-cantidad').value

  // Deshabilitar botón para evitar doble click
  BotonCrearMateriaFinal.disabled = true

  // 1. Cerrar popup de cantidad
  cerrarPopupCantidad()

  // 2. Esperar un frame para que el browser termine de cerrar el popup
  await new Promise(r => setTimeout(r, 50))

  // 3. Mostrar loading
  document.getElementById('overlay-loading').classList.remove('oculto')

  // 4. Otro frame para asegurar que el loading se pinta antes de empezar el fetch
  await new Promise(r => setTimeout(r, 50))

  try {
    const res = await fetch('/api/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombreGuardado,
        texto: textoGuardado,
        cantidadPreguntas: cantidad
      })
    })

    const materia = await res.json()

    // 409 = duplicado, 429 = lock activo: la materia ya fue/está siendo creada, no es un error real
    if (res.status === 409 || res.status === 429) {
      document.getElementById('overlay-loading').classList.add('oculto')
      await cargarMaterias()
      return
    }

    if (!res.ok) {
      throw new Error(materia.error || 'Error desconocido')
    }

    document.getElementById('overlay-loading').classList.add('oculto')
    await cargarMaterias()

    // Ir directo al quiz de la materia recién creada
    window.location.href = `quiz.html?id=${materia.id}`

  } catch (error) {
    document.getElementById('overlay-loading').classList.add('oculto')
    alert('Hubo un error: ' + error.message)
    console.error(error)
  } finally {
    // Siempre rehabilitar el botón al terminar
    BotonCrearMateriaFinal.disabled = false
  }
}

cargarMaterias()
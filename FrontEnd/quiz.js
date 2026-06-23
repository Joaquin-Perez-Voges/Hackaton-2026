let materiaActual = null
let pruebaActual  = null

async function cargarQuiz() {
  const params = new URLSearchParams(window.location.search)
  const id = parseInt(params.get('id'))

  // Mostrar loading mientras genera la nueva prueba
  document.getElementById('overlay-loading').classList.remove('oculto')

  try {
    // 1. Obtener la materia
    const resMaterias = await fetch('/api/materias')
    const materias    = await resMaterias.json()
    materiaActual     = materias.find(m => m.id === id)

    if (!materiaActual) {
      document.body.innerHTML = '<p style="padding:2rem">Materia no encontrada. <a href="index.html">Volver</a></p>'
      return
    }

    document.getElementById('quiz-titulo').textContent = materiaActual.nombre

    // 2. Generar nueva prueba en el servidor
    const resPrueba = await fetch(`/api/materias/${id}/prueba`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidadPreguntas: materiaActual.pruebas[0].preguntas.length })
    })

    if (!resPrueba.ok) {
      const err = await resPrueba.json()
      throw new Error(err.error || 'Error al generar la prueba')
    }

    pruebaActual = await resPrueba.json()

    // 3. Renderizar
    renderizarPrueba()

  } catch (error) {
    document.getElementById('overlay-loading').classList.add('oculto')
    document.getElementById('quiz-contenido').classList.remove('oculto')
    document.getElementById('quiz-form').innerHTML =
      `<p style="color:red">Error al cargar la prueba: ${error.message}</p>`
    console.error(error)
  }
}

function renderizarPrueba() {
  const form = document.getElementById('quiz-form')
  form.innerHTML = ''

  // Info de la prueba
  const numPrueba  = materiaActual.pruebas.length + 1  // la nueva ya fue guardada en el server
  document.getElementById('quiz-info').textContent =
    `Prueba #${pruebaActual.id} · ${pruebaActual.preguntas.length} preguntas`

  pruebaActual.preguntas.forEach((q, i) => {
    const bloque = document.createElement('div')
    bloque.className = 'pregunta-bloque'
    bloque.innerHTML = `<p>${i + 1}. ${q.pregunta}</p>`

    q.opciones.forEach((op, oi) => {
      const opcionDiv = document.createElement('div')
      opcionDiv.className = 'opcion'
      opcionDiv.id = `opcion-${i}-${oi}`
      opcionDiv.innerHTML = `
        <input type="radio" name="pregunta-${i}" id="op-${i}-${oi}" value="${oi}">
        <label for="op-${i}-${oi}">${op}</label>
      `
      bloque.appendChild(opcionDiv)
    })

    form.appendChild(bloque)
  })

  // Resetear estado de botones y resultado
  document.getElementById('btn-corregir').style.display = ''
  document.getElementById('quiz-resultado').classList.add('oculto')
  document.getElementById('btn-nueva-prueba').classList.add('oculto')

  // Ocultar loading y mostrar contenido
  document.getElementById('overlay-loading').classList.add('oculto')
  document.getElementById('quiz-contenido').classList.remove('oculto')
}

function corregir() {
  let correctas = 0
  const total   = pruebaActual.preguntas.length

  pruebaActual.preguntas.forEach((q, i) => {
    const seleccionada  = document.querySelector(`input[name="pregunta-${i}"]:checked`)
    const correctaIdx   = q.correcta

    // Marcar correcta siempre en verde
    document.getElementById(`opcion-${i}-${correctaIdx}`).classList.add('correcta')

    if (seleccionada) {
      const elegida = parseInt(seleccionada.value)
      if (elegida === correctaIdx) {
        correctas++
      } else {
        document.getElementById(`opcion-${i}-${elegida}`).classList.add('incorrecta')
      }
    }
  })

  // Deshabilitar radios
  document.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true)

  const pct   = Math.round((correctas / total) * 100)
  const emoji = pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📚'

  const resultado = document.getElementById('quiz-resultado')
  resultado.textContent = `${emoji} ${correctas} de ${total} correctas (${pct}%)`
  resultado.classList.remove('oculto')

  document.getElementById('btn-corregir').style.display = 'none'
  document.getElementById('btn-nueva-prueba').classList.remove('oculto')
}

async function nuevaPrueba() {
  // Recargar la misma materia → genera una nueva prueba automáticamente
  document.getElementById('quiz-contenido').classList.add('oculto')
  document.getElementById('overlay-loading').classList.remove('oculto')
  await cargarQuiz()
}

cargarQuiz()
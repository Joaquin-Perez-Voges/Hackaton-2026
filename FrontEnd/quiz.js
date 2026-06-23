let materiaActual = null;

async function cargarQuiz() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));

  const res = await fetch('/api/materias');
  const materias = await res.json();
  materiaActual = materias.find(m => m.id === id);

  if (!materiaActual) {
    document.body.innerHTML = '<p style="padding:2rem">Materia no encontrada. <a href="index.html">Volver</a></p>';
    return;
  }

  document.getElementById('quiz-titulo').textContent = materiaActual.nombre;

  const form = document.getElementById('quiz-form');
  form.innerHTML = '';

  materiaActual.preguntas.forEach((q, i) => {
    const bloque = document.createElement('div');
    bloque.className = 'pregunta-bloque';
    bloque.innerHTML = `<p>${i + 1}. ${q.pregunta}</p>`;

    q.opciones.forEach((op, oi) => {
      const opcionDiv = document.createElement('div');
      opcionDiv.className = 'opcion';
      opcionDiv.id = `opcion-${i}-${oi}`;
      opcionDiv.innerHTML = `
        <input type="radio" name="pregunta-${i}" id="op-${i}-${oi}" value="${oi}">
        <label for="op-${i}-${oi}">${op}</label>
      `;
      bloque.appendChild(opcionDiv);
    });

    form.appendChild(bloque);
  });
}

function corregir() {
  let correctas = 0;
  const total = materiaActual.preguntas.length;

  materiaActual.preguntas.forEach((q, i) => {
    const seleccionada = document.querySelector(`input[name="pregunta-${i}"]:checked`);
    const correctaIdx = q.correcta;

    // Marcar correcta siempre en verde
    document.getElementById(`opcion-${i}-${correctaIdx}`).classList.add('correcta');

    if (seleccionada) {
      const elegida = parseInt(seleccionada.value);
      if (elegida === correctaIdx) {
        correctas++;
      } else {
        document.getElementById(`opcion-${i}-${elegida}`).classList.add('incorrecta');
      }
    }
  });

  // Deshabilitar radios
  document.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);

  const pct = Math.round((correctas / total) * 100);
  const emoji = pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📚';

  const resultado = document.getElementById('quiz-resultado');
  resultado.textContent = `${emoji} ${correctas} de ${total} correctas (${pct}%)`;
  resultado.classList.remove('oculto');

  document.getElementById('btn-corregir').style.display = 'none';
}

cargarQuiz();
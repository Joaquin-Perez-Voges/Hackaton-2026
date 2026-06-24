/** Fecha local en formato YYYY-MM-DD (es-AR/UTC-3 sin líos de zona horaria). */
function diaLocal(d: Date): string {
  return new Date(d).toLocaleDateString("en-CA");
}

/**
 * Racha (estilo Duolingo): días consecutivos con actividad terminando hoy o ayer.
 * Si hoy no hay actividad pero ayer sí, la racha sigue viva.
 */
export function calcularRacha(fechas: Date[]): number {
  const dias = new Set(fechas.map(diaLocal));
  if (dias.size === 0) return 0;

  const cursor = new Date();
  if (!dias.has(diaLocal(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dias.has(diaLocal(cursor))) return 0; // ni hoy ni ayer → racha rota
  }

  let racha = 0;
  while (dias.has(diaLocal(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

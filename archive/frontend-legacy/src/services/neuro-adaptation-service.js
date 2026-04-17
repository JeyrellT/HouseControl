export async function getStatus() {
  return Promise.resolve({
    id: "neuro",
    title: "Capa neuro-adaptativa",
    readiness: "watch",
    detail: "Preparada para futuros modelos de carga cognitiva y ErrP."
  });
}

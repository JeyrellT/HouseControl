export async function getStatus() {
  return Promise.resolve({
    id: "cognitive-load",
    title: "Carga cognitiva",
    readiness: "standby",
    detail: "Modelo placeholder listo para evolucionar hacia carga cognitiva, ErrP y señales contextuales."
  });
}

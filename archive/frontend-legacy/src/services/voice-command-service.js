export async function getStatus() {
  return Promise.resolve({
    id: "voice",
    title: "Comandos de voz",
    readiness: "watch",
    detail: "Placeholder listo para integrar ASR y fallback visual."
  });
}

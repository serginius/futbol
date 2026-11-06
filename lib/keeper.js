// ¿Esta persona puede usar el panel EN VIVO desde la app? Solo el admin.
// (Los demás relatan con el link que genera el admin.)
export function canKeep(m, viewer) {
  return !!m && m.status !== "jugado" && !!viewer?.isAdmin;
}

// ¿Esta persona puede usar el panel EN VIVO de este partido? (admin o planillero)
export function canKeep(m, viewer) {
  if (!m || m.status === "jugado" || !viewer?.user) return false;
  if (viewer.isAdmin) return true;
  const email = (viewer.user.email || "").toLowerCase();
  return !!m.keeper_email && m.keeper_email.toLowerCase() === email;
}

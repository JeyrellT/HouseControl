export function formatDateTime(value, locale = "es-GT") {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatTime(value, locale = "es-GT") {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatRelativeMinutes(value, now = Date.now()) {
  if (!value) {
    return "--";
  }

  const diffMs = Math.max(0, now - new Date(value).getTime());
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "ahora";
  }

  if (diffMinutes === 1) {
    return "hace 1 min";
  }

  if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours === 1) {
    return "hace 1 h";
  }

  if (diffHours < 24) {
    return `hace ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays} d`;
}

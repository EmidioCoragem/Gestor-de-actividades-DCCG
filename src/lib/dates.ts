export function formatLuanda(value: string | null | undefined) {
  if (!value) return "Sem termo";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-AO", {
    timeZone: "Africa/Luanda",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

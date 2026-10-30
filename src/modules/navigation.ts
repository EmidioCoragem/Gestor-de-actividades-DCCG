import { navigation } from "./catalog";

// Metadados de apresentação. Não concedem acesso nem substituem autorização/RLS.
export const functionalProfiles = [
  "Técnico",
  "Gestor",
  "Director",
  "Director Executivo",
  "Administrador técnico",
] as const;
export type FunctionalProfile = (typeof functionalProfiles)[number];
export type NavigationItem = (typeof navigation)[number];
export type ModuleSlug = NavigationItem["slug"];

// Fase 1: o servidor deverá fornecer a configuração visual após resolver o âmbito.
// Na Fase 0, a ausência de configuração apresenta todos os módulos informativos.
export function getNavigationItems(visibleModules?: readonly ModuleSlug[]) {
  if (visibleModules === undefined) return navigation;
  return navigation.filter(
    (item) => item.slug === "" || visibleModules.includes(item.slug),
  );
}

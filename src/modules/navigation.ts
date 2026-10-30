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

// O servidor fornece a configuração após resolver os âmbitos.
// Sem configuração explícita, nenhum módulo é apresentado. RLS continua obrigatória.
export function getNavigationItems(visibleModules: readonly ModuleSlug[] = []) {
  return navigation.filter(
    (item) => item.slug === "" || visibleModules.includes(item.slug),
  );
}

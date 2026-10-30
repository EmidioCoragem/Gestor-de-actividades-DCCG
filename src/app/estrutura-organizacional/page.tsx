import { modules } from "@/modules/catalog";
import { ModulePage } from "@/components/module-page";
export const metadata = { title: "Estrutura Organizacional" };
export default function Page() { return <ModulePage module={modules[4]} />; }

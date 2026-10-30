import { modules } from "@/modules/catalog";
import { ModulePage } from "@/components/module-page";
export const metadata = { title: "Gestão de Actividades" };
export default function Page() { return <ModulePage module={modules[0]} />; }

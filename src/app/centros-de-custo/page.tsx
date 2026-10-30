import { modules } from "@/modules/catalog";
import { ModulePage } from "@/components/module-page";
export const metadata = { title: "Centros de Custo" };
export default function Page() { return <ModulePage module={modules[3]} />; }

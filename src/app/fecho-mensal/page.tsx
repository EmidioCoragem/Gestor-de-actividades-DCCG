import { modules } from "@/modules/catalog";
import { ModulePage } from "@/components/module-page";
export const metadata = { title: "Fecho Mensal" };
export default function Page() { return <ModulePage module={modules[1]} />; }

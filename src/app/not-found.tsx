import Link from "next/link";
export default function NotFound() {
 return <section className="panel"><h1>Página não encontrada</h1><p>O endereço indicado não corresponde a um módulo do portal.</p><Link className="text-link" href="/">Voltar ao Dashboard</Link></section>;
}

import { requireModule } from "@/modules/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/mutation-form";
import { Field, SelectField, AdminHeading } from "@/components/admin/fields";
export const metadata = { title: "Estrutura Organizacional" };
export default async function Page() {
  const viewer = await requireModule("org.read");
  const db = await createSupabaseServerClient();
  const [
    { data: units, error },
    { data: positions },
    { data: people },
    { data: lines },
    { data: responsibles },
  ] = await Promise.all([
    db
      .from("organizational_units")
      .select("id,code,name,kind,parent_id,active")
      .order("name"),
    db.from("positions").select("id,code,name"),
    db.from("profiles").select("id,full_name"),
    db
      .from("reporting_lines")
      .select("id,user_id,supervisor_id,valid_until")
      .is("valid_until", null),
    db
      .from("unit_responsibilities")
      .select("id,unit_id,user_id")
      .is("valid_until", null),
  ]);
  const unitOptions = (units ?? []).map((u) => ({
    value: u.id,
    label: `${u.code} — ${u.name}`,
  }));
  const personOptions = (people ?? []).map((p) => ({
    value: p.id,
    label: p.full_name,
  }));
  return (
    <>
      <AdminHeading title="Estrutura Organizacional">
        Empresa, direcções, departamentos, secções e equipas configuráveis. A
        estrutura dos centros de custo é independente.
      </AdminHeading>
      <div className="panel table-scroll">
        <table>
          <caption>Unidades autorizadas</caption>
          <thead>
            <tr>
              <th>Código</th>
              <th>Designação</th>
              <th>Tipo</th>
              <th>Unidade superior</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {units?.map((u) => (
              <tr key={u.id}>
                <td>{u.code}</td>
                <td>{u.name}</td>
                <td>
                  {
                    (
                      {
                        company: "Empresa",
                        direction: "Direcção",
                        department: "Departamento",
                        section: "Secção",
                        team: "Equipa",
                        other: "Outra",
                      } as Record<string, string>
                    )[u.kind]
                  }
                </td>
                <td>
                  {units?.find((p) => p.id === u.parent_id)?.name ??
                    (u.parent_id ? "Fora do âmbito visível" : "Raiz")}
                </td>
                <td>{u.active ? "Activa" : "Inactiva"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!units?.length && (
          <p className="empty-note">
            {error
              ? "Consulta indisponível: verifique migrações e permissões."
              : "Sem unidades no âmbito autorizado."}
          </p>
        )}
      </div>
      {viewer.permissions.includes("org.manage") && (
        <div className="admin-grid">
          <MutationForm title="Criar unidade" operation="unit_create">
            <Field name="code" label="Código" />
            <Field name="name" label="Designação" />
            <SelectField
              name="kind"
              label="Tipo"
              options={[
                { value: "company", label: "Empresa" },
                { value: "direction", label: "Direcção" },
                { value: "department", label: "Departamento" },
                { value: "section", label: "Secção" },
                { value: "team", label: "Equipa" },
                { value: "other", label: "Outra" },
              ]}
            />
            <SelectField
              name="parent_id"
              label="Unidade superior (sem unidade apenas para a empresa)"
              options={unitOptions}
              optional
            />
          </MutationForm>
          <MutationForm title="Actualizar unidade" operation="unit_update">
            <SelectField name="id" label="Unidade" options={unitOptions} />
            <Field name="name" label="Designação" />
            <SelectField
              name="parent_id"
              label="Unidade superior"
              options={unitOptions}
              optional
            />
            <SelectField
              name="active"
              label="Estado"
              options={[
                { value: "true", label: "Activa" },
                { value: "false", label: "Inactiva" },
              ]}
            />
          </MutationForm>
          <MutationForm title="Criar cargo" operation="position_create">
            <p>Exige âmbito global. O cargo não concede permissões.</p>
            <Field name="code" label="Código" />
            <Field name="name" label="Designação" />
          </MutationForm>
          <MutationForm
            title="Definir responsável de unidade"
            operation="set_responsible"
          >
            <SelectField name="unit_id" label="Unidade" options={unitOptions} />
            <SelectField
              name="user_id"
              label="Responsável pertencente à unidade"
              options={personOptions}
            />
          </MutationForm>
          <MutationForm
            title="Definir relação de chefia"
            operation="set_supervisor"
          >
            <SelectField
              name="unit_id"
              label="Unidade do trabalhador"
              options={unitOptions}
            />
            <SelectField
              name="user_id"
              label="Trabalhador"
              options={personOptions}
            />
            <SelectField
              name="supervisor_id"
              label="Chefia"
              options={personOptions}
            />
          </MutationForm>
        </div>
      )}
      <section className="panel admin-section">
        <h2>Cargos e relações hierárquicas</h2>
        <ul>
          {positions?.map((p) => (
            <li key={p.id}>
              {p.code} — {p.name}
            </li>
          ))}
        </ul>
        <p>
          {lines?.length ?? 0} relações de chefia visíveis;{" "}
          {responsibles?.length ?? 0} responsabilidades actuais visíveis. O
          organograma interactivo fica preparado para evolução futura.
        </p>
      </section>
    </>
  );
}

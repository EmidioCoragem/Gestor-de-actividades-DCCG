import { formatLuanda } from "@/lib/dates";
import { requireModule } from "@/modules/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/mutation-form";
import { Field, SelectField, AdminHeading } from "@/components/admin/fields";
export const metadata = { title: "Administração" };
export default async function Page() {
  const viewer = await requireModule("users.read");
  const db = await createSupabaseServerClient();
  const [
    { data: users, error },
    { data: units },
    { data: positions },
    { data: memberships },
  ] = await Promise.all([
    db.from("profiles").select("id,full_name,email,status").order("full_name"),
    db.from("organizational_units").select("id,name").eq("active", true),
    db.from("positions").select("id,name").eq("active", true),
    db
      .from("user_positions")
      .select(
        "id,user_id,unit_id,valid_from,valid_until,positions(name),organizational_units(name)",
      )
      .order("valid_from", { ascending: false }),
  ]);
  const people = (users ?? []).map((u) => ({
    value: u.id,
    label: u.full_name,
  }));
  const unitOptions = (units ?? []).map((u) => ({
    value: u.id,
    label: u.name,
  }));
  return (
    <>
      <AdminHeading title="Administração de utilizadores">
        Contas, estados e associações. Os dados e operações respeitam as
        políticas RLS.
      </AdminHeading>
      {error ? (
        <div className="notice">
          Não foi possível carregar as contas autorizadas. Verifique migrações e
          permissões.
        </div>
      ) : (
        <div className="panel table-scroll">
          <table>
            <caption>Utilizadores no âmbito autorizado</caption>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Correio electrónico</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    {
                      (
                        {
                          active: "Activo",
                          inactive: "Inactivo",
                          suspended: "Suspenso",
                        } as Record<string, string>
                      )[u.status]
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users?.length && (
            <p className="empty-note">
              Não existem contas visíveis neste âmbito.
            </p>
          )}
        </div>
      )}
      {viewer.permissions.includes("users.manage") && (
        <div className="admin-grid">
          <MutationForm title="Convidar utilizador" invitation>
            <p>
              Exige permissão global. A conta nasce inactiva; convite não
              atribui privilégios.
            </p>
            <Field name="full_name" label="Nome completo" />
            <Field name="email" label="Correio electrónico" type="email" />
          </MutationForm>
          <MutationForm title="Alterar estado da conta" operation="user_status">
            <SelectField name="user_id" label="Utilizador" options={people} />
            <SelectField
              name="status"
              label="Estado"
              options={[
                { value: "active", label: "Activo" },
                { value: "inactive", label: "Inactivo" },
                { value: "suspended", label: "Suspenso" },
              ]}
            />
          </MutationForm>
          <MutationForm
            title="Associar cargo e unidade"
            operation="assign_position"
          >
            <p>
              A associação anterior é encerrada, preservando o histórico. Requer
              autorização também na unidade anterior.
            </p>
            <SelectField name="user_id" label="Utilizador" options={people} />
            <SelectField name="unit_id" label="Unidade" options={unitOptions} />
            <SelectField
              name="position_id"
              label="Cargo"
              options={(positions ?? []).map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </MutationForm>
        </div>
      )}
      <section className="panel admin-section">
        <h2>Histórico de associações autorizado</h2>
        <ul>
          {memberships?.map((m) => (
            <li key={m.id}>
              {people.find((p) => p.value === m.user_id)?.label ??
                "Utilizador autorizado"}{" "}
              · {formatLuanda(m.valid_from)} ·{" "}
              {m.valid_until ? "Associação encerrada" : "Associação actual"}
            </li>
          ))}
        </ul>
        {!memberships?.length && <p>Sem associações para apresentar.</p>}
      </section>
    </>
  );
}

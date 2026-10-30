import { formatLuanda } from "@/lib/dates";
import { requireModule } from "@/modules/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/mutation-form";
import { Field, SelectField, AdminHeading } from "@/components/admin/fields";
export const metadata = { title: "Hierarquia e Permissões" };
export default async function Page() {
  await requireModule("access.manage");
  const db = await createSupabaseServerClient();
  const [
    { data: users },
    { data: roles },
    { data: permissions },
    { data: grants },
    { data: units },
    { data: rolePermissions },
  ] = await Promise.all([
    db.from("profiles").select("id,full_name"),
    db.from("roles").select("code,name,technical"),
    db.from("permissions").select("code,description"),
    db
      .from("user_role_assignments")
      .select("id,user_id,role_code,scope_unit_id,valid_from,valid_until"),
    db.from("organizational_units").select("id,name").eq("active", true),
    db.from("role_permissions").select("role_code,permission_code"),
  ]);
  const people = (users ?? []).map((u) => ({
    value: u.id,
    label: u.full_name,
  }));
  const roleOptions = (roles ?? []).map((r) => ({
    value: r.code,
    label: r.name,
  }));
  const unitOptions = (units ?? []).map((u) => ({
    value: u.id,
    label: u.name,
  }));
  return (
    <>
      <AdminHeading title="Hierarquia e Permissões">
        Cargo, perfil funcional e âmbito são conceitos separados. Não é
        permitido alterar os próprios privilégios.
      </AdminHeading>
      <section className="panel table-scroll">
        <table>
          <caption>Atribuições autorizadas</caption>
          <thead>
            <tr>
              <th>Utilizador</th>
              <th>Perfil</th>
              <th>Âmbito</th>
              <th>Vigência</th>
            </tr>
          </thead>
          <tbody>
            {grants?.map((g) => (
              <tr key={g.id}>
                <td>
                  {people.find((p) => p.value === g.user_id)?.label ??
                    g.user_id}
                </td>
                <td>
                  {roleOptions.find((r) => r.value === g.role_code)?.label ??
                    g.role_code}
                </td>
                <td>
                  {unitOptions.find((u) => u.value === g.scope_unit_id)
                    ?.label ??
                    (g.scope_unit_id ? "Unidade não visível" : "Global")}
                </td>
                <td>
                  {formatLuanda(g.valid_from)} — {formatLuanda(g.valid_until)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!grants?.length && (
          <p className="empty-note">Sem atribuições visíveis neste âmbito.</p>
        )}
      </section>
      <div className="admin-grid">
        <MutationForm title="Atribuir perfil a terceiro" operation="grant_role">
          <SelectField name="user_id" label="Utilizador" options={people} />
          <SelectField name="role_code" label="Perfil" options={roleOptions} />
          <SelectField
            name="unit_id"
            label="Âmbito (global exige autorização global)"
            options={unitOptions}
            optional
          />
          <Field
            name="valid_until"
            label="Fim de vigência (Africa/Luanda, opcional)"
            type="datetime-local"
            required={false}
          />
        </MutationForm>
        <MutationForm title="Encerrar atribuição" operation="revoke_role">
          <SelectField
            name="id"
            label="Atribuição"
            options={(grants ?? [])
              .filter(
                (g) => !g.valid_until || new Date(g.valid_until) > new Date(),
              )
              .map((g) => ({
                value: g.id,
                label: `${people.find((p) => p.value === g.user_id)?.label ?? g.user_id} — ${g.role_code}`,
              }))}
          />
        </MutationForm>
        <MutationForm title="Criar perfil funcional" operation="role_create">
          <Field name="code" label="Código (minúsculas, sem espaços)" />
          <Field name="name" label="Designação" />
        </MutationForm>
        <MutationForm
          title="Configurar permissão do perfil"
          operation="role_permission"
        >
          <p>
            Exige âmbito global. Perfis actualmente atribuídos ao próprio
            responsável não podem ser modificados por ele.
          </p>
          <SelectField name="role_code" label="Perfil" options={roleOptions} />
          <SelectField
            name="permission_code"
            label="Permissão"
            options={(permissions ?? []).map((p) => ({
              value: p.code,
              label: `${p.code} — ${p.description}`,
            }))}
          />
          <SelectField
            name="enabled"
            label="Operação"
            options={[
              { value: "true", label: "Conceder" },
              { value: "false", label: "Retirar" },
            ]}
          />
        </MutationForm>
      </div>
      <section className="panel admin-section">
        <h2>Catálogo de capacidades</h2>
        <ul>
          {roles?.map((r) => (
            <li key={r.code}>
              <strong>{r.name}</strong>:{" "}
              {(rolePermissions ?? [])
                .filter((p) => p.role_code === r.code)
                .map((p) => p.permission_code)
                .join(", ") || "Sem permissões"}
            </li>
          ))}
        </ul>
        <p>
          Delegações temporárias têm fundação de dados, mas não concedem acesso
          nesta versão. A validação de actividades não está implementada; a
          regra de proibição de autovalidação é testada na infraestrutura.
        </p>
      </section>
    </>
  );
}

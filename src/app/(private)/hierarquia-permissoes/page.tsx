import { formatLuanda } from "@/lib/dates";
import { requireModule } from "@/modules/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/mutation-form";
import { Field, SelectField, AdminHeading } from "@/components/admin/fields";
import { AdminReadState } from "@/components/admin/read-state";
import {
  classifyReadResult,
  readStateMessage,
  readSucceeded,
  validityLabel,
} from "@/modules/access/read-state";
export const metadata = { title: "Hierarquia e Permissões" };
export default async function Page() {
  await requireModule("access.manage");
  const db = await createSupabaseServerClient();
  const [usersResult, rolesResult, permissionsResult, grantsResult, unitsResult, rolePermissionsResult] = await Promise.all([
    db.from("profiles").select("id,full_name,status"),
    db.from("roles").select("code,name,technical"),
    db.from("permissions").select("code,description"),
    db
      .from("user_role_assignments")
      .select("id,user_id,role_code,scope_unit_id,valid_from,valid_until"),
    db.from("organizational_units").select("id,name,active"),
    db.from("role_permissions").select("role_code,permission_code"),
  ]);
  const usersState = classifyReadResult(usersResult);
  const rolesState = classifyReadResult(rolesResult);
  const permissionsState = classifyReadResult(permissionsResult);
  const grantsState = classifyReadResult(grantsResult);
  const unitsState = classifyReadResult(unitsResult);
  const rolePermissionsState = classifyReadResult(rolePermissionsResult);
  const users = usersState.data;
  const roles = rolesState.data;
  const permissions = permissionsState.data;
  const grants = grantsState.data;
  const units = unitsState.data;
  const rolePermissions = rolePermissionsState.data;
  const now = new Date();
  const statuses: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    suspended: "Suspenso",
  };
  const people = (users ?? []).map((u) => ({
    value: u.id,
    label: u.full_name,
  }));
  const roleOptions = (roles ?? []).map((r) => ({
    value: r.code,
    label: r.name,
  }));
  const unitOptions = (units ?? []).filter((u) => u.active).map((u) => ({
    value: u.id,
    label: u.name,
  }));
  const personName = (id: string) => people.find((p) => p.value === id)?.label ?? "Nome do utilizador indisponível";
  const roleName = (code: string) => roleOptions.find((r) => r.value === code)?.label ?? "Designação do perfil indisponível";
  const scopeName = (id: string | null) => id === null ? "Global" :
    units?.find((u) => u.id === id)?.name ??
    "Designação da unidade indisponível";
  const grantDisabled = usersState.status !== "ok" || rolesState.status !== "ok" || !readSucceeded(unitsState);
  const revocable = (grants ?? []).filter((g) =>
    ["Em vigor", "Programada"].includes(validityLabel(g.valid_from, g.valid_until, now)),
  );
  const revokeDisabled = grantsState.status !== "ok" || !readSucceeded(usersState) || !readSucceeded(rolesState) || !readSucceeded(unitsState) || revocable.length === 0;
  const permissionDisabled = rolesState.status !== "ok" || permissionsState.status !== "ok" || !readSucceeded(rolePermissionsState);
  return (
    <>
      <AdminHeading title="Hierarquia e Permissões">
        Cargo, perfil funcional e âmbito são conceitos separados. Não é
        permitido alterar os próprios privilégios.
      </AdminHeading>
      {usersState.status !== "ok" && (
        <AdminReadState status={usersState.status}>
          {readStateMessage(usersState.status, "utilizadores autorizados", "Sem utilizadores disponíveis neste âmbito.")}
        </AdminReadState>
      )}
      {unitsState.status !== "ok" && (
        <AdminReadState status={unitsState.status}>
          {readStateMessage(unitsState.status, "unidades autorizadas", "Sem unidades visíveis; o âmbito global continua sujeito a autorização própria.")}
        </AdminReadState>
      )}
      {permissionsState.status !== "ok" && (
        <AdminReadState status={permissionsState.status}>
          {readStateMessage(permissionsState.status, "permissões disponíveis", "Sem permissões disponíveis neste âmbito.")}
        </AdminReadState>
      )}
      <section className="panel table-scroll">
        <p>Datas e horas em Africa/Luanda. O estado da conta é distinto da vigência da atribuição.</p>
        {grantsState.status !== "ok" ? (
          <AdminReadState status={grantsState.status}>
            {readStateMessage(grantsState.status, "atribuições autorizadas", "Sem atribuições visíveis neste âmbito.")}
          </AdminReadState>
        ) : (
        <table>
          <caption>Atribuições autorizadas</caption>
          <thead>
            <tr>
              <th scope="col">Utilizador</th>
              <th scope="col">Estado da conta</th>
              <th scope="col">Perfil</th>
              <th scope="col">Âmbito</th>
              <th scope="col">Início</th>
              <th scope="col">Fim</th>
              <th scope="col">Vigência</th>
            </tr>
          </thead>
          <tbody>
            {grants?.map((g) => (
              <tr key={g.id}>
                <td>
                  {personName(g.user_id)}
                </td>
                <td>
                  {statuses[users?.find((u) => u.id === g.user_id)?.status ?? ""] ?? "Estado indisponível"}
                </td>
                <td>{roleName(g.role_code)}</td>
                <td>{scopeName(g.scope_unit_id)}</td>
                <td>{formatLuanda(g.valid_from)}</td>
                <td>{formatLuanda(g.valid_until)}</td>
                <td>{validityLabel(g.valid_from, g.valid_until, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </section>
      <div className="admin-grid">
        <MutationForm
          title="Atribuir perfil a terceiro"
          operation="grant_role"
          disabled={grantDisabled}
          disabledReason={grantDisabled ? "É necessário carregar utilizadores, perfis e unidades autorizados antes de atribuir. Uma consulta indisponível não define âmbito global." : undefined}
        >
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
        <MutationForm
          title="Encerrar atribuição"
          operation="revoke_role"
          disabled={revokeDisabled}
          disabledReason={revokeDisabled ? "É necessário carregar atribuições não encerradas e as suas referências antes de encerrar." : undefined}
        >
          <SelectField
            name="id"
            label="Atribuição"
            options={revocable
              .map((g) => ({
                value: g.id,
                label: `${personName(g.user_id)} — ${roleName(g.role_code)} — ${scopeName(g.scope_unit_id)}`,
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
          disabled={permissionDisabled}
          disabledReason={permissionDisabled ? "É necessário carregar perfis, permissões e capacidades existentes antes de configurar." : undefined}
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
        {rolesState.status !== "ok" ? <AdminReadState status={rolesState.status}>
          {readStateMessage(rolesState.status, "perfis funcionais", "Sem perfis funcionais visíveis neste âmbito.")}
        </AdminReadState> : rolePermissionsState.status === "refused" || rolePermissionsState.status === "unavailable" ? <AdminReadState status={rolePermissionsState.status}>
          {readStateMessage(rolePermissionsState.status, "capacidades dos perfis", "Sem capacidades visíveis neste âmbito.")}
        </AdminReadState> : <ul>
          {roles?.map((r) => (
            <li key={r.code}>
              <strong>{r.name}</strong>:{" "}
              {(rolePermissions ?? [])
                .filter((p) => p.role_code === r.code)
                .map((p) => p.permission_code)
                .join(", ") || "Sem permissões"}
            </li>
          ))}
        </ul>}
        <p>
          Delegações temporárias têm fundação de dados, mas não concedem acesso
          nesta versão. A validação de actividades não está implementada; a
          regra de proibição de autovalidação é testada na infraestrutura.
        </p>
      </section>
    </>
  );
}

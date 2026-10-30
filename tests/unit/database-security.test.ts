import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
let db: PGlite;
const user = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const unit = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function asUser<T>(id: string, run: () => Promise<T>) {
  await db.exec("begin; set local role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
  try {
    return await run();
  } finally {
    await db.exec("rollback");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.waitReady;
  await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(
    await readFile("supabase/migrations/202610300001_fase1.sql", "utf8"),
  );
  for (let i = 1; i <= 7; i++)
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      user(i),
      `fixture${i}@example.invalid`,
    ]);
  await db.exec("update public.profiles set status='active'");
  await db.query(
    "insert into public.organizational_units(id,code,name,kind) values($1,'TEST','Empresa de teste','company')",
    [unit(1)],
  );
  for (let i = 2; i <= 4; i++)
    await db.query(
      "insert into public.organizational_units(id,code,name,kind,parent_id) values($1,$2,$2,'department',$3)",
      [unit(i), `TEST-${i}`, i === 4 ? unit(2) : unit(1)],
    );
  await db.exec(
    "insert into public.roles values('org_admin','Organização de teste',false),('scope_admin','Âmbito de teste',false); insert into public.role_permissions values('org_admin','org.read'),('org_admin','org.manage'),('scope_admin','access.manage'),('scope_admin','users.read'),('scope_admin','users.manage');",
  );
  for (const [id, role, scope] of [
    [user(1), "access_admin", null],
    [user(1), "org_admin", null],
    [user(2), "manager", unit(2)],
    [user(3), "technician", unit(3)],
    [user(4), "technical_admin", null],
    [user(5), "scope_admin", unit(2)],
    [user(6), "technician", unit(2)],
  ])
    await db.query(
      "insert into public.user_role_assignments(user_id,role_code,scope_unit_id) values($1,$2,$3)",
      [id, role, scope],
    );
  await db.exec(
    "insert into public.positions(code,name) values('TEST','Cargo de teste')",
  );
  for (const [id, u] of [
    [user(2), unit(2)],
    [user(3), unit(3)],
    [user(6), unit(2)],
  ])
    await db.query(
      "insert into public.user_positions(user_id,unit_id,position_id) select $1,$2,id from public.positions limit 1",
      [id, u],
    );
}, 60000);
afterAll(async () => {
  await db?.close();
});
describe("PostgreSQL real isolado: RLS, integridade e segregação", () => {
  it("nega leituras anónimas", async () => {
    await db.exec("begin;set local role anon");
    try {
      await expect(db.query("select * from public.profiles")).rejects.toThrow();
    } finally {
      await db.exec("rollback");
    }
  });
  it("isola departamentos e inclui descendentes autorizados", () =>
    asUser(user(2), async () => {
      const r = await db.query<{ id: string }>(
        "select id from public.organizational_units order by id",
      );
      expect(r.rows.map((x) => x.id)).toEqual([unit(2), unit(4)]);
    }));
  it("não deixa gestor ler perfis de outro departamento", () =>
    asUser(user(2), async () => {
      const r = await db.query<{ id: string }>(
        "select id from public.profiles",
      );
      expect(r.rows.map((x) => x.id)).not.toContain(user(3));
      expect(r.rows.map((x) => x.id)).toContain(user(6));
    }));
  it("administrador técnico não recebe permissões funcionais", () =>
    asUser(user(4), async () => {
      const r = await db.query<{ allowed: boolean }>(
        "select public.has_permission('activities.read',$1) allowed",
        [unit(2)],
      );
      expect(r.rows[0].allowed).toBe(false);
    }));
  it("impede escrita directa de perfil mesmo pelo gestor", () =>
    asUser(user(2), async () => {
      await expect(
        db.query("update public.profiles set status='active' where id=$1", [
          user(3),
        ]),
      ).rejects.toThrow();
    }));
  it("impede a atribuição de privilégios a si próprio", () =>
    asUser(user(1), async () => {
      await expect(
        db.query("select public.admin_mutation('grant_role',$1::jsonb)", [
          JSON.stringify({
            user_id: user(1),
            role_code: "director",
            unit_id: unit(2),
          }),
        ]),
      ).rejects.toThrow();
    }));
  it("impede alteração indirecta do próprio perfil", () =>
    asUser(user(1), async () => {
      await expect(
        db.query("select public.admin_mutation('role_permission',$1::jsonb)", [
          JSON.stringify({
            role_code: "access_admin",
            permission_code: "activities.read",
            enabled: "true",
          }),
        ]),
      ).rejects.toThrow();
    }));
  it("administrador técnico não pode conceder papéis", () =>
    asUser(user(4), async () => {
      await expect(
        db.query("select public.admin_mutation('grant_role',$1::jsonb)", [
          JSON.stringify({
            user_id: user(3),
            role_code: "director",
            unit_id: unit(3),
          }),
        ]),
      ).rejects.toThrow();
    }));
  it("administrador de âmbito não concede fora da unidade", () =>
    asUser(user(5), async () => {
      await expect(
        db.query("select public.admin_mutation('grant_role',$1::jsonb)", [
          JSON.stringify({
            user_id: user(3),
            role_code: "director",
            unit_id: unit(3),
          }),
        ]),
      ).rejects.toThrow();
    }));
  it("atribuição autorizada é auditada com o actor real", () =>
    asUser(user(1), async () => {
      await db.query("select public.admin_mutation('grant_role',$1::jsonb)", [
        JSON.stringify({
          user_id: user(7),
          role_code: "manager",
          unit_id: unit(2),
        }),
      ]);
      const r = await db.query<{ actor_id: string }>(
        "select actor_id from public.audit_logs where entity_type='user_role_assignments' order by created_at desc limit 1",
      );
      expect(r.rows[0].actor_id).toBe(user(1));
    }));
  it("impede apagar auditoria", () =>
    asUser(user(1), async () => {
      await expect(db.query("delete from public.audit_logs")).rejects.toThrow();
    }));
  it("nega poderes a utilizador suspenso", async () => {
    await db.query(
      "update public.profiles set status='suspended' where id=$1",
      [user(2)],
    );
    try {
      await asUser(user(2), async () => {
        const r = await db.query<{ allowed: boolean }>(
          "select public.has_permission('activities.create',$1) allowed",
          [unit(2)],
        );
        expect(r.rows[0].allowed).toBe(false);
      });
    } finally {
      await db.query("update public.profiles set status='active' where id=$1", [
        user(2),
      ]);
    }
  });
  it("nega concessão expirada", async () => {
    await db.query(
      "insert into public.user_role_assignments(user_id,role_code,scope_unit_id,valid_from,valid_until) values($1,'manager',$2,now()-interval '2 days',now()-interval '1 day')",
      [user(7), unit(3)],
    );
    await asUser(user(7), async () => {
      const r = await db.query<{ allowed: boolean }>(
        "select public.has_permission('activities.create',$1) allowed",
        [unit(3)],
      );
      expect(r.rows[0].allowed).toBe(false);
    });
  });
  it("proíbe autovalidação e permite validação de terceiro autorizado", () =>
    asUser(user(2), async () => {
      const a = await db.query<{ allowed: boolean }>(
        "select public.may_validate_activity($1::uuid[],$2) allowed",
        [[user(2)], unit(2)],
      );
      expect(a.rows[0].allowed).toBe(false);
      const b = await db.query<{ allowed: boolean }>(
        "select public.may_validate_activity($1::uuid[],$2) allowed",
        [[user(6)], unit(2)],
      );
      expect(b.rows[0].allowed).toBe(true);
    }));
  it("rejeita ciclos nas unidades", async () => {
    await db.exec("begin");
    try {
      await expect(
        db.query(
          "update public.organizational_units set parent_id=$1 where id=$2",
          [unit(4), unit(2)],
        ),
      ).rejects.toThrow();
    } finally {
      await db.exec("rollback");
    }
  });
  it("rejeita uma segunda empresa", async () => {
    await expect(
      db.query(
        "insert into public.organizational_units(code,name,kind) values('TEST2','Teste','company')",
      ),
    ).rejects.toThrow();
  });
  it("preserva código alfanumérico e zeros à esquerda dos centros de custo", async () => {
    const r = await db.query<{ code: string }>(
      "insert into public.cost_centers(code,name) values('000A-01','Exemplo apenas em teste') returning code",
    );
    expect(r.rows[0].code).toBe("000A-01");
  });
  it("não concede leitura de custos nem integração por defeito", () =>
    asUser(user(2), async () => {
      expect(
        (await db.query("select * from public.cost_centers")).rows,
      ).toHaveLength(0);
      expect(
        (await db.query("select * from public.import_batches")).rows,
      ).toHaveLength(0);
    }));
});

describe("Histórico e integridade administrativa adicionais", () => {
  it("transferência encerra associação anterior e preserva histórico", async () => {
    const p = await db.query<{ id: string }>(
      "select id from public.positions limit 1",
    );
    await asUser(user(4), async () => {
      await db.query(
        "select public.admin_mutation('assign_position',$1::jsonb)",
        [
          JSON.stringify({
            user_id: user(6),
            unit_id: unit(3),
            position_id: p.rows[0].id,
          }),
        ],
      );
      const r = await db.query<{ unit_id: string; valid_until: string | null }>(
        "select unit_id,valid_until from public.user_positions where user_id=$1",
        [user(6)],
      );
      expect(r.rows).toHaveLength(2);
      expect(r.rows.filter((x) => x.valid_until === null)[0].unit_id).toBe(
        unit(3),
      );
    });
  });
  it("rejeita chefias circulares", () =>
    asUser(user(1), async () => {
      await db.query(
        "select public.admin_mutation('set_supervisor',$1::jsonb)",
        [
          JSON.stringify({
            user_id: user(6),
            supervisor_id: user(2),
            unit_id: unit(2),
          }),
        ],
      );
      await expect(
        db.query("select public.admin_mutation('set_supervisor',$1::jsonb)", [
          JSON.stringify({
            user_id: user(2),
            supervisor_id: user(6),
            unit_id: unit(2),
          }),
        ]),
      ).rejects.toThrow();
    }));
  it("responsável da unidade deve pertencer à unidade", () =>
    asUser(user(1), async () => {
      await expect(
        db.query("select public.admin_mutation('set_responsible',$1::jsonb)", [
          JSON.stringify({ user_id: user(3), unit_id: unit(2) }),
        ]),
      ).rejects.toThrow();
    }));
  it("não permite associar identidade ERP a entidade interna inexistente", async () => {
    await db.exec("begin");
    try {
      await db.exec(
        "insert into public.integration_sources values('test','Só teste','{}')",
      );
      await expect(
        db.query(
          "insert into public.external_identity_mappings(source_code,entity_type,cost_center_id,external_id) values('test','cost_center',$1,'TEST')",
          [unit(99)],
        ),
      ).rejects.toThrow();
    } finally {
      await db.exec("rollback");
    }
  });
  it("revoga uma concessão ainda válida com fim agendado", () =>
    asUser(user(1), async () => {
      await db.query("select public.admin_mutation('grant_role',$1::jsonb)", [
        JSON.stringify({
          user_id: user(7),
          role_code: "manager",
          unit_id: unit(2),
          valid_until: "2099-01-01T00:00:00Z",
        }),
      ]);
      const r = await db.query<{ id: string }>(
        "select id from public.user_role_assignments where user_id=$1 and scope_unit_id=$2 and valid_until>now()",
        [user(7), unit(2)],
      );
      await db.query("select public.admin_mutation('revoke_role',$1::jsonb)", [
        JSON.stringify({ id: r.rows[0].id }),
      ]);
      const after = await db.query<{ expired: boolean }>(
        "select valid_until<=now() expired from public.user_role_assignments where id=$1",
        [r.rows[0].id],
      );
      expect(after.rows[0].expired).toBe(true);
    }));
});

it("reorganização não amplia indirectamente as concessões próprias", async () => {
  await db.exec("begin");
  try {
    await db.query(
      "insert into public.user_role_assignments(user_id,role_code,scope_unit_id) values($1,'manager',$2)",
      [user(1), unit(2)],
    );
    await db.exec("set local role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      user(1),
    ]);
    await expect(
      db.query("select public.admin_mutation('unit_update',$1::jsonb)", [
        JSON.stringify({
          id: unit(3),
          name: "Só teste",
          parent_id: unit(2),
          active: true,
        }),
      ]),
    ).rejects.toThrow();
  } finally {
    await db.exec("rollback");
  }
});

it("recusa concessões activas duplicadas para permitir revogação inequívoca", () =>
  asUser(user(1), async () => {
    const payload = JSON.stringify({
      user_id: user(7),
      role_code: "director",
      unit_id: unit(2),
    });
    await db.query("select public.admin_mutation('grant_role',$1::jsonb)", [
      payload,
    ]);
    await expect(
      db.query("select public.admin_mutation('grant_role',$1::jsonb)", [
        payload,
      ]),
    ).rejects.toThrow();
  }));

import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ACTIVITY_DRAFT_PAGE_SIZE,
  type ActivityDraft,
  type ActivityDraftDetailResult,
  type ActivityDraftListResult,
  type ActivityDraftUnitListResult,
  type ActivityDraftWriteResult,
  type CreateActivityDraftInput,
} from "./contracts";
import { activityDraftIdSchema, activityDraftInputSchema, activityDraftPaginationSchema } from "./validation";
import { activityReadFailure, classifyActivityDatabaseError } from "./policy";

const name = z.string().min(1);
const unitRelation = z.object({ code: name, name }).strict();
const personRelation = z.object({ full_name: name }).strict();
const relation = <T extends z.ZodType>(schema: T) => z.union([schema, z.array(schema).max(1), z.null()]).optional();
const draftRowSchema = z.object({
  id: z.uuid(),
  code: z.string().regex(/^ACT-[0-9A-F]{32}$/),
  title: z.string().min(1),
  description: z.string(),
  responsible_unit_id: z.uuid(),
  created_by: z.uuid(),
  status: z.literal("draft"),
  version: z.number().int().positive(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
  responsible_unit: relation(unitRelation),
  creator: relation(personRelation),
}).strict();
const unitSchema = z.object({ id: z.uuid(), code: name, name }).strict();
const createdSchema = z.object({
  id: z.uuid(), code: z.string().regex(/^ACT-[0-9A-F]{32}$/),
  status: z.literal("draft"), version: z.literal(1), replayed: z.boolean(),
}).strict();

const columns = "id,code,title,description,responsible_unit_id,created_by,status,version,created_at,updated_at,responsible_unit:organizational_units!responsible_unit_id(code,name),creator:profiles!created_by(full_name)";
const responseFailed = (result: { error: unknown; status?: number }) => Boolean(result.error) ||
  (result.status !== undefined && (!Number.isFinite(result.status) || result.status < 200 || result.status >= 300));

function toDraft(row: z.infer<typeof draftRowSchema>): ActivityDraft {
  const unit = Array.isArray(row.responsible_unit) ? row.responsible_unit[0] : row.responsible_unit;
  const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
  return {
    id: row.id, code: row.code, title: row.title, description: row.description,
    responsible_unit_id: row.responsible_unit_id, created_by: row.created_by,
    status: row.status, version: row.version, created_at: row.created_at, updated_at: row.updated_at,
    responsible_unit_name: unit?.name ?? null, creator_name: creator?.full_name ?? null,
  };
}

export async function getActivityDrafts(options: { page?: unknown; pageSize?: unknown } = {}): Promise<ActivityDraftListResult> {
  const parsed = activityDraftPaginationSchema.safeParse(options);
  const pagination = { page: parsed.success ? parsed.data.page : 1, pageSize: parsed.success ? parsed.data.pageSize : ACTIVITY_DRAFT_PAGE_SIZE, total: null, totalPages: null };
  if (!parsed.success) return { state: "unavailable", data: [], pagination, message: "Os parâmetros de paginação não são válidos." };
  try {
    const db = await createSupabaseServerClient();
    const { page, pageSize } = parsed.data;
    const result = await db.from("activities").select(columns, { count: "exact" })
      .eq("status", "draft").order("created_at", { ascending: false }).order("id", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (responseFailed(result)) return { ...activityReadFailure(result.error, result.status), data: [], pagination };
    const rows = z.array(draftRowSchema).max(pageSize).safeParse(result.data);
    if (!rows.success || !Number.isSafeInteger(result.count) || result.count === null || result.count < rows.data.length)
      return { ...activityReadFailure(null), data: [], pagination };
    const data = rows.data.map(toDraft);
    return {
      state: data.length ? "ok" : "empty", data, message: data.length ? "" : "Sem rascunhos visíveis nesta página e âmbito.",
      pagination: { page, pageSize, total: result.count, totalPages: Math.ceil(result.count / pageSize) },
    };
  } catch {
    return { ...activityReadFailure(null), data: [], pagination };
  }
}

export async function getActivityDraft(id: string): Promise<ActivityDraftDetailResult> {
  if (!activityDraftIdSchema.safeParse(id).success) return { state: "invalid", data: null, message: "O identificador do rascunho não é válido." };
  try {
    const db = await createSupabaseServerClient();
    const result = await db.from("activities").select(columns).eq("id", id).eq("status", "draft").maybeSingle();
    if (responseFailed(result)) return { ...activityReadFailure(result.error, result.status), data: null };
    if (result.data === null) return { state: "not-found", data: null, message: "O rascunho não foi encontrado no âmbito autorizado." };
    const row = draftRowSchema.safeParse(result.data);
    if (!row.success) return { ...activityReadFailure(null), data: null };
    return { state: "ok", data: toDraft(row.data), message: "" };
  } catch {
    return { ...activityReadFailure(null), data: null };
  }
}

export async function getActivityDraftUnits(): Promise<ActivityDraftUnitListResult> {
  try {
    const db = await createSupabaseServerClient();
    const result = await db.rpc("list_activity_draft_units");
    if (responseFailed(result)) return { ...activityReadFailure(result.error, result.status), data: [] };
    const rows = z.array(unitSchema).safeParse(result.data);
    if (!rows.success) return { ...activityReadFailure(null), data: [] };
    return { state: rows.data.length ? "ok" : "empty", data: rows.data, message: rows.data.length ? "" : "Sem unidades autorizadas disponíveis para criar rascunhos." };
  } catch {
    return { ...activityReadFailure(null), data: [] };
  }
}

export async function createActivityDraftRecord(input: CreateActivityDraftInput): Promise<ActivityDraftWriteResult> {
  const parsed = activityDraftInputSchema.safeParse(input);
  if (!parsed.success) return { state: "validation", data: null, retryable: false, message: "Verifique os campos obrigatórios e os limites do rascunho." };
  try {
    const db = await createSupabaseServerClient();
    const result = await db.rpc("create_activity_draft", {
      unit_id: parsed.data.responsible_unit_id,
      title: parsed.data.title,
      description: parsed.data.description,
      request_id: parsed.data.request_id,
    });
    if (responseFailed(result)) {
      const issue = classifyActivityDatabaseError(result.error, result.status);
      if (issue === "refused") return { state: "refused", data: null, retryable: false, message: "A criação do rascunho foi recusada. Confirme os seus poderes e o âmbito autorizado." };
      if (issue === "validation") return { state: "validation", data: null, retryable: false, message: "O banco recusou os dados do rascunho. Verifique os campos e a unidade escolhida." };
      if (issue === "conflict") return { state: "conflict", data: null, retryable: false, message: "Este identificador de pedido já corresponde a outro conteúdo. Confira os rascunhos antes de iniciar uma nova criação." };
      if (issue === "schema-unavailable") return { state: "unavailable", data: null, retryable: false, message: "O módulo de actividades ainda não está disponível neste ambiente. Aguarde a instalação autorizada; nenhum resultado de criação foi confirmado." };
    } else {
      const row = createdSchema.safeParse(result.data);
      if (row.success) return { state: "ok", data: row.data };
    }
  } catch { /* O envio pode ter sido confirmado pelo banco; conservar intenção. */ }
  return { state: "unavailable", data: null, retryable: true, message: "Não foi possível confirmar a criação. Conserve os mesmos dados e identificador de pedido; confira a lista antes de iniciar outra criação." };
}

import { z } from "zod";
import { ACTIVITY_DRAFT_MAX_PAGE_SIZE, ACTIVITY_DRAFT_PAGE_SIZE } from "./contracts";

const codePoints = (value: string) => Array.from(value).length;
export const activityDraftIdSchema = z.uuid();
export const activityDraftInputSchema = z.object({
  title: z.string().trim().refine((value) => codePoints(value) >= 1 && codePoints(value) <= 200),
  description: z.string().refine((value) => codePoints(value) <= 10000).default(""),
  responsible_unit_id: z.uuid(),
  request_id: z.uuid(),
}).strict();

const positiveInteger = (max: number) => z.union([
  z.number(),
  z.string().regex(/^[1-9]\d{0,6}$/).transform(Number),
]).pipe(z.number().int().positive().max(max));
export const activityDraftPaginationSchema = z.object({
  page: positiveInteger(1_000_000).default(1),
  pageSize: positiveInteger(ACTIVITY_DRAFT_MAX_PAGE_SIZE).default(ACTIVITY_DRAFT_PAGE_SIZE),
}).strict();

const messages: Record<string, string> = {
  title: "Indique um título entre 1 e 200 caracteres.",
  description: "A descrição deve ter no máximo 10000 caracteres.",
  responsible_unit_id: "Seleccione uma unidade autorizada.",
  request_id: "A intenção de criação não é válida. Reabra o formulário antes de criar.",
  _form: "O formulário contém campos não permitidos ou repetidos.",
};

export function validateActivityDraftForm(form: FormData) {
  if (!(form instanceof FormData)) return { success: false as const, fieldErrors: { _form: messages._form } };
  const values: Record<string, FormDataEntryValue> = Object.create(null);
  for (const [name, value] of form.entries()) {
    // Metadados do transporte React não são campos de domínio ou autorização.
    if (name.startsWith("$ACTION_")) continue;
    if (Object.hasOwn(values, name)) return { success: false as const, fieldErrors: { _form: messages._form } };
    values[name] = value;
  }
  const parsed = activityDraftInputSchema.safeParse(values);
  if (parsed.success) return { success: true as const, data: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const name = typeof issue.path[0] === "string" && Object.hasOwn(messages, issue.path[0]) ? issue.path[0] : "_form";
    fieldErrors[name] = messages[name];
  }
  return { success: false as const, fieldErrors };
}

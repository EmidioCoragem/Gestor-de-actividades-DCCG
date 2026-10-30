import { z } from "zod";
const id = z.uuid();
const optionalId = z.union([id, z.literal("")]).optional();
const name = z.string().trim().min(1).max(160);
const code = z.string().trim().min(1).max(60);
const schemas = {
  unit_create: z.object({
    code,
    name,
    kind: z.enum([
      "company",
      "direction",
      "department",
      "section",
      "team",
      "other",
    ]),
    parent_id: optionalId,
  }),
  unit_update: z.object({
    id,
    name,
    parent_id: optionalId,
    active: z.enum(["true", "false"]),
  }),
  position_create: z.object({ code, name }),
  assign_position: z.object({ user_id: id, unit_id: id, position_id: id }),
  set_responsible: z.object({ user_id: id, unit_id: id }),
  set_supervisor: z.object({ user_id: id, supervisor_id: id, unit_id: id }),
  user_status: z.object({
    user_id: id,
    status: z.enum(["active", "inactive", "suspended"]),
  }),
  grant_role: z.object({
    user_id: id,
    role_code: code,
    unit_id: optionalId,
    valid_until: z
      .union([z.iso.datetime({ local: true, offset: true }), z.literal("")])
      .optional(),
  }),
  revoke_role: z.object({ id }),
  role_create: z.object({ code: code.regex(/^[a-z][a-z0-9_.-]{1,59}$/), name }),
  role_permission: z.object({
    role_code: code,
    permission_code: code,
    enabled: z.enum(["true", "false"]),
  }),
} as const;
export type AdminOperation = keyof typeof schemas;
export function validateMutation(operation: string, values: unknown) {
  if (!Object.hasOwn(schemas, operation)) return null;
  const schema = schemas[operation as AdminOperation];
  const result = schema.safeParse(values);
  if (!result.success) return null;
  const data = result.data;
  if (
    "valid_until" in data &&
    data.valid_until &&
    !/(Z|[+-]\d{2}:\d{2})$/.test(data.valid_until)
  ) {
    return {
      ...data,
      valid_until: new Date(`${data.valid_until}+01:00`).toISOString(),
    };
  }
  return data;
}

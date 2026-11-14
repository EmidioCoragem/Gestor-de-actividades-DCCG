export const ACTIVITY_STATUSES = [
  "draft", "assigned", "in_progress", "awaiting_validation", "completed", "suspended", "cancelled",
] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export type ActivityDraft = {
  id: string;
  code: string;
  title: string;
  description: string;
  responsible_unit_id: string;
  created_by: string;
  status: "draft";
  version: number;
  created_at: string;
  updated_at: string;
  responsible_unit_name: string | null;
  creator_name: string | null;
};

export type CreateActivityDraftInput = {
  title: string;
  description: string;
  responsible_unit_id: string;
  request_id: string;
};

export type CreatedActivityDraft = {
  id: string;
  code: string;
  status: "draft";
  version: 1;
  replayed: boolean;
};

export type ActivityActionResult = {
  status: "idle" | "success" | "validation" | "refused" | "unavailable" | "conflict";
  message: string;
  draftId?: string;
  code?: string;
  retryable?: boolean;
  fieldErrors?: Record<string, string>;
};

export type ActivityDraftUnit = { id: string; code: string; name: string };
export type ActivityDraftPagination = {
  page: number;
  pageSize: number;
  total: number | null;
  totalPages: number | null;
};
export type ActivityDraftListResult = {
  state: "ok" | "empty" | "refused" | "unavailable";
  data: ActivityDraft[];
  pagination: ActivityDraftPagination;
  message: string;
};
export type ActivityDraftDetailResult = {
  state: "ok" | "not-found" | "invalid" | "refused" | "unavailable";
  data: ActivityDraft | null;
  message: string;
};
export type ActivityDraftUnitListResult = {
  state: "ok" | "empty" | "refused" | "unavailable";
  data: ActivityDraftUnit[];
  message: string;
};
export type ActivityDraftWriteResult =
  | { state: "ok"; data: CreatedActivityDraft }
  | { state: "validation" | "refused" | "unavailable" | "conflict"; data: null; message: string; retryable: boolean };

export const ACTIVITY_DRAFT_PAGE_SIZE = 20;
export const ACTIVITY_DRAFT_MAX_PAGE_SIZE = 50;

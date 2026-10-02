import { execute, now } from "./db";
import { newId } from "./ids";

// Every sensitive action lands here: sign-ins, role changes, API keys, exports. Nothing reads
// the table yet; there is no screen for it and no export.
export async function recordActivity(input: {
  orgId: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await execute(
    "INSERT INTO activity_events (id, org_id, actor_id, action, target_type, target_id, ip, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [newId("evt"), input.orgId, input.actorId, input.action, input.targetType, input.targetId, input.ip ?? null, JSON.stringify(input.metadata ?? {}), now()],
  );
}

import { requireRole, requireUser } from "@/lib/auth";
import { exportTickets } from "@/lib/tickets";
import { recordActivity } from "@/lib/activity";
import { failure } from "../_lib";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, "admin", "agent");
    const csv = await exportTickets(user);
    await recordActivity({
      orgId: user.orgId, actorId: user.id, action: "tickets.exported", targetType: "export", targetId: `tickets-${Date.now()}`,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null, metadata: { rows: csv.split("\n").length - 2, format: "csv" },
    });
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=tickets.csv" } });
  } catch (error) {
    return failure(error);
  }
}

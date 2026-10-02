// Deterministic sample data: three organizations that run their customer support on
// Marrowstone Desk, their agents, their customers, and 2,000 tickets with message threads over
// eighteen months. Same seed, same data, every time. Used by seed.ts and export-backlog.ts.

export type Org = { id: string; name: string; slug: string; plan: string; createdAt: string; product: string; queues: Queue[]; tags: Tag[] };
export type Queue = { id: string; orgId: string; name: string; slug: string };
export type Tag = { id: string; orgId: string; name: string };
export type User = { id: string; orgId: string; email: string; name: string; role: "admin" | "agent" | "customer"; company?: string; createdAt: string; lastLoginAt: string | null };
export type Ticket = {
  id: string; orgId: string; queueId: string; number: number; subject: string; body: string;
  status: "open" | "pending" | "resolved" | "closed"; priority: "low" | "normal" | "high" | "urgent";
  channel: "email" | "portal" | "api"; requesterId: string; assigneeId: string | null;
  createdAt: string; updatedAt: string; firstResponseDueAt: string; resolutionDueAt: string;
  firstRespondedAt: string | null; resolvedAt: string | null; csatScore: number | null; tagIds: string[];
  messages: Message[];
};
export type Message = { id: string; ticketId: string; authorId: string | null; authorType: "agent" | "customer" | "system"; body: string; createdAt: string };
export type ActivityEvent = { id: string; orgId: string; actorId: string | null; action: string; targetType: string; targetId: string; ip: string; metadata: Record<string, unknown>; createdAt: string };
export type Dataset = { orgs: Org[]; users: User[]; tickets: Ticket[]; events: ActivityEvent[] };

// mulberry32: small, deterministic, good enough for sample data.
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = rng(20260402);
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const between = (low: number, high: number) => low + Math.floor(random() * (high - low + 1));
const chance = (probability: number) => random() < probability;

let counter = 0;
function id(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString(36).padStart(8, "0")}`;
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

const FIRST = ["Aisha", "Ben", "Carla", "Dmitri", "Elena", "Farid", "Grace", "Hugo", "Ingrid", "Jamal", "Keiko", "Luis", "Maya", "Noah", "Olu", "Priya", "Quinn", "Rosa", "Sam", "Tomas", "Uma", "Victor", "Wen", "Ximena", "Yusuf", "Zoe", "Anders", "Bea", "Chidi", "Dana", "Emil", "Fatima", "Gael", "Hana", "Ivan", "Jade", "Kofi", "Lena", "Marco", "Nadia"];
const LAST = ["Okafor", "Lindqvist", "Moreau", "Petrov", "Nakamura", "Haddad", "Silva", "Brennan", "Kowalski", "Mensah", "Tanaka", "Romero", "Fischer", "Larsen", "Adeyemi", "Iyer", "Doyle", "Castillo", "Novak", "Varga", "Rahman", "Costa", "Zhang", "Delgado", "Osei", "Mendes", "Berg", "Schulz", "Eze", "Khan", "Rossi", "Byrne", "Sato", "Duarte", "Nwosu", "Lund", "Park", "Reyes", "Abara", "Holm"];
const COMPANIES = ["Cascadia Produce", "Pike Street Bakery", "Harbor and Vine", "Meridian Dental", "Olympic Hardware", "Ballard Roasters", "Summit Physio", "Evergreen Kitchens", "Rainier Textiles", "Salish Labs", "Kestrel Outfitters", "Alder Creek Winery", "Fremont Bicycle Co", "Puget Marine Supply", "Greenlake Veterinary", "Northshore Printing", "Lakeside Optometry", "Madrona Books", "Tideline Seafood", "Juniper Home Care", "Beacon Hill Pharmacy", "Westlake Dermatology", "Cedar Grove Nursery", "Blue Heron Cafe", "Anchor Point Logistics", "Ridgeline Climbing", "Sound Transit Parts", "Copperfield Apparel", "Driftwood Furniture", "Fernhill Pediatrics", "Granite Peak Tools", "Harvest Moon Market", "Ironwood Fabrication", "Kingfisher Travel", "Lantern Studio", "Mossback Cannabis Co", "Nightjar Records", "Osprey Charters", "Paperbark Stationery", "Quarry Street Gym", "Redwood Orthodontics", "Saltgrass Nursery", "Thistle and Thorn Florist", "Umber Ceramics", "Vantage Security", "Willowbrook Senior Living", "Yarrow Botanicals", "Zenith Auto Glass", "Arbor Landscaping", "Bramble Farmstand", "Compass Realty", "Dogwood Daycare", "Elk Ridge Brewing", "Foxglove Apothecary", "Gull Harbor Marina", "Heron Lane Catering", "Indigo Tattoo", "Jetty Surf Shop", "Kelp Forest Diving", "Larch Mountain Guides"];

type Topic = { tag: string; queue: string; subjects: string[]; openers: string[]; details: string[]; priority: Ticket["priority"][] };
type ProductProfile = { name: string; slug: string; product: string; queues: string[]; topics: Topic[] };

const CLOSERS = ["Can you look into this?", "Let me know what you need from me.", "This is blocking us today.", "Not urgent but it keeps happening.", "Happy to jump on a call.", "Thanks in advance.", "We have a customer waiting on this.", "Please advise."];

const PROFILES: ProductProfile[] = [
  {
    name: "Northgate Freight", slug: "northgate", product: "Northgate, a freight tracking platform for regional shippers",
    queues: ["Technical", "Billing", "Integrations", "Account"],
    topics: [
      { tag: "tracking", queue: "Technical", priority: ["high", "urgent", "normal"], subjects: ["Shipment {ref} shows no scans since {when}", "Tracking page stuck on 'label created' for {ref}", "ETA on {ref} jumped by three days overnight", "Missing delivery confirmation for {ref}"], openers: ["Our shipment {ref} has had no tracking update since {when}.", "The tracking page for {ref} has said 'label created' for two days.", "{ref} was delivered yesterday but the portal still shows it in transit."], details: ["The carrier's own site shows it moving.", "Our customer is asking for proof of delivery.", "Three other shipments from the same pickup are fine.", "This happened twice last month too."] },
      { tag: "webhooks", queue: "Integrations", priority: ["high", "normal"], subjects: ["Webhook deliveries failing since {when}", "Getting duplicate shipment.updated webhooks", "Webhook signature doesn't verify after key rotation"], openers: ["Our webhook endpoint stopped receiving events around {when}.", "We are receiving every shipment.updated event two or three times.", "Since we rotated the signing key, every webhook fails signature verification."], details: ["Our logs show 0 requests from your side.", "We retried from the dashboard and nothing arrived.", "The payload looks right, only the signature header changed format.", "We are on the v2 API."] },
      { tag: "edi", queue: "Integrations", priority: ["normal", "high"], subjects: ["EDI 214 import rejected: segment {seg}", "EDI 204 tenders not appearing in the queue", "Carrier EDI file imported twice"], openers: ["The EDI 214 file from {carrier} is rejected with an error on segment {seg}.", "Tenders sent as EDI 204 are not showing up in the Northgate queue.", "A carrier file was imported twice and now every shipment has two status rows."], details: ["The file validates in our EDI tool.", "This started after the {when} release.", "We can send a sample file.", "It affects all loads from that carrier."] },
      { tag: "invoicing", queue: "Billing", priority: ["normal", "low"], subjects: ["Invoice {inv} charged for {n} shipments, we sent {m}", "Accessorial fees applied twice on {inv}", "Need the invoice CSV in a different format"], openers: ["Invoice {inv} bills us for {n} shipments but we only tendered {m} that month.", "The accessorial fees on {inv} show up twice.", "Our accounting team needs the invoice export with one line per shipment."], details: ["I attached the shipment list from the dashboard.", "This is the second month in a row.", "We pay by ACH on net 30 so this needs fixing before Friday.", "Finance will not pay until it is corrected."] },
      { tag: "access", queue: "Account", priority: ["normal", "high"], subjects: ["New dispatcher can't see the Seattle lanes", "Locked out after password reset", "Need to remove a former employee's access"], openers: ["I added a dispatcher yesterday and she cannot see any of the Seattle lanes.", "After resetting my password the login page loops back to itself.", "An employee left last week and still has an active login."], details: ["She has the same role as the others.", "Tried two browsers and incognito.", "We need this done today for compliance.", "The admin page shows no option to revoke."] },
      { tag: "mobile", queue: "Technical", priority: ["normal", "low"], subjects: ["Driver app crashes when scanning", "Photos from the driver app upload as blank", "Offline scans never sync"], openers: ["The driver app closes as soon as the barcode scanner opens.", "Proof-of-delivery photos taken in the app arrive as blank images.", "Scans done without signal never make it to the shipment."], details: ["Happens on Android 15 only as far as we can tell.", "Reinstalling did not help.", "Three drivers reported it this week.", "It worked last month."] },
      { tag: "reporting", queue: "Technical", priority: ["low", "normal"], subjects: ["On-time report excludes weekend deliveries", "Export to CSV times out for {n} rows", "Want a report of dwell time by terminal"], openers: ["The on-time delivery report does not count anything delivered on a Saturday.", "Exporting the shipment list to CSV times out above a few thousand rows.", "We would like a report of average dwell time per terminal."], details: ["Our SLA counts weekends.", "We need the full year for the audit.", "Even a scheduled email would work.", "The dashboard numbers do not match the export."] },
    ],
  },
  {
    name: "Bluefin Payroll", slug: "bluefin", product: "Bluefin, a payroll service for small employers",
    queues: ["Payroll", "Tax", "Integrations", "Account"],
    topics: [
      { tag: "pay-run", queue: "Payroll", priority: ["urgent", "high"], subjects: ["Pay run for {period} failed at approval", "Overtime calculated wrong for {n} employees", "Employee missing from the {period} pay run"], openers: ["The pay run for {period} fails at the approval step with a generic error.", "Overtime for {n} hourly employees was calculated on the wrong rate.", "One employee is missing from the {period} pay run even though she is active."], details: ["Payday is tomorrow.", "The preview looked right.", "We did not change anything since last period.", "Her profile shows a start date in the future, which is wrong."] },
      { tag: "bank-file", queue: "Payroll", priority: ["urgent", "high"], subjects: ["ACH file rejected by our bank", "Direct deposit went to the wrong account for {name}", "Bank file has a negative amount"], openers: ["Our bank rejected the ACH file for {period} citing a malformed batch header.", "{name}'s direct deposit went to an account we removed last month.", "The generated bank file contains a negative net pay line."], details: ["We need to re-run the deposit today.", "The bank gave us a rejection code.", "This affects {n} employees.", "Please confirm whether the deposit was reversed."] },
      { tag: "tax-forms", queue: "Tax", priority: ["high", "normal"], subjects: ["W-2 shows wrong state wages for {name}", "Quarterly 941 totals don't match the pay runs", "State unemployment rate not updated"], openers: ["The W-2 preview for {name} shows state wages for a state she never worked in.", "The 941 draft for the quarter does not match the sum of the pay runs.", "Our state unemployment rate changed in January and the filings still use the old one."], details: ["The deadline is at the end of the month.", "We moved offices mid-year.", "Our accountant flagged it.", "Attached the notice from the state."] },
      { tag: "onboarding", queue: "Account", priority: ["normal", "low"], subjects: ["New hire can't complete the onboarding link", "I-9 documents not saving", "Need to onboard {n} seasonal workers at once"], openers: ["A new hire says the onboarding link says expired even though I sent it this morning.", "Employees upload their I-9 documents and the page says saved, but nothing is attached.", "We are hiring {n} seasonal workers next week and need to onboard them in bulk."], details: ["Resending the link gives the same result.", "Two different employees, two different browsers.", "A CSV upload would be ideal.", "Our HR coordinator is out this week."] },
      { tag: "accounting-sync", queue: "Integrations", priority: ["normal", "high"], subjects: ["Journal entries not syncing to our accounting system", "Sync created duplicate expense accounts", "Mapping screen won't save"], openers: ["Payroll journal entries have not synced to our accounting software since {when}.", "The sync created a duplicate expense account for every department.", "The account mapping screen says saved but reverts when I reload."], details: ["The connection shows as healthy.", "Our books are now off by the last two pay runs.", "We reconnected the integration and it did not help.", "This worked before the {when} update."] },
      { tag: "two-factor", queue: "Account", priority: ["high", "normal"], subjects: ["Locked out: lost the phone with the authenticator", "2FA codes rejected as expired", "Can't disable 2FA for a former admin"], openers: ["I lost the phone with my authenticator app and cannot get into the admin account.", "Every 2FA code is rejected as expired even though the clock is right.", "A former admin left and we cannot remove their 2FA device to reassign the account."], details: ["Payroll has to be approved by Thursday.", "The recovery codes were never printed.", "I can verify my identity any way you need.", "We tried the recovery flow twice."] },
      { tag: "reports", queue: "Payroll", priority: ["low", "normal"], subjects: ["Payroll register export missing employer taxes", "Need labor cost by department for the board", "PTO balances wrong in the report"], openers: ["The payroll register export leaves out the employer tax columns.", "Our board wants labor cost by department for the last four quarters.", "PTO balances in the report do not match what employees see."], details: ["We used to get those columns.", "Monthly would be fine.", "Three employees have negative balances in the report.", "Excel is fine."] },
    ],
  },
  {
    name: "Larkspur Clinics", slug: "larkspur", product: "Larkspur, scheduling and patient communication software for small clinics",
    queues: ["Scheduling", "Patient Portal", "Billing", "Integrations"],
    topics: [
      { tag: "reminders", queue: "Scheduling", priority: ["high", "normal"], subjects: ["Appointment reminders not sending since {when}", "Reminder texts going out at 3am", "Patients getting reminders for cancelled appointments"], openers: ["No appointment reminder texts have gone out since {when}.", "Reminder texts are being sent at three in the morning.", "Patients keep getting reminders for appointments we cancelled."], details: ["We had {n} no-shows yesterday because of it.", "The timezone on the clinic profile is correct.", "The reminder log shows them as delivered.", "This started after we added the second location."] },
      { tag: "calendar-sync", queue: "Integrations", priority: ["normal", "high"], subjects: ["Calendar sync creating duplicate appointments", "Provider calendar stopped syncing", "Blocked time in the calendar still bookable"], openers: ["The calendar sync creates a duplicate of every appointment.", "Dr. {name}'s calendar stopped syncing on {when}.", "Time blocked in the external calendar is still bookable in the portal."], details: ["We disconnected and reconnected twice.", "Other providers sync fine.", "Patients booked into lunch breaks three times this week.", "The sync status page says healthy."] },
      { tag: "portal-login", queue: "Patient Portal", priority: ["normal", "high"], subjects: ["Patients can't log in to the portal", "Magic link emails arriving an hour late", "Patient sees another patient's name on the portal"], openers: ["Several patients report they cannot log in to the portal; the code never arrives.", "Portal sign-in emails are arriving about an hour late.", "A patient told us the portal greeted her with someone else's name."], details: ["This is a privacy concern and we need an answer today.", "It is mostly patients on one email provider.", "We tested with our own addresses and saw the same.", "Front desk is fielding calls about it all morning."] },
      { tag: "eligibility", queue: "Billing", priority: ["high", "normal"], subjects: ["Insurance eligibility check returns unknown for {n} patients", "Eligibility shows inactive for an active plan", "Eligibility check taking several minutes"], openers: ["Eligibility checks are coming back as unknown for about {n} patients a day.", "A patient with an active plan shows as inactive in the eligibility check.", "Each eligibility check now takes several minutes to return."], details: ["We verified directly with the payer.", "This started on {when}.", "The front desk is checking manually in the meantime.", "It is one payer in particular."] },
      { tag: "billing-codes", queue: "Billing", priority: ["normal", "low"], subjects: ["New procedure codes not in the picker", "Claim export has the wrong rendering provider", "Superbill PDF cuts off the last line"], openers: ["The procedure codes added this year are not in the code picker.", "The claim export puts the clinic owner as rendering provider on every claim.", "The superbill PDF cuts off the last line item on the page."], details: ["We added them under settings and they still do not show.", "Our biller rejected the whole batch.", "It only happens with more than eight line items.", "We need this before the end of month billing run."] },
      { tag: "exports", queue: "Integrations", priority: ["low", "normal"], subjects: ["Need a full patient export for our new EHR", "Appointment export missing the provider column", "Scheduled report email stopped arriving"], openers: ["We are moving to a new records system and need a full export of patients and appointments.", "The appointment export no longer includes the provider column.", "The weekly scheduled report email stopped arriving on {when}."], details: ["CSV is fine; we need all history.", "The column was there last month.", "Nothing changed on our side.", "Our office manager depends on it every Monday."] },
      { tag: "staff-access", queue: "Scheduling", priority: ["normal", "high"], subjects: ["New front desk hire sees every location", "Need to restrict a provider to their own schedule", "Locked out after too many attempts"], openers: ["A new front desk hire can see and edit every location's schedule.", "We need a provider to see only their own schedule and nothing else.", "Our office manager is locked out after too many sign-in attempts."], details: ["She should only see the north clinic.", "The role options are only admin and staff.", "The lockout email never arrived.", "This is needed for compliance."] },
    ],
  },
];

const CARRIERS = ["Pacific Northwest Line", "Cascade Express", "Interstate Motor Freight", "Olympic Carriers"];
const PERIODS = ["March 2026", "the second half of April", "May 2026", "the first week of June", "July 2026", "August 2026"];
const WHENS = ["Monday", "last Tuesday", "the 14th", "yesterday", "last week", "the weekend", "the 3rd", "Friday afternoon"];

function fill(template: string, people: string[]): string {
  return template
    .replaceAll("{ref}", () => `NG-${between(100000, 999999)}`)
    .replaceAll("{inv}", () => `INV-${between(20000, 29999)}`)
    .replaceAll("{seg}", () => pick(["N1", "B10", "LX", "AT7", "MS1"]))
    .replaceAll("{carrier}", () => pick(CARRIERS))
    .replaceAll("{period}", () => pick(PERIODS))
    .replaceAll("{when}", () => pick(WHENS))
    .replaceAll("{name}", () => pick(people))
    .replaceAll("{n}", () => String(between(2, 40)))
    .replaceAll("{m}", () => String(between(2, 30)));
}

const AGENT_REPLIES = [
  "Thanks for the details. I've reproduced this on our side and passed it to the team. I'll update you here.",
  "Sorry about this. Can you send me the exact time it last worked and one example id so I can trace it?",
  "I checked the logs and I can see the failure. A fix is going out with tonight's release; I'll confirm once it's deployed.",
  "This looks like a configuration issue on the account. I've corrected it; can you try again and let me know?",
  "I've escalated this to engineering as high priority. In the meantime the workaround is to use the export from the reports page.",
  "Confirmed, that is a defect. We've logged it and I'll keep this ticket open until it's resolved.",
];
const CUSTOMER_FOLLOWUPS = [
  "Any update on this?",
  "Sent the example over. Thanks.",
  "Still happening this morning.",
  "That worked, thank you.",
  "Tried again, same result.",
  "We can live with the workaround for now.",
];
const RESOLUTIONS = [
  "This is resolved now. The fix went out this morning; let me know if you see it again and I'll reopen.",
  "Fixed on our side and verified with your account. Closing this one, reply here if anything else comes up.",
  "The setting is corrected and I've confirmed the data is right. Thanks for your patience.",
  "Resolved. The root cause was a release regression; we've added a check so it doesn't recur.",
];

export function generateDataset(ticketCount = 2000): Dataset {
  counter = 0;
  const start = new Date("2025-04-01T08:00:00Z");
  const end = new Date("2026-09-28T18:00:00Z");
  const orgs: Org[] = [];
  const users: User[] = [];
  const tickets: Ticket[] = [];
  const events: ActivityEvent[] = [];
  const usedEmails = new Set<string>();

  const email = (first: string, last: string, domain: string): string => {
    let candidate = `${first}.${last}@${domain}`.toLowerCase();
    let suffix = 1;
    while (usedEmails.has(candidate)) {
      suffix += 1;
      candidate = `${first}.${last}${suffix}@${domain}`.toLowerCase();
    }
    usedEmails.add(candidate);
    return candidate;
  };

  for (const profile of PROFILES) {
    const org: Org = {
      id: id("org"), name: profile.name, slug: profile.slug, plan: pick(["team", "business", "team"]),
      createdAt: iso(new Date("2024-11-12T10:00:00Z")), product: profile.product,
      queues: [], tags: [],
    };
    for (const queueName of profile.queues) {
      org.queues.push({ id: id("que"), orgId: org.id, name: queueName, slug: queueName.toLowerCase().replace(/\s+/g, "-") });
    }
    for (const topic of profile.topics) org.tags.push({ id: id("tag"), orgId: org.id, name: topic.tag });
    orgs.push(org);

    const domain = `${profile.slug}.example.com`;
    const staffCount = between(7, 9);
    for (let index = 0; index < staffCount; index += 1) {
      const first = pick(FIRST);
      const last = pick(LAST);
      users.push({
        id: id("usr"), orgId: org.id, email: email(first, last, domain), name: `${first} ${last}`,
        role: index < 2 ? "admin" : "agent", createdAt: iso(addHours(start, -between(200, 2000))),
        lastLoginAt: iso(addHours(end, -between(1, 200))),
      });
    }
    const customerCount = between(140, 170);
    for (let index = 0; index < customerCount; index += 1) {
      const first = pick(FIRST);
      const last = pick(LAST);
      const company = pick(COMPANIES);
      const companyDomain = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`;
      users.push({
        id: id("usr"), orgId: org.id, email: email(first, last, companyDomain), name: `${first} ${last}`,
        role: "customer", company, createdAt: iso(addHours(start, between(-2000, 8000))),
        lastLoginAt: chance(0.7) ? iso(addHours(end, -between(1, 4000))) : null,
      });
    }
  }

  const perOrg = [Math.round(ticketCount * 0.36), Math.round(ticketCount * 0.33)];
  perOrg.push(ticketCount - perOrg[0] - perOrg[1]);
  const slaHours: Record<Ticket["priority"], [number, number]> = { urgent: [1, 8], high: [4, 24], normal: [8, 72], low: [24, 168] };

  orgs.forEach((org, orgIndex) => {
    const profile = PROFILES[orgIndex];
    const staff = users.filter((user) => user.orgId === org.id && user.role !== "customer");
    const customers = users.filter((user) => user.orgId === org.id && user.role === "customer");
    const staffNames = staff.map((user) => user.name.split(" ")[0]);
    const spanHours = (end.getTime() - start.getTime()) / 3_600_000;
    const createdTimes = Array.from({ length: perOrg[orgIndex] }, () => addHours(start, random() * spanHours)).sort((a, b) => a.getTime() - b.getTime());

    createdTimes.forEach((createdAt, index) => {
      const topic = pick(profile.topics);
      const queue = org.queues.find((candidate) => candidate.name === topic.queue) ?? org.queues[0];
      const tag = org.tags.find((candidate) => candidate.name === topic.tag);
      const requester = pick(customers);
      const priority = pick(topic.priority);
      const [firstDue, resolveDue] = slaHours[priority];
      // Subject and opening line are written as pairs; the detail sentence varies independently.
      const variant = between(0, topic.subjects.length - 1);
      const subject = fill(topic.subjects[variant], staffNames);
      const body = `${fill(topic.openers[variant % topic.openers.length], staffNames)} ${fill(pick(topic.details), staffNames)} ${pick(CLOSERS)}`;
      const ageHours = (end.getTime() - createdAt.getTime()) / 3_600_000;
      let status: Ticket["status"];
      if (ageHours < 48) status = pick(["open", "open", "pending"]);
      else if (ageHours < 240) status = pick(["open", "pending", "resolved", "resolved", "closed"]);
      else status = pick(["open", "pending", "pending", "resolved", "resolved", "closed", "closed", "closed", "closed", "closed"]);
      const assignee = status === "open" && chance(0.3) ? null : pick(staff);
      const ticket: Ticket = {
        id: id("tk"), orgId: org.id, queueId: queue.id, number: 1000 + index + 1, subject, body, status, priority,
        channel: pick(["email", "email", "portal", "api"]), requesterId: requester.id, assigneeId: assignee?.id ?? null,
        createdAt: iso(createdAt), updatedAt: iso(createdAt),
        firstResponseDueAt: iso(addHours(createdAt, firstDue)), resolutionDueAt: iso(addHours(createdAt, resolveDue)),
        firstRespondedAt: null, resolvedAt: null, csatScore: null, tagIds: tag ? [tag.id] : [], messages: [],
      };
      ticket.messages.push({ id: id("msg"), ticketId: ticket.id, authorId: requester.id, authorType: "customer", body, createdAt: ticket.createdAt });
      let cursor = createdAt;
      if (assignee && (status !== "open" || chance(0.6))) {
        cursor = addHours(cursor, random() * firstDue * (chance(0.8) ? 0.9 : 1.6));
        ticket.firstRespondedAt = iso(cursor);
        ticket.messages.push({ id: id("msg"), ticketId: ticket.id, authorId: assignee.id, authorType: "agent", body: pick(AGENT_REPLIES), createdAt: iso(cursor) });
        const exchanges = between(0, 2);
        for (let turn = 0; turn < exchanges; turn += 1) {
          cursor = addHours(cursor, between(1, 30));
          ticket.messages.push({ id: id("msg"), ticketId: ticket.id, authorId: requester.id, authorType: "customer", body: pick(CUSTOMER_FOLLOWUPS), createdAt: iso(cursor) });
          cursor = addHours(cursor, between(1, 20));
          ticket.messages.push({ id: id("msg"), ticketId: ticket.id, authorId: assignee.id, authorType: "agent", body: pick(AGENT_REPLIES), createdAt: iso(cursor) });
        }
      }
      if (assignee && (status === "resolved" || status === "closed")) {
        cursor = addHours(cursor, random() * resolveDue * (chance(0.75) ? 0.8 : 1.5));
        ticket.resolvedAt = iso(cursor);
        ticket.messages.push({ id: id("msg"), ticketId: ticket.id, authorId: assignee.id, authorType: "agent", body: pick(RESOLUTIONS), createdAt: iso(cursor) });
        ticket.messages.push({ id: id("msg"), ticketId: ticket.id, authorId: null, authorType: "system", body: `Status changed to ${status} by ${assignee.name}.`, createdAt: iso(cursor) });
        if (chance(0.55)) ticket.csatScore = pick([5, 5, 4, 4, 5, 3, 2, 1]);
      }
      ticket.updatedAt = ticket.messages[ticket.messages.length - 1].createdAt;
      tickets.push(ticket);
    });

    // Sensitive actions: sign-ins, role changes, API keys, exports. Written, never read.
    for (let index = 0; index < 160; index += 1) {
      const actor = pick(staff);
      const action = pick(["user.signed_in", "user.signed_in", "user.signed_in", "user.role_changed", "api_key.created", "tickets.exported", "user.invited", "user.removed"]);
      events.push({
        id: id("evt"), orgId: org.id, actorId: actor.id, action,
        targetType: action.startsWith("user") ? "user" : action.startsWith("api_key") ? "api_key" : "export",
        targetId: action.startsWith("user") ? pick(staff).id : id("tgt"),
        ip: `${between(10, 220)}.${between(0, 255)}.${between(0, 255)}.${between(1, 254)}`,
        metadata: action === "user.role_changed" ? { from: "agent", to: "admin" } : action === "tickets.exported" ? { rows: between(200, 4000), format: "csv" } : {},
        createdAt: iso(addHours(start, random() * spanHours)),
      });
    }
  });

  tickets.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  events.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return { orgs, users, tickets, events };
}

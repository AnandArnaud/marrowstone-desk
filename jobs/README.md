# Jobs

Scripts that run on a schedule on the app host, against the same database as the app.

- `summarize.ts` — nightly at 02:00. Summarizes every newly resolved ticket into `ticket_summaries`
  (summary, root cause, category, sentiment). Needs `OPENAI_API_KEY`. `--dry-run` prints instead
  of writing; `--limit N` caps the batch.

Run one by hand with `node jobs/<name>.ts`.

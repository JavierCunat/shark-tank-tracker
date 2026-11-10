"use server";

import { query } from "@/lib/db";

export type SubmitState = { ok: boolean; message: string } | null;

const STATUSES = ["active", "acquired", "closed", "deal_closed", "deal_fell_through"];

export async function submitContribution(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  // Honeypot: real people never fill this hidden field.
  if (String(form.get("website") ?? "").trim()) return { ok: true, message: "Thanks! We'll review it soon." };

  const slug = String(form.get("slug") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  const summary = String(form.get("summary") ?? "").trim();
  const source = String(form.get("source") ?? "").trim();
  const date = String(form.get("date") ?? "").trim();
  const contact = String(form.get("contact") ?? "").trim();

  if (!slug) return { ok: false, message: "Pick a company." };
  if (!STATUSES.includes(status)) return { ok: false, message: "Pick a status." };
  if (summary.length < 20) return { ok: false, message: "Tell us a bit more (at least a sentence)." };
  if (summary.length > 1000) return { ok: false, message: "Keep it under 1000 characters." };
  if (!/^https?:\/\/\S+\.\S+/.test(source)) return { ok: false, message: "A source link is required (news article, company site, social post)." };
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Date should look like 2024-05-01." };

  const company = await query<{ id: string }>("select id from companies where slug = $1", [slug]);
  if (!company.length) return { ok: false, message: "Unknown company." };

  await query(
    `insert into update_candidates
       (company_id, article_url, article_title, article_date, proposed_status, proposed_summary,
        confidence, relevance_reason, origin, submitter_contact, model)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'community',$9,'community')
     on conflict (company_id, article_url) do nothing`,
    [company[0].id, source, new URL(source).hostname.replace(/^www\./, ""), date || null, status, summary, null, "Submitted by a visitor", contact || null],
  );

  return { ok: true, message: "Thanks! A human will check the source and publish it if it holds up." };
}

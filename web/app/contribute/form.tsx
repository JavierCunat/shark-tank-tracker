"use client";

import { useActionState } from "react";
import { submitContribution, type SubmitState } from "./actions";

type Option = { slug: string; name: string; season: number };

export function ContributeForm({ companies, initialSlug }: { companies: Option[]; initialSlug?: string }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitContribution, null);

  if (state?.ok) {
    return <p className="notice ok">{state.message}</p>;
  }

  return (
    <form action={action} className="form">
      <label>
        Company
        <select name="slug" defaultValue={initialSlug ?? ""} required>
          <option value="" disabled>Choose a company…</option>
          {companies.map((c) => (
            <option key={c.slug} value={c.slug}>S{c.season} · {c.name}</option>
          ))}
        </select>
      </label>

      <label>
        What&apos;s their status now?
        <select name="status" defaultValue="" required>
          <option value="" disabled>Choose…</option>
          <option value="active">Still in business</option>
          <option value="acquired">Acquired</option>
          <option value="closed">Out of business</option>
          <option value="deal_closed">The on-air deal closed</option>
          <option value="deal_fell_through">The on-air deal fell through</option>
        </select>
      </label>

      <label>
        What do you know?
        <textarea name="summary" rows={4} required minLength={20} maxLength={1000}
          placeholder="e.g. They're still selling on Amazon and their site was updated this year; the founder said in a 2024 podcast that the deal never closed." />
      </label>

      <label>
        Source link <span className="muted">(required — an article, the company site, a social post)</span>
        <input name="source" type="url" required placeholder="https://" />
      </label>

      <div className="row">
        <label>
          When was this true? <span className="muted">(optional)</span>
          <input name="date" type="date" />
        </label>
        <label>
          Your email <span className="muted">(optional, never shown)</span>
          <input name="contact" type="email" placeholder="so we can ask a follow-up" />
        </label>
      </div>

      {/* honeypot, hidden from people */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />

      {state && !state.ok && <p className="notice bad">{state.message}</p>}
      <button type="submit" disabled={pending}>{pending ? "Sending…" : "Submit for review"}</button>
    </form>
  );
}

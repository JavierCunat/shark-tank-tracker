import Link from "next/link";
import { type CompanyCard, STATUS_LABEL, longDate } from "@/lib/companies";

export function CompanyGrid({ companies }: { companies: CompanyCard[] }) {
  return (
    <div className="grid">
      {companies.map((c) => (
        <Link href={`/company/${c.slug}`} className="card" key={c.id}>
          <span className={`badge ${c.current_status}`}>{STATUS_LABEL[c.current_status]}</span>
          <span className="name">{c.name}</span>
          <span className="meta">
            Season {c.season}, Episode {c.episode_in_season} · {longDate(c.air_date)}
          </span>
          <span className="meta">{c.description}</span>
          {c.latest_update_summary && <span className="meta">Latest: {c.latest_update_summary}</span>}
        </Link>
      ))}
    </div>
  );
}

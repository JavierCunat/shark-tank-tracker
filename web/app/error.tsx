"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <h1>Something went wrong</h1>
      <p className="muted">
        The database didn&apos;t answer. This usually means DATABASE_URL is missing or wrong in the deployment settings.
      </p>
      <p className="muted" style={{ fontFamily: "monospace", fontSize: 13 }}>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </>
  );
}

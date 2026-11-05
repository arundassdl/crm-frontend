import Link from "next/link";
export default function Unavailable() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Feature temporarily unavailable</h1>
      <p>
        This feature is awaiting a verified organization backend integration.
        Your CRM records have not changed.
      </p>
      <Link href="/">Return to CRM</Link>
    </main>
  );
}

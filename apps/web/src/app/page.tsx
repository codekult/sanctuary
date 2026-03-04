"use client";

import { trpc } from "@/lib/trpc/client";

export default function HomePage() {
  const { data: property, isLoading, error } = trpc.property.get.useQuery();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Sanctuary</h1>
      <p>Biodiversity tracking platform</p>
      <hr />
      <h2>API Health Check</h2>
      {isLoading && <p>Connecting to API...</p>}
      {error && <p style={{ color: "red" }}>API Error: {error.message}</p>}
      {!isLoading && !error && (
        <p style={{ color: "green" }}>
          API connected. Property: {property?.name ?? "No property configured yet."}
        </p>
      )}
    </main>
  );
}

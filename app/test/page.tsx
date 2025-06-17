// app/test/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState("8146d50f-c7ff-44c2-9669-13d36756f126");

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events?id=${eventId}`);
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Event ID:</label>
        <input 
          type="text" 
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <Button onClick={fetchEvent} disabled={loading}>
          {loading ? "Loading..." : "Fetch Event"}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

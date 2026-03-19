import { useEffect, useState } from "react";

interface HelloResponse {
  // Shape returned by backend GET /api/hello.
  message: string;
}

export default function HelloWorld() {
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Fetch hello message once when the component mounts.
    const fetchHello = async () => {
      try {
        // Vite proxy forwards /api requests to backend (localhost:8080).
        const response = await fetch("/api/hello");

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: HelloResponse = await response.json();
        setMessage(data.message);
      } catch (err) {
        // Normalize unknown errors to a user-facing string.
        const errorMessage =
          err instanceof Error ? err.message : "Unexpected error";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHello();
  }, []);

  return (
    <section className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Backend Connection</h2>

      {isLoading ? (
        // State while waiting for backend response.
        <p className="mt-3 text-gray-600">Loading message...</p>
      ) : error ? (
        // State when request fails.
        <p className="mt-3 text-red-600">Error: {error}</p>
      ) : (
        // State when request succeeds.
        <p className="mt-3 text-green-700">{message}</p>
      )}
    </section>
  );
}

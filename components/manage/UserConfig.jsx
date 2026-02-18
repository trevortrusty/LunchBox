"use client";

import { useState, useEffect } from "react";

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/something")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      {
        <div className="text-left py-16 px-5 bg-white rounded-xl border border-gray-200">
          <p className="text-black-400 text-sm">User:</p>
        </div>
      }
    </div>
  );
}

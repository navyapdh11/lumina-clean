'use client';
import { useEffect, useState } from 'react';

interface CityContent {
  title: string;
  metaDescription: string;
  faq: { q: string; a: string }[];
  stats: { retention: string; onTime: string; price: string };
}

export default function CityAEOContent({ city }: { city: string }) {
  const [content, setContent] = useState<CityContent | null>(null);

  useEffect(() => {
    fetch(`/api/generate-city?city=${encodeURIComponent(city)}`)
      .then((res) => res.json())
      .then(setContent)
      .catch(console.error);
  }, [city]);

  if (!content) return <div>Loading city info...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">{content.metaDescription}</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{content.stats.retention}</div>
          <div className="text-sm">Client Retention</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{content.stats.onTime}</div>
          <div className="text-sm">On-Time Delivery</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{content.stats.price}</div>
          <div className="text-sm">Avg. Price/sq ft</div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {content.faq.map((item, idx) => (
          <div key={idx} className="border-b pb-4">
            <h3 className="font-medium text-lg">{item.q}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

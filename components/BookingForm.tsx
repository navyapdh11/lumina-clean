'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function BookingForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    squareFeet: 1000,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in first');
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      date: formData.date,
      square_feet: formData.squareFeet,
      notes: formData.notes,
      status: 'pending',
    });

    if (error) {
      alert('Error creating booking: ' + error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block mb-1">Date</label>
        <input
          type="date"
          required
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div>
        <label className="block mb-1">Square Feet</label>
        <input
          type="number"
          min="100"
          required
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          value={formData.squareFeet}
          onChange={(e) => setFormData({ ...formData, squareFeet: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <label className="block mb-1">Notes</label>
        <textarea
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Request Quote'}
      </button>
    </form>
  );
}

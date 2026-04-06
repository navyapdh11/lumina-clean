'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const STEPS = ['Service Details', 'Location', 'Schedule', 'Review & Pay'];

const SPECIAL_REQUESTS = [
  { id: 'oven', label: 'Oven Cleaning' },
  { id: 'windows', label: 'Window Interiors' },
  { id: 'fridge', label: 'Fridge Interior' },
  { id: 'balcony', label: 'Balcony/Deck' },
  { id: 'garage', label: 'Garage Sweep' },
  { id: 'laundry', label: 'Laundry Deep Clean' },
];

interface BookingForm {
  serviceType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareMeters: string;
  postcode: string;
  state: string;
  suburb: string;
  streetAddress: string;
  preferredDate: string;
  frequency: string;
  specialRequests: string[];
  accessInstructions: string;
}

function calculatePrice(data: Partial<BookingForm>): number {
  const baseRate = 55;
  const hours = (data.bedrooms || 2) * 1.2 + (data.bathrooms || 1) * 0.8;
  let subtotal = baseRate * hours;
  const stateRates: Record<string, number> = {
    NSW: 1.0, VIC: 0.97, QLD: 0.94, WA: 1.04,
    SA: 0.90, TAS: 0.87, ACT: 1.07, NT: 1.11,
  };
  subtotal *= stateRates[data.state || 'NSW'] || 1;
  const freqDiscount: Record<string, number> = {
    ONE_TIME: 1, WEEKLY: 0.85, FORTNIGHTLY: 0.90, MONTHLY: 0.95,
  };
  subtotal *= freqDiscount[data.frequency || 'ONE_TIME'];
  subtotal += (data.specialRequests?.length || 0) * 25;
  return Math.round(subtotal * 100) / 100;
}

const initialForm: BookingForm = {
  serviceType: 'RESIDENTIAL',
  propertyType: 'HOUSE',
  bedrooms: 2,
  bathrooms: 1,
  squareMeters: '',
  postcode: '',
  state: 'NSW',
  suburb: '',
  streetAddress: '',
  preferredDate: '',
  frequency: 'ONE_TIME',
  specialRequests: [],
  accessInstructions: '',
};

export default function BookingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const estimatedPrice = calculatePrice(form);

  const update = (field: keyof BookingForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const toggleSpecialRequest = (id: string) => {
    setForm(prev => ({
      ...prev,
      specialRequests: prev.specialRequests.includes(id)
        ? prev.specialRequests.filter(r => r !== id)
        : [...prev.specialRequests, id],
    }));
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (form.serviceType === 'RESIDENTIAL' && form.bedrooms < 0) e.bedrooms = 'Must be 0+';
      if (form.bathrooms < 1) e.bathrooms = 'At least 1 bathroom';
    }
    if (step === 2) {
      if (!/^\d{4}$/.test(form.postcode)) e.postcode = 'Invalid 4-digit postcode';
      if (!form.suburb.trim()) e.suburb = 'Suburb required';
    }
    if (step === 3) {
      if (!form.preferredDate) e.preferredDate = 'Date required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep() && step < 4) setStep(s => s + 1);
  };

  const prevStep = () => { if (step > 1) setStep(s => s - 1); };

  const onSubmit = () => {
    if (!validateStep()) return;
    setSubmitError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            totalPrice: estimatedPrice,
            gstAmount: Math.round(estimatedPrice * 0.1 * 100) / 100,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Booking failed' }));
          throw new Error(err.error || 'Booking failed');
        }
        const booking = await response.json();
        router.push(`/book/${booking.id}/payment`);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  const isResidential = form.serviceType === 'RESIDENTIAL';
  const isCommercial = form.serviceType === 'COMMERCIAL';

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Book Your Clean</h1>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{s}</div>
                {s < 4 && <div className={`w-16 sm:w-20 h-1 mx-1 sm:mx-2 transition ${step > s ? 'bg-blue-600' : 'bg-gray-700'}`} />}
              </div>
            ))}
          </div>
          <p className="text-center mt-3 text-sm text-blue-300">{STEPS[step - 1]}</p>
        </div>

        {submitError && (
          <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">{submitError}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1 */}
            {step === 1 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Service Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Service Type</label>
                      <select value={form.serviceType} onChange={e => update('serviceType', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg">
                        <option value="RESIDENTIAL">Residential</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="STRATA">Strata</option>
                        <option value="END_OF_LEASE">End of Lease</option>
                        <option value="BOND_CLEAN">Bond Clean</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Property Type</label>
                      <select value={form.propertyType} onChange={e => update('propertyType', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg">
                        <option value="HOUSE">House</option>
                        <option value="APARTMENT">Apartment</option>
                        <option value="OFFICE">Office</option>
                        <option value="RETAIL">Retail</option>
                        <option value="WAREHOUSE">Warehouse</option>
                      </select>
                    </div>
                  </div>
                  {isResidential && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Bedrooms</label>
                        <input type="number" min={0} max={10} value={form.bedrooms}
                          onChange={e => update('bedrooms', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Bathrooms</label>
                        <input type="number" min={1} max={8} value={form.bathrooms}
                          onChange={e => update('bathrooms', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                        {errors.bathrooms && <p className="text-sm text-red-400 mt-1">{errors.bathrooms}</p>}
                      </div>
                    </div>
                  )}
                  {isCommercial && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Square Meters</label>
                      <input type="number" min={0} value={form.squareMeters}
                        onChange={e => update('squareMeters', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Special Requests</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPECIAL_REQUESTS.map(req => (
                        <label key={req.id} className="flex items-center gap-2 text-gray-300">
                          <input type="checkbox" checked={form.specialRequests.includes(req.id)}
                            onChange={() => toggleSpecialRequest(req.id)}
                            className="rounded border-gray-600 text-blue-600" />
                          <span className="text-sm">{req.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Location</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Postcode</label>
                      <input value={form.postcode} onChange={e => update('postcode', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="2000" maxLength={4}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                      {errors.postcode && <p className="text-sm text-red-400 mt-1">{errors.postcode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">State</label>
                      <select value={form.state} onChange={e => update('state', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg">
                        {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Suburb</label>
                    <input value={form.suburb} onChange={e => update('suburb', e.target.value)}
                      placeholder="Sydney" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                    {errors.suburb && <p className="text-sm text-red-400 mt-1">{errors.suburb}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Street Address (Optional)</label>
                    <input value={form.streetAddress} onChange={e => update('streetAddress', e.target.value)}
                      placeholder="123 George St" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Schedule</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Preferred Date & Time</label>
                    <input type="datetime-local" value={form.preferredDate}
                      onChange={e => update('preferredDate', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                    {errors.preferredDate && <p className="text-sm text-red-400 mt-1">{errors.preferredDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Frequency</label>
                    <select value={form.frequency} onChange={e => update('frequency', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg">
                      <option value="ONE_TIME">One Time</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="FORTNIGHTLY">Fortnightly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Access Instructions (Optional)</label>
                    <textarea value={form.accessInstructions} onChange={e => update('accessInstructions', e.target.value)}
                      rows={3} placeholder="Gate code, key location, etc."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Review & Confirm</h2>
                <div className="bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2 text-gray-300">
                    <span className="text-gray-400">Service:</span><span>{form.serviceType}</span>
                    <span className="text-gray-400">Property:</span>
                    <span>{isResidential ? `${form.bedrooms} BR, ${form.bathrooms} BA` : form.propertyType}</span>
                    <span className="text-gray-400">Location:</span><span>{form.suburb} {form.postcode} {form.state}</span>
                    <span className="text-gray-400">Scheduled:</span>
                    <span>{form.preferredDate ? new Date(form.preferredDate).toLocaleString() : 'Not set'}</span>
                    <span className="text-gray-400">Frequency:</span><span>{form.frequency}</span>
                    {form.specialRequests.length > 0 && (<>
                      <span className="text-gray-400">Extras:</span><span>{form.specialRequests.join(', ')}</span>
                    </>)}
                  </div>
                </div>
              </div>
            )}

            {/* Nav */}
            <div className="flex justify-between">
              <button type="button" onClick={prevStep} disabled={step === 1}
                className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition">
                ← Back
              </button>
              {step < 4 ? (
                <button type="button" onClick={nextStep}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={onSubmit} disabled={isPending}
                  className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition">
                  {isPending ? 'Booking...' : `Confirm — $${estimatedPrice.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 sticky top-4">
              <h3 className="text-lg font-semibold text-white mb-4">Price Estimate</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-300"><span>Base Rate</span><span>$55.00/hr</span></div>
                <div className="flex justify-between text-gray-300"><span>Est. Hours</span><span>{((form.bedrooms || 2) * 1.2 + (form.bathrooms || 1) * 0.8).toFixed(1)}h</span></div>
                <div className="flex justify-between text-gray-300"><span>Region</span><span>{form.state}</span></div>
                {form.specialRequests.length > 0 && (
                  <div className="flex justify-between text-gray-300"><span>Extras ({form.specialRequests.length})</span><span>+${form.specialRequests.length * 25}</span></div>
                )}
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total (inc. GST)</span><span>${estimatedPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Final price may vary based on actual property condition.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

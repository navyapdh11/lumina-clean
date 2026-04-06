'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Inline schema (replaces external package import)
const bookingSchema = z.object({
  serviceType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'STRATA', 'END_OF_LEASE', 'BOND_CLEAN']),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'OFFICE', 'RETAIL', 'WAREHOUSE']),
  bedrooms: z.number().min(0).max(10).optional(),
  bathrooms: z.number().min(1).max(8),
  squareMeters: z.number().min(0).optional(),
  postcode: z.string().regex(/^\d{4}$/, 'Invalid Australian postcode (4 digits)'),
  state: z.enum(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']),
  suburb: z.string().min(1, 'Suburb is required'),
  streetAddress: z.string().optional(),
  preferredDate: z.string().min(1, 'Date is required'),
  frequency: z.enum(['ONE_TIME', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY']),
  specialRequests: z.array(z.string()).max(10),
  accessInstructions: z.string().max(500).optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

const SPECIAL_REQUESTS = [
  { id: 'oven', label: 'Oven Cleaning' },
  { id: 'windows', label: 'Window Interiors' },
  { id: 'fridge', label: 'Fridge Interior' },
  { id: 'balcony', label: 'Balcony/Deck' },
  { id: 'garage', label: 'Garage Sweep' },
  { id: 'laundry', label: 'Laundry Deep Clean' },
];

const STEPS = ['Service Details', 'Location', 'Schedule', 'Review & Pay'];

// Simple price calculator (replaces external API call)
function calculatePrice(data: Partial<BookingForm>): number {
  const baseRate = 55;
  const hours = (data.bedrooms || 2) * 1.2 + (data.bathrooms || 1) * 0.8;
  let subtotal = baseRate * hours;

  // State-based pricing
  const stateRates: Record<string, number> = {
    NSW: 1.0, VIC: 0.97, QLD: 0.94, WA: 1.04,
    SA: 0.90, TAS: 0.87, ACT: 1.07, NT: 1.11,
  };
  subtotal *= stateRates[data.state || 'NSW'] || 1;

  // Frequency discount
  const freqDiscount: Record<string, number> = {
    ONE_TIME: 1, WEEKLY: 0.85, FORTNIGHTLY: 0.90, MONTHLY: 0.95,
  };
  subtotal *= freqDiscount[data.frequency || 'ONE_TIME'];

  // Special requests
  subtotal += (data.specialRequests?.length || 0) * 25;

  return Math.round(subtotal * 100) / 100;
}

export default function BookingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<BookingForm>({
    defaultValues: {
      serviceType: 'RESIDENTIAL',
      propertyType: 'HOUSE',
      bathrooms: 1,
      frequency: 'ONE_TIME',
      specialRequests: [],
    },
  });

  const watchedValues = watch();
  const estimatedPrice = calculatePrice(watchedValues);

  const nextStep = async () => {
    // Validate current step fields before proceeding
    const fieldsToValidate: Record<number, (keyof BookingForm)[]> = {
      1: ['serviceType', 'propertyType', 'bathrooms'],
      2: ['postcode', 'state', 'suburb'],
      3: ['preferredDate', 'frequency'],
    };

    const fields = fieldsToValidate[step];
    if (fields) {
      const isValid = await trigger(fields);
      if (!isValid) return;
    }

    if (step < 4) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const onSubmit = async (data: BookingForm) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
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
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  const handleSpecialRequestToggle = (requestId: string, checked: boolean) => {
    const current = watch('specialRequests') || [];
    const updated = checked
      ? [...current, requestId]
      : current.filter((r: string) => r !== requestId);
    setValue('specialRequests', updated);
  };

  const serviceType = watch('serviceType');
  const isResidential = serviceType === 'RESIDENTIAL';
  const isCommercial = serviceType === 'COMMERCIAL';

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white text-center mb-8">Book Your Clean</h1>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-16 sm:w-20 h-1 mx-1 sm:mx-2 transition ${step > s ? 'bg-blue-600' : 'bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center mt-3 text-sm text-blue-300">{STEPS[step - 1]}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Service Details */}
              {step === 1 && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Service Details</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Service Type</label>
                        <select
                          {...register('serviceType')}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                        >
                          <option value="RESIDENTIAL">Residential</option>
                          <option value="COMMERCIAL">Commercial</option>
                          <option value="STRATA">Strata</option>
                          <option value="END_OF_LEASE">End of Lease</option>
                          <option value="BOND_CLEAN">Bond Clean</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Property Type</label>
                        <select
                          {...register('propertyType')}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                        >
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
                          <input type="number" min={0} max={10} defaultValue={2}
                            {...register('bedrooms', { valueAsNumber: true })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Bathrooms</label>
                          <input type="number" min={1} max={8} defaultValue={1}
                            {...register('bathrooms', { valueAsNumber: true })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {isCommercial && (
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Square Meters</label>
                        <input type="number" min={0}
                          {...register('squareMeters', { valueAsNumber: true })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Special Requests</label>
                      <div className="grid grid-cols-2 gap-2">
                        {SPECIAL_REQUESTS.map((req) => (
                          <label key={req.id} className="flex items-center gap-2 text-gray-300">
                            <input type="checkbox"
                              checked={(watch('specialRequests') || []).includes(req.id)}
                              onChange={(e) => handleSpecialRequestToggle(req.id, e.target.checked)}
                              className="rounded border-gray-600 text-blue-600"
                            />
                            <span className="text-sm">{req.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Location</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Postcode</label>
                        <input {...register('postcode')} placeholder="2000" maxLength={4}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                        />
                        {errors.postcode && (
                          <p className="text-sm text-red-400 mt-1">{errors.postcode.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">State</label>
                        <select {...register('state')}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                        >
                          {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Suburb</label>
                      <input {...register('suburb')} placeholder="Sydney"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Street Address (Optional)</label>
                      <input {...register('streetAddress')} placeholder="123 George St"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Schedule */}
              {step === 3 && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Schedule</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Preferred Date & Time</label>
                      <input type="datetime-local" {...register('preferredDate')}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Frequency</label>
                      <select {...register('frequency')}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      >
                        <option value="ONE_TIME">One Time</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="FORTNIGHTLY">Fortnightly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Access Instructions (Optional)</label>
                      <textarea {...register('accessInstructions')} rows={3}
                        placeholder="Gate code, key location, etc."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
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
                      <span className="text-gray-400">Service:</span>
                      <span>{watch('serviceType')}</span>
                      <span className="text-gray-400">Property:</span>
                      <span>{isResidential ? `${watch('bedrooms')} BR, ${watch('bathrooms')} BA` : watch('propertyType')}</span>
                      <span className="text-gray-400">Location:</span>
                      <span>{watch('suburb')} {watch('postcode')} {watch('state')}</span>
                      <span className="text-gray-400">Scheduled:</span>
                      <span>{watch('preferredDate') ? new Date(watch('preferredDate')).toLocaleString() : 'Not set'}</span>
                      <span className="text-gray-400">Frequency:</span>
                      <span>{watch('frequency')}</span>
                      {watch('specialRequests')?.length > 0 && (
                        <>
                          <span className="text-gray-400">Extras:</span>
                          <span>{watch('specialRequests').join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                >
                  ← Back
                </button>
                {step < 4 ? (
                  <button type="button" onClick={nextStep}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Next →
                  </button>
                ) : (
                  <button type="submit" disabled={isPending}
                    className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {isPending ? 'Booking...' : `Confirm — $${estimatedPrice}`}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar: Price Breakdown */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 sticky top-4">
                <h3 className="text-lg font-semibold text-white mb-4">Price Estimate</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Base Rate</span>
                    <span>$55.00/hr</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Est. Hours</span>
                    <span>{((watch('bedrooms') || 2) * 1.2 + (watch('bathrooms') || 1) * 0.8).toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Region</span>
                    <span>{watch('state') || 'NSW'}</span>
                  </div>
                  {watch('specialRequests')?.length > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>Extras ({watch('specialRequests').length})</span>
                      <span>+${watch('specialRequests').length * 25}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>Total (inc. GST)</span>
                      <span>${estimatedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Final price may vary based on actual property condition.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

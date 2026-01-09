'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI } from '@/lib/api';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react';

const createEventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Chemical',
  'Electrical',
  'Other'
];

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      department: user?.department || ''
    }
  });

  // Redirect if not organizer
  React.useEffect(() => {
    if (user && user.role !== UserRole.ORGANIZER && user.role !== UserRole.ADMIN) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const onSubmit = async (data: CreateEventFormData) => {
    setLoading(true);
    setError('');

    try {
      // Combine date and time
      const eventDateTime = new Date(`${data.date}T${data.time}`);

      const eventData = {
        name: data.name,
        description: data.description,
        department: data.department,
        date: eventDateTime.toISOString(),
      };

      await eventsAPI.createEvent(eventData);

      // Redirect to events page
      router.push('/events');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== UserRole.ORGANIZER && user.role !== UserRole.ADMIN)) {
    return null;
  }

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Get minimum time (current time if today is selected)

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600">
            Organize a new event and generate QR codes for attendance tracking
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                {...register('name')}
                label="Event Name"
                placeholder="Annual Tech Symposium 2025"
                error={errors.name?.message}
                className="text-base"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide details about your event, agenda, speakers, etc."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Department
                </label>
                <select
                  {...register('department')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Event Date
                  </label>
                  <input
                    {...register('date')}
                    type="date"
                    min={minDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Event Time
                  </label>
                  <input
                    {...register('time')}
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.time && (
                    <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="min-w-[120px]"
                >
                  Create Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  What happens after creation?
                </h3>
                <div className="mt-2 text-sm text-blue-800">
                  <ul className="list-disc list-inside space-y-1">
                    <li>A unique QR code will be generated for your event</li>
                    <li>Students can scan the QR code to check in</li>
                    <li>You can view real-time attendance data</li>
                    <li>Faculty can monitor student participation</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
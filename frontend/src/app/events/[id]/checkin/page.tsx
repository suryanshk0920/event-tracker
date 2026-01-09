'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI } from '@/lib/api';
import { Event, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { QRScanner } from '@/components/QRScanner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

export default function CheckinPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkinError, setCheckinError] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    if (user && user.role !== UserRole.STUDENT) {
      router.push('/events');
      return;
    }

    if (id) {
      loadEvent();
    }
  }, [id, user, router]);

  const loadEvent = async () => {
    try {
      const eventId = parseInt(id as string);
      const response = await eventsAPI.getEvent(eventId);
      setEvent(response.event);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    if (!event || checkinLoading) return;

    setCheckinLoading(true);
    setCheckinError('');

    try {
      await eventsAPI.checkinToEvent(event.id, { qr_data: qrData });
      setCheckedIn(true);

      // Show success message and redirect after delay
      setTimeout(() => {
        router.push('/events');
      }, 3000);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setCheckinError(error.response?.data?.error || 'Failed to check in');
    } finally {
      setCheckinLoading(false);
    }
  };

  if (!user || user.role !== UserRole.STUDENT) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <p className="font-medium">Error Loading Event</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <div className="space-x-3">
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Button onClick={loadEvent}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Event not found</p>
          <Button className="mt-4" onClick={() => router.push('/events')}>
            Back to Events
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const eventDate = new Date(event.date);
  const now = new Date();
  const isPast = eventDate < now;

  if (checkedIn) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Successfully Checked In!
              </h3>
              <p className="text-green-800 mb-4">
                You have been marked present for "{event.name}"
              </p>
              <p className="text-sm text-green-700 mb-6">
                Redirecting to events page in 3 seconds...
              </p>
              <Button
                onClick={() => router.push('/events')}
                className="bg-green-600 hover:bg-green-700"
              >
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Check In</h1>
            <p className="text-gray-600">Scan the QR code to mark your attendance</p>
          </div>
        </div>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              {event.name}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <p className="text-gray-600">{event.description}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                {eventDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-green-500" />
                {eventDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              <div className="flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-2 text-red-500" />
                {event.department}
              </div>

              <div className="flex items-center text-gray-700">
                <User className="w-4 h-4 mr-2 text-purple-500" />
                {event.organizer_name}
              </div>
            </div>

            {isPast && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This event has already passed, but you can still check in
                  if the organizer allows late attendance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Scanner */}
        <Card>
          <CardContent className="p-6">
            <QRScanner
              onScan={handleQRScan}
              isLoading={checkinLoading}
              error={checkinError}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Ask the event organizer to show the QR code</li>
              <li>2. Point your camera at the QR code or enter it manually</li>
              <li>3. Wait for confirmation of successful check-in</li>
              <li>4. Your attendance will be recorded automatically</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI } from '@/lib/api';
import { Event, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  QrCode,
  CheckCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

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

  const handleShowQR = async () => {
    if (!event) return;

    setQrLoading(true);
    try {
      const response = await eventsAPI.getEventQRCode(event.id);
      setQrCode(response.qr_code);
      setQrModalOpen(true);
    } catch (err) {
      console.error('Failed to load QR code:', err);
    } finally {
      setQrLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !event) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <p className="font-medium">Error Loading Event</p>
                <p className="text-sm mt-1">{error || 'Event not found'}</p>
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

  const eventDate = new Date(event.date);
  const now = new Date();
  const isPast = eventDate < now;
  const isToday = eventDate.toDateString() === now.toDateString();

  const getStatusBadge = () => {
    if (isPast) return <Badge variant="default">Past Event</Badge>;
    if (isToday) return <Badge variant="success">Today</Badge>;
    return <Badge variant="info">Upcoming</Badge>;
  };

  const canViewQR = user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN;
  const canViewAttendees = user.role === UserRole.FACULTY || user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER;
  const canCheckin = user.role === UserRole.STUDENT && !isPast;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
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
            <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
            <p className="text-gray-600">Complete information about this event</p>
          </div>
        </div>

        {/* Main Event Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {event.name}
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <User className="w-4 h-4 mr-1" />
                  Organized by {event.organizer_name}
                  {event.organizer_email && (
                    <span className="ml-2">({event.organizer_email})</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge()}
                {event.attendee_count !== undefined && (
                  <Badge variant="info">
                    <Users className="w-3 h-3 mr-1" />
                    {event.attendee_count} attendees
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            {event.description && (
              <div>
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900">Description</h3>
                </div>
                <p className="text-gray-700 leading-relaxed pl-7">
                  {event.description}
                </p>
              </div>
            )}

            {/* Event Details Grid */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p className="text-gray-600">
                        {eventDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Time</p>
                      <p className="text-gray-600">
                        {eventDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">Department</p>
                      <p className="text-gray-600">{event.department}</p>
                    </div>
                  </div>

                  {event.attendee_count !== undefined && (
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-900">Attendance</p>
                        <p className="text-gray-600">{event.attendee_count} students checked in</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Check-in Status */}
            {user.role === UserRole.STUDENT && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  {event.is_attending ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="font-medium text-green-800">
                        You are checked in to this event
                      </span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="font-medium text-blue-800">
                        You haven't checked in yet
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Event Status Warnings */}
            {isPast && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This event has already concluded.
                  {user.role === UserRole.STUDENT && !event.is_attending &&
                    " You may still be able to check in if the organizer allows late attendance."
                  }
                </p>
              </div>
            )}

            {isToday && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Today's Event:</strong> This event is happening today!
                  {user.role === UserRole.STUDENT && !event.is_attending &&
                    " Don't forget to check in when you arrive."
                  }
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {canCheckin && !event.is_attending && (
                <Link href={`/events/${event.id}/checkin`}>
                  <Button className="flex items-center">
                    <QrCode className="w-4 h-4 mr-2" />
                    Check In Now
                  </Button>
                </Link>
              )}

              {canViewQR && (
                <Button
                  variant="outline"
                  onClick={handleShowQR}
                  loading={qrLoading}
                  className="flex items-center"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Show QR Code
                </Button>
              )}

              {canViewAttendees && (
                <Link href={`/events/${event.id}/attendees`}>
                  <Button variant="outline" className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    View Attendees
                  </Button>
                </Link>
              )}
            </div>

            <div className="text-xs text-gray-500">
              Created {new Date(event.created_at).toLocaleDateString()}
            </div>
          </CardFooter>
        </Card>

        {/* QR Code Modal */}
        <Modal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title="Event QR Code"
          size="lg"
        >
          <div className="text-center space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{event.name}</h4>
              <p className="text-sm text-gray-500">
                Students can scan this QR code to check in
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <img
                  src={qrCode}
                  alt="Event QR Code"
                  className="border rounded-lg shadow-sm max-w-xs"
                />
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>• QR code is cryptographically signed for security</p>
              <p>• Valid for 24 hours from generation</p>
              <p>• Students can also enter the code manually</p>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
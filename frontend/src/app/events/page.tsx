'use client';

import React, { useState, useEffect } from 'react';
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
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  QrCode,
  CheckCircle,
  ExternalLink,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

const EventCard: React.FC<{
  event: Event;
  userRole: UserRole;
  onViewQR?: (event: Event) => void;
  onViewAttendees?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}> = ({ event, userRole, onViewQR, onViewAttendees, onDelete }) => {
  const eventDate = new Date(event.date);
  const now = new Date();
  const isPast = eventDate < now;
  const isToday = eventDate.toDateString() === now.toDateString();

  const getStatusBadge = () => {
    if (isPast) return <Badge variant="default">Past Event</Badge>;
    if (isToday) return <Badge variant="success">Today</Badge>;
    return <Badge variant="info">Upcoming</Badge>;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card variant="elevated" hover className="group animate-fade-in relative">
      {(userRole === UserRole.ADMIN || userRole === UserRole.ORGANIZER) && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
              onDelete(event);
            }
          }}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Delete Event"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <CardHeader gradient className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 truncate">
              {event.name}
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              <div className="flex items-center px-2 py-1 bg-white rounded-lg shadow-sm border border-gray-100">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                <span className="font-medium">{event.organizer_name}</span>
              </div>
            </div>
          </div>
          <div className="ml-4">
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent padding="lg" className="space-y-4">
        {event.description && (
          <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-300">
            <p className="text-gray-700 text-sm leading-relaxed">{event.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg mr-3">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Date</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{formatDate(eventDate)}</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-lg mr-3">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Time</p>
              <p className="text-sm font-semibold text-gray-900">{formatTime(eventDate)}</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-lg mr-3">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Department</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{event.department}</p>
            </div>
          </div>

          {event.attendee_count !== undefined && (
            <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500 rounded-lg mr-3">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Attendees</p>
                <p className="text-sm font-semibold text-gray-900">{event.attendee_count}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter gradient className="bg-gradient-to-r from-gray-50 to-blue-50 space-y-3">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {userRole === UserRole.STUDENT && (
            <>
              {event.is_attending ? (
                <div className="flex items-center space-x-2">
                  <Badge variant="success" size="lg" className="flex items-center shadow-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ✨ Attending
                  </Badge>
                  <div className="h-1 w-8 bg-green-400 rounded-full"></div>
                </div>
              ) : (
                <Link href={`/events/${event.id}/checkin`}>
                  <Button variant="gradient" size="md" className="shadow-lg hover:shadow-xl">
                    <QrCode className="w-4 h-4 mr-2" />
                    🎯 Check In
                  </Button>
                </Link>
              )}
            </>
          )}

          {userRole === UserRole.ORGANIZER && onViewQR && (
            <Button
              size="md"
              variant="outline"
              onClick={() => onViewQR(event)}
              className="flex items-center hover:bg-blue-50 hover:border-blue-300"
            >
              <QrCode className="w-4 h-4 mr-2" />
              📱 QR Code
            </Button>
          )}

          {(userRole === UserRole.FACULTY || userRole === UserRole.ADMIN) && onViewAttendees && (
            <Button
              size="md"
              variant="outline"
              onClick={() => onViewAttendees(event)}
              className="flex items-center hover:bg-purple-50 hover:border-purple-300"
            >
              <Users className="w-4 h-4 mr-2" />
              👥 Attendees
            </Button>
          )}

          <div className="ml-auto">
            <Link href={`/events/${event.id}`}>
              <Button variant="outline" size="md" className="hover:bg-indigo-50 hover:border-indigo-300">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const QRModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}> = ({ isOpen, onClose, event }) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      loadQRCode();
    }
  }, [isOpen, event]);

  const loadQRCode = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const response = await eventsAPI.getEventQRCode(event.id);
      setQrCode(response.qr_code);
    } catch (error) {
      console.error('Failed to load QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📱 Event QR Code" size="lg" variant="gradient">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <LoadingSpinner size="lg" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Generating QR Code...</p>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-gray-100">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{event?.name}</h4>
            <p className="text-gray-600 flex items-center justify-center">
              <span className="mr-2">📱</span>
              Students can scan this QR code to check in instantly
            </p>
          </div>
          {qrCode && (
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-gradient-to-r from-blue-200 to-purple-200">
                <img
                  src={qrCode}
                  alt="Event QR Code"
                  className="w-64 h-64 object-contain rounded-xl"
                />
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500 font-medium">Ready to scan</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-center space-x-3">
            <Button variant="gradient" onClick={onClose} size="lg" className="shadow-lg">
              ✨ Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getEvents();
      setEvents(response.events);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQR = (event: Event) => {
    setSelectedEvent(event);
    setIsQRModalOpen(true);
  };

  const handleViewAttendees = (event: Event) => {
    // Navigate to attendees page
    window.location.href = `/events/${event.id}/attendees`;
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        await eventsAPI.deleteEvent(event.id);
        // Remove from list
        setEvents(events.filter(e => e.id !== event.id));
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error('Delete event error:', err);
      alert(error.response?.data?.error || 'Failed to delete event');
    }
  };

  if (!user) return null;

  const getPageTitle = () => {
    switch (user.role) {
      case UserRole.STUDENT:
        return 'Available Events';
      case UserRole.FACULTY:
        return 'All Events';
      case UserRole.ORGANIZER:
        return 'My Events';
      case UserRole.ADMIN:
        return 'All Events';
      default:
        return 'Events';
    }
  };

  const getPageDescription = () => {
    switch (user.role) {
      case UserRole.STUDENT:
        return 'Browse and check into events';
      case UserRole.FACULTY:
        return 'Monitor events and student participation';
      case UserRole.ORGANIZER:
        return 'Manage your organized events';
      case UserRole.ADMIN:
        return 'Oversee all events in the system';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{getPageTitle()}</h1>
                <p className="text-white/90 text-lg font-medium">{getPageDescription()}</p>
                <div className="h-1 w-20 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full mt-2"></div>
              </div>
            </div>

            {user.role === UserRole.ORGANIZER && (
              <Link href="/create-event">
                <Button variant="ghost" size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm shadow-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  ➕ Create Event
                </Button>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEvents}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-12 border border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Events Found</h3>
              <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                {user.role === UserRole.ORGANIZER
                  ? "🎆 Ready to create your first amazing event? Let's get started!"
                  : "🔍 No events are currently available. Check back soon for exciting opportunities!"
                }
              </p>
              {user.role === UserRole.ORGANIZER && (
                <Link href="/create-event">
                  <Button variant="gradient" size="lg" className="shadow-xl hover:shadow-2xl">
                    <Calendar className="w-5 h-5 mr-2" />
                    ✨ Create Your First Event
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="h-1 w-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                <p className="text-gray-600 font-medium">{events.length} event{events.length !== 1 ? 's' : ''} available</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Live updates</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, index) => (
                <div key={event.id} style={{ animationDelay: `${index * 100}ms` }}>
                  <EventCard
                    event={event}
                    userRole={user.role}
                    onViewQR={handleViewQR}
                    onViewAttendees={handleViewAttendees}
                    onDelete={handleDeleteEvent}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          event={selectedEvent}
        />
      </div>
    </DashboardLayout>
  );
}
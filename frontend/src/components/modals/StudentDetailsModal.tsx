'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usersAPI, eventsAPI } from '@/lib/api';
import { User, Event } from '@/types';
import {
  User as UserIcon,
  Mail,
  School,
  Calendar,
  MapPin,
  Clock,
  Users,
  GraduationCap,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  onClose,
  studentId
}) => {
  const [student, setStudent] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && studentId) {
      loadStudentDetails();
    }
  }, [isOpen, studentId]);

  const loadStudentDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentResponse, eventsResponse] = await Promise.all([
        usersAPI.getUser(studentId),
        eventsAPI.getEvents({ student_id: studentId })
      ]);

      setStudent(studentResponse.user);
      setEvents(eventsResponse.events);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStudent(null);
    setEvents([]);
    setError('');
    onClose();
  };

  if (!student && !loading) {
    return null;
  }

  // Calculate student statistics
  const attendedEvents = events.filter(event => event.is_attending);
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate > new Date() && !event.is_attending;
  });
  const thisMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    return eventDate >= thisMonth && event.is_attending;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Student Details"
      size="xl"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">
            <p className="font-medium">Error Loading Student</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStudentDetails}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      ) : student ? (
        <div className="space-y-6">
          {/* Student Header */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <Badge variant="info">Student</Badge>
                {student.roll_no && (
                  <span className="text-sm text-gray-600">
                    Roll No: {student.roll_no}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Personal Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <School className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Department:</span>
                    <p className="text-gray-900">{student.department}</p>
                  </div>
                </div>

                {student.division && (
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Division:</span>
                      <p className="text-gray-900">{student.division}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Joined:</span>
                    <p className="text-gray-900">
                      {new Date(student.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {student.last_login && (
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Last Login:</span>
                      <p className="text-gray-900">
                        {new Date(student.last_login).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Activity Statistics
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{attendedEvents.length}</div>
                  <div className="text-xs text-green-600">Events Attended</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</div>
                  <div className="text-xs text-blue-600">Upcoming Events</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">{thisMonthEvents.length}</div>
                  <div className="text-xs text-purple-600">This Month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Event Activity</h3>
              <Link href="/events" className="text-blue-600 hover:text-blue-800 text-sm">
                View All Events
              </Link>
            </div>

            {attendedEvents.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No events attended yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {attendedEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.name}</p>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{event.department}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
                {attendedEvents.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    And {attendedEvents.length - 5} more events...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Link href={`/students/${student.id}`}>
              <Button>
                View Full Profile
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
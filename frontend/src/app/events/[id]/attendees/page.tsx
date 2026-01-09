'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI } from '@/lib/api';
import { Event, UserRole, AttendingStudent } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEventSSE } from '@/hooks/useEventSSE';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Zap,
  Radio,
  AlertCircle
} from 'lucide-react';

interface StudentsTableProps {
  students: AttendingStudent[];
  loading: boolean;
}

const StudentsTable: React.FC<StudentsTableProps> = ({ students, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No attendees yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Students will appear here once they check in to the event.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Roll No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Division
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-in Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {student.roll_no || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {student.division || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {student.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(student.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function AttendeesPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [students, setStudents] = useState<AttendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // SSE for real-time updates
  const eventId = id ? parseInt(id as string) : null;
  const { isConnected, newAttendee, error: sseError } = useEventSSE(eventId);

  useEffect(() => {
    if (user && user.role !== UserRole.FACULTY && user.role !== UserRole.ADMIN && user.role !== UserRole.ORGANIZER) {
      router.push('/events');
      return;
    }

    if (id) {
      loadEventAndStudents();
    }
  }, [id, user, router]);

  // Handle new attendee from SSE
  useEffect(() => {
    if (newAttendee && newAttendee.user) {
      setStudents(prev => {
        // Check if student already exists
        const exists = prev.some(s => s.id === newAttendee.user.id);
        if (exists) return prev;

        // Add new student to the beginning of the list
        const newStudent: AttendingStudent = {
          id: newAttendee.user.id,
          name: newAttendee.user.name,
          email: newAttendee.user.email,
          roll_no: newAttendee.user.roll_no || undefined,
          division: newAttendee.user.division || undefined,
          department: newAttendee.user.department || '',
          timestamp: newAttendee.attendance.timestamp
        };

        return [newStudent, ...prev];
      });

      // Show a brief notification (could be enhanced with a toast library)
      console.log('New attendee checked in:', newAttendee.user.name);
    }
  }, [newAttendee]);

  useEffect(() => {
    if (event) {
      loadStudents();
    }
  }, [selectedDivision, selectedDepartment]);

  const loadEventAndStudents = async () => {
    try {
      const eventId = parseInt(id as string);
      const [eventResponse] = await Promise.all([
        eventsAPI.getEvent(eventId)
      ]);

      setEvent(eventResponse.event);
      await loadStudents();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!id) return;

    setStudentsLoading(true);
    try {
      const eventId = parseInt(id as string);
      const params: Record<string, string> = {};

      if (selectedDivision) params.division = selectedDivision;
      if (selectedDepartment) params.department = selectedDepartment;

      const response = await eventsAPI.getEventStudents(eventId, params);
      setStudents(response.students);
      setFromCache(response.from_cache || false);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const exportData = () => {
    if (students.length === 0) return;

    const csvContent = [
      ['Name', 'Email', 'Roll No', 'Division', 'Department', 'Check-in Time'],
      ...students.map(student => [
        student.name,
        student.email,
        student.roll_no || '',
        student.division || '',
        student.department,
        new Date(student.timestamp).toLocaleString()
      ])
    ]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.name || 'event'}_attendance.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.roll_no && student.roll_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get unique divisions and departments
  const divisions = [...new Set(students.map(s => s.division).filter(Boolean))].sort();
  const departments = [...new Set(students.map(s => s.department))].sort();

  if (!user || (user.role !== UserRole.FACULTY && user.role !== UserRole.ADMIN && user.role !== UserRole.ORGANIZER)) {
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
                <Button onClick={loadEventAndStudents}>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-gray-900">Event Attendees</h1>
              <p className="text-gray-600">View and manage student attendance</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Updates Indicator */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Badge variant="success" className="flex items-center">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Live Updates
                </Badge>
              ) : (
                <Badge variant="warning" className="flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {sseError ? 'Reconnecting...' : 'Connecting...'}
                </Badge>
              )}

              {/* Cache Indicator */}
              {fromCache && (
                <Badge variant="info" className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Served from cache
                </Badge>
              )}
            </div>

            {students.length > 0 && (
              <Button onClick={exportData} className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {event.name}
                </h2>
                {event.description && (
                  <p className="text-gray-600 text-sm">{event.description}</p>
                )}
              </div>
              <Badge variant="info">
                <Users className="w-3 h-3 mr-1" />
                {students.length} attendees
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
                <GraduationCap className="w-4 h-4 mr-2 text-purple-500" />
                {event.department}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {divisions.length > 0 && (
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  <option value="">All Divisions</option>
                  {divisions.map(div => (
                    <option key={div} value={div}>Division {div}</option>
                  ))}
                </select>
              )}

              {departments.length > 1 && (
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDivision('');
                  setSelectedDepartment('');
                }}
              >
                <Filter className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            <StudentsTable
              students={filteredStudents}
              loading={studentsLoading}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI, usersAPI } from '@/lib/api';
import { UserRole, Event } from '@/types';
import { Calendar, Users, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-gradient-to-br from-white to-gray-50/50 overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover-lift group">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <dt className="text-sm font-medium text-gray-600 mb-1">{title}</dt>
          <dd className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{value}</dd>
        </div>
        <div className="flex-shrink-0">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
            <Icon className={`h-7 w-7 ${color}`} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="mt-4 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  </div>
);

const WelcomeCard: React.FC<{ user: any; onRefresh: () => void; loading: boolean }> = ({ user, onRefresh, loading }) => (
  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 overflow-hidden shadow-2xl rounded-2xl relative">
    {/* Decorative elements */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 animate-pulse"></div>
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

    <div className="relative px-6 py-8 sm:p-8">
      <div className="flex justify-between items-start">
        <div className="text-white flex-1">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                Welcome back, {user.name}!
              </h3>
              <div className="h-1 w-16 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full mt-2"></div>
            </div>
          </div>
          <p className="text-lg text-white/90 font-medium mb-4">
            {user.role === UserRole.STUDENT && "🎯 Track your event participation and achievements"}
            {user.role === UserRole.FACULTY && "📊 Monitor student participation in events"}
            {user.role === UserRole.ORGANIZER && "🚀 Manage your events and track attendance"}
            {user.role === UserRole.ADMIN && "⚡ Oversee all events and user management"}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30">
              {user.role}
            </span>
            {user.department && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-white backdrop-blur-sm border border-white/20">
                {user.department}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="md"
          onClick={onRefresh}
          loading={loading}
          className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [eventsAPI.getEvents()];

      // Only fetch students for faculty and admin
      if ([UserRole.FACULTY, UserRole.ADMIN].includes(user!.role)) {
        promises.push(usersAPI.getUsers({ role: UserRole.STUDENT }));
      }

      const results = await Promise.all(promises);
      setEvents(results[0].events);

      if (results[1]) {
        setStudents(results[1].users);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getCurrentDate = () => new Date();
  const getThisMonth = () => {
    const now = getCurrentDate();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const getRoleSpecificStats = () => {
    const now = getCurrentDate();
    const thisMonth = getThisMonth();

    switch (user.role) {
      case UserRole.STUDENT:
        const attendedEvents = events.filter(event => event.is_attending);
        const upcomingEvents = events.filter(event => new Date(event.date) > now);
        const thisMonthEvents = events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= thisMonth && event.is_attending;
        });

        return [
          { title: "Events Attended", value: attendedEvents.length, icon: Calendar, color: "text-green-500" },
          { title: "Upcoming Events", value: upcomingEvents.length, icon: Clock, color: "text-blue-500" },
          { title: "This Month", value: thisMonthEvents.length, icon: TrendingUp, color: "text-purple-500" },
        ];

      case UserRole.FACULTY:
        const departmentEvents = events.filter(event => event.department === user.department);
        const departmentStudents = students.filter(student => student.department === user.department);

        return [
          { title: "Total Events", value: events.length, icon: Calendar, color: "text-blue-500" },
          { title: "Department Students", value: departmentStudents.length, icon: Users, color: "text-green-500" },
          { title: "Department Events", value: departmentEvents.length, icon: TrendingUp, color: "text-purple-500" },
        ];

      case UserRole.ORGANIZER:
        const myEvents = events.filter(event => event.organizer_email === user.email);
        const totalAttendees = myEvents.reduce((sum, event) => {
          // Ensure attendee_count is treated as a number
          const attendeeCount = parseInt(event.attendee_count?.toString() || '0', 10) || 0;
          return sum + attendeeCount;
        }, 0);
        const thisMonthMyEvents = myEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= thisMonth;
        });

        return [
          { title: "My Events", value: myEvents.length, icon: Calendar, color: "text-blue-500" },
          { title: "Total Attendees", value: totalAttendees, icon: Users, color: "text-green-500" },
          { title: "This Month", value: thisMonthMyEvents.length, icon: TrendingUp, color: "text-purple-500" },
        ];

      case UserRole.ADMIN:
        const activeEvents = events.filter(event => new Date(event.date) >= now);

        return [
          { title: "Total Events", value: events.length, icon: Calendar, color: "text-blue-500" },
          { title: "Total Students", value: students.length, icon: Users, color: "text-green-500" },
          { title: "Active Events", value: activeEvents.length, icon: TrendingUp, color: "text-purple-500" },
        ];

      default:
        return [];
    }
  };

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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">
            <p className="font-medium">Error Loading Dashboard</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = getRoleSpecificStats();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <WelcomeCard user={user} onRefresh={loadDashboardData} loading={loading} />

        <div className="animate-slide-in-up">
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Overview
              </h3>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
              <div className="h-1 w-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <div className="h-1 w-4 bg-gradient-to-r from-pink-400 to-red-400 rounded-full"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, index) => (
              <div key={index} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in">
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 shadow-xl rounded-2xl border border-gray-100 animate-slide-in-up">
          <div className="px-6 py-8 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Quick Actions
              </h3>
              <div className="ml-auto">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {user.role === UserRole.STUDENT && (
                <>
                  <a
                    href="/events"
                    className="group block p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-blue-400 group-hover:text-blue-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">View Events</p>
                    <p className="text-sm text-gray-600">Browse available events and join them</p>
                  </a>
                </>
              )}

              {user.role === UserRole.FACULTY && (
                <>
                  <a
                    href="/events"
                    className="group block p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-blue-400 group-hover:text-blue-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">View Events</p>
                    <p className="text-sm text-gray-600">Monitor all events and attendance</p>
                  </a>
                  <a
                    href="/students"
                    className="group block p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-green-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Users className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-green-400 group-hover:text-green-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">View Students</p>
                    <p className="text-sm text-gray-600">Track student attendance records</p>
                  </a>
                </>
              )}

              {user.role === UserRole.ORGANIZER && (
                <>
                  <a
                    href="/create-event"
                    className="group block p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-purple-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-purple-400 group-hover:text-purple-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">Create Event</p>
                    <p className="text-sm text-gray-600">Organize new events for students</p>
                  </a>
                  <a
                    href="/events"
                    className="group block p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-teal-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="h-8 w-8 text-teal-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-teal-400 group-hover:text-teal-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">My Events</p>
                    <p className="text-sm text-gray-600">Manage and track your events</p>
                  </a>
                </>
              )}

              {user.role === UserRole.ADMIN && (
                <>
                  <a
                    href="/admin/register"
                    className="group block p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-purple-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Users className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-purple-400 group-hover:text-purple-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">Register User</p>
                    <p className="text-sm text-gray-600">Create new user accounts</p>
                  </a>
                  <a
                    href="/students"
                    className="group block p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-green-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Users className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-green-400 group-hover:text-green-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">View Students</p>
                    <p className="text-sm text-gray-600">Manage student records</p>
                  </a>
                  <a
                    href="/events"
                    className="group block p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-blue-400 group-hover:text-blue-600 transition-colors">→</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">Manage Events</p>
                    <p className="text-sm text-gray-600">Oversee all system events</p>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
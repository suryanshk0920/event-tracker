'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI } from '@/lib/api';
import { User, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StudentDetailsModal } from '@/components/modals/StudentDetailsModal';
import {
  Users,
  Search,
  Filter,
  Mail,
  School,
  Calendar,
  UserCheck,
  Download,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, departmentFilter]);

  const loadStudents = async () => {
    try {
      const response = await usersAPI.getUsers({ role: UserRole.STUDENT });
      setStudents(response.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(student => student.department === departmentFilter);
    }

    setFilteredStudents(filtered);
  };

  const getDepartments = () => {
    const departments = [...new Set(students.map(s => s.department))];
    return departments.sort();
  };

  const exportStudents = () => {
    const csvContent = [
      ['Name', 'Email', 'Department', 'Joined Date'].join(','),
      ...filteredStudents.map(student => [
        student.name,
        student.email,
        student.department,
        new Date(student.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleViewStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStudentId(null);
  };

  // Check if user has permission to view students
  if (!user || ![UserRole.ADMIN, UserRole.FACULTY].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <div className="text-yellow-600 mb-4">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">Access Restricted</p>
                <p className="text-sm mt-1">
                  You don't have permission to view student information.
                </p>
              </div>
              <Link href="/dashboard">
                <Button>
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
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
                <p className="font-medium">Error Loading Students</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <Button onClick={loadStudents}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-500" />
              Students
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and view all registered students ({filteredStudents.length} of {students.length})
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={exportStudents}
              className="flex items-center"
              disabled={filteredStudents.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            {user.role === UserRole.ADMIN && (
              <Link href="/admin/register">
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:w-64">
                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {getDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || departmentFilter ? 'No students found' : 'No students registered'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || departmentFilter
                  ? 'Try adjusting your search criteria.'
                  : 'Students will appear here once they register.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {student.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Mail className="w-4 h-4 mr-1" />
                        {student.email}
                      </div>
                    </div>
                    <Badge variant="info" className="ml-2">
                      Student
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <School className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-1 text-gray-600">{student.department}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-green-500" />
                    <span className="font-medium text-gray-700">Joined:</span>
                    <span className="ml-1 text-gray-600">
                      {new Date(student.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {student.last_login && (
                    <div className="flex items-center text-sm">
                      <UserCheck className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="font-medium text-gray-700">Last login:</span>
                      <span className="ml-1 text-gray-600">
                        {new Date(student.last_login).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        ID: {student.id}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStudent(student.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {students.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                  <div className="text-sm text-gray-500">Total Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{getDepartments().length}</div>
                  <div className="text-sm text-gray-500">Departments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {students.filter(s => s.last_login).length}
                  </div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {students.filter(s =>
                      new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    ).length}
                  </div>
                  <div className="text-sm text-gray-500">Recent Signups</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Details Modal */}
        {selectedStudentId && (
          <StudentDetailsModal
            isOpen={modalOpen}
            onClose={handleCloseModal}
            studentId={selectedStudentId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

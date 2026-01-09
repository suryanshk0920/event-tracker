'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, GraduationCap } from 'lucide-react';
import { UserRole, RegisterRequest } from '@/types';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  roll_no: z.string().optional(),
  division: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  role: z.nativeEnum(UserRole),
});

type RegisterFormData = z.infer<typeof registerSchema>;

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

const divisions = ['A', 'B', 'C', 'D'];

export const RegisterForm: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  // Removed useRouter as it was unused

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.STUDENT
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authAPI.register(data as RegisterRequest);
      setSuccess('✅ User registered successfully! Credentials have been sent to their email.');
      reset(); // Reset form after successful registration

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = departments.map(dept => ({
    value: dept,
    label: dept
  }));

  const divisionOptions = divisions.map(div => ({
    value: div,
    label: `Division ${div}`
  }));

  const roleOptions = [
    { value: UserRole.STUDENT, label: '🎓 Student' },
    { value: UserRole.FACULTY, label: '👨‍🏫 Faculty' },
    { value: UserRole.ORGANIZER, label: '🎪 Organizer' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-r from-indigo-300/5 to-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-lg w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg hover-lift">
            <span className="text-3xl text-white">👥</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Register New User
          </h2>
          <p className="mt-3 text-lg text-gray-600 font-medium">
            🔐 Admin Only - Create accounts for students, faculty, and organizers
          </p>
          <div className="mt-2 h-1 w-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto"></div>
        </div>

        {/* Form Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 animate-slide-in-up">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-5">
              <Input
                {...register('name')}
                type="text"
                label="Full Name"
                placeholder="John Doe"
                error={errors.name?.message}
                icon={<User className="w-5 h-5" />}
              />

              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="user@email.com"
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5" />}
              />

              <Select
                {...register('role')}
                label="Role"
                placeholder="Select role"
                error={errors.role?.message}
                options={roleOptions}
              />

              <Select
                {...register('department')}
                label="Department"
                placeholder="Select department"
                error={errors.department?.message}
                options={departmentOptions}
              />

              {selectedRole === UserRole.STUDENT && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-slide-in-up">
                  <Input
                    {...register('roll_no')}
                    type="text"
                    label="Roll Number"
                    placeholder="CS2021001"
                    error={errors.roll_no?.message}
                    icon={<GraduationCap className="w-5 h-5" />}
                  />

                  <Select
                    {...register('division')}
                    label="Division"
                    placeholder="Select division"
                    error={errors.division?.message}
                    options={divisionOptions}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 animate-slide-in-up">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-slide-in-up">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-green-700 font-medium">{success}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              variant="gradient"
              size="xl"
              className="w-full shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              {loading ? '🔄 Registering User...' : '🎯 Register User'}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> A random password will be generated and sent to the user&apos;s email address automatically. Users can change their password after first login.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

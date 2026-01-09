'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordForm: React.FC = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema)
    });

    const { logout } = useAuth();
    const router = useRouter();

    const onSubmit = async (data: ChangePasswordFormData) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await authAPI.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setSuccess('✅ Password changed successfully! Logging out...');
            reset();

            // Logout and redirect after 2 seconds
            setTimeout(async () => {
                logout();
                router.push('/login');
            }, 2000);
        } catch (err) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error.response?.data?.error || 'Failed to change password');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center animate-fade-in">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg hover-lift">
                        <span className="text-3xl text-white">🔐</span>
                    </div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Change Password
                    </h2>
                    <p className="mt-3 text-lg text-gray-600 font-medium">
                        🔑 Update your account password
                    </p>
                    <div className="mt-2 h-1 w-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
                </div>

                {/* Form Card */}
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 animate-slide-in-up">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-5">
                            <div className="relative">
                                <Input
                                    {...register('currentPassword')}
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    label="Current Password"
                                    placeholder="Enter your current password"
                                    error={errors.currentPassword?.message}
                                    icon={<Lock className="w-5 h-5" />}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="relative">
                                <Input
                                    {...register('newPassword')}
                                    type={showNewPassword ? 'text' : 'password'}
                                    label="New Password"
                                    placeholder="Enter your new password"
                                    error={errors.newPassword?.message}
                                    icon={<Lock className="w-5 h-5" />}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="relative">
                                <Input
                                    {...register('confirmPassword')}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    label="Confirm New Password"
                                    placeholder="Confirm your new password"
                                    error={errors.confirmPassword?.message}
                                    icon={<Lock className="w-5 h-5" />}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
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
                            {loading ? '🔄 Updating Password...' : '🔒 Change Password'}
                        </Button>
                    </form>

                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start space-x-2">
                            <span className="text-yellow-600 text-lg">⚠️</span>
                            <div className="text-sm text-yellow-700">
                                <p className="font-semibold mb-1">Security Tips:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Use a strong, unique password</li>
                                    <li>Include uppercase, lowercase, numbers, and symbols</li>
                                    <li>Do not reuse passwords from other accounts</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

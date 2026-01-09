'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Calendar, Users, Settings, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const getNavItems = () => {
    const baseItems = [
      { href: '/dashboard', label: 'Dashboard', icon: Calendar },
    ];

    switch (user.role) {
      case UserRole.STUDENT:
        return [
          ...baseItems,
          { href: '/events', label: 'Events', icon: Calendar },
        ];

      case UserRole.FACULTY:
        return [
          ...baseItems,
          { href: '/events', label: 'Events', icon: Calendar },
          { href: '/students', label: 'Students', icon: Users },
        ];

      case UserRole.ORGANIZER:
        return [
          ...baseItems,
          { href: '/events', label: 'My Events', icon: Calendar },
          { href: '/create-event', label: 'Create Event', icon: Calendar },
        ];

      case UserRole.ADMIN:
        return [
          ...baseItems,
          { href: '/events', label: 'All Events', icon: Calendar },
          { href: '/students', label: 'Students', icon: Users },
        ];

      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                ✨ Event Tracker
              </Link>
            </div>

            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm transform hover:scale-105'
                      }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg px-3 py-2">
              <div className="relative">
                <User className="w-8 h-8 text-gray-600 bg-white rounded-full p-1.5 shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-sm">
                <p className="text-gray-900 font-semibold">{user.name}</p>
                <Link href="/change-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center mt-0.5">
                  Change Password
                </Link>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200/50">
        <div className="pt-3 pb-3 space-y-2 bg-gradient-to-b from-white/80 to-gray-50/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center mx-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                  }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav >
  );
};
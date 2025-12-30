import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../auth';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between z-30">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64 lg:w-96">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Tenant info */}
        {user?.tenant_name && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-xs font-medium text-gray-600">
              {user.tenant_name}
            </span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Mobile search */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Search className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </header>
  );
}

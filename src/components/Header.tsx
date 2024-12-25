import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Tent, Menu, X, User, Building } from 'lucide-react';
import clsx from 'clsx';
import { useRef } from 'react';
import { UserMenu } from './UserMenu';

interface NavItem {
  path: string;
  label: string;
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  
  const handleHeaderClick = (e: React.MouseEvent) => {
    // Don't close if clicking the menu toggle button
    if ((e.target as Element).closest('button')) {
      return;
    }
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const navItems: NavItem[] = useMemo(() => [
    { path: '/reservations', label: 'Reservations' },
    { path: '/todos', label: "To-do's" },
    { path: '/reports', label: 'Reports' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/campers', label: 'Campers' },
  ], []);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="border-b border-gray-200 bg-white" onClick={handleHeaderClick}>
      <div className="flex items-center justify-between px-4 py-3 relative">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <Tent className="h-8 w-8 text-green-600" />
            <span className="text-xl font-semibold text-green-600">Park</span>
          </Link>
          <nav className="hidden lg:block">
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path} 
                    className={clsx(
                      'transition-colors',
                      location.pathname === item.path
                        ? 'text-green-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name or email"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/tenants"
              className="p-2 hover:text-green-600 rounded-full"
            >
              <Building className={clsx(
                "h-5 w-5 transition-colors",
                isAdminRoute ? "text-green-600" : "text-gray-600"
              )} />
            </Link>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 hover:text-green-600 rounded-full relative z-20"
            >
              <User className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          {isUserMenuOpen && (
            <UserMenu onClose={() => setIsUserMenuOpen(false)} />
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md z-20"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 lg:hidden z-50">
            <nav className="px-4 py-2">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                      className={clsx(
                        'w-full text-left px-4 py-2 rounded-md transition-colors',
                        location.pathname === item.path
                          ? 'bg-green-50 text-green-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
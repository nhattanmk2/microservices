import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Ticket, Package, ShieldCheck, LogOut, LogIn, UserPlus, User } from 'lucide-react';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl tracking-tight">
              <ShoppingBag className="w-7 h-7 text-indigo-600" />
              <span>MicroShop</span>
            </Link>

            <div className="hidden md:flex space-x-6">
              <Link to="/" className={`py-2 px-1 text-sm inline-flex items-center space-x-1 ${isActive('/')}`}>
                <ShoppingBag className="w-4 h-4" />
                <span>Sản phẩm</span>
              </Link>
              <Link to="/promotions" className={`py-2 px-1 text-sm inline-flex items-center space-x-1 ${isActive('/promotions')}`}>
                <Ticket className="w-4 h-4" />
                <span>Kho Voucher</span>
              </Link>
              {user && (
                <Link to="/orders" className={`py-2 px-1 text-sm inline-flex items-center space-x-1 ${isActive('/orders')}`}>
                  <Package className="w-4 h-4" />
                  <span>Đơn mua của tôi</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Admin & Auth */}
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <div className="hidden sm:flex items-center bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1 space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Admin:</span>
                <Link to="/admin/products" className="text-xs text-purple-800 hover:underline">Sản phẩm</Link>
                <span className="text-purple-300">|</span>
                <Link to="/admin/orders" className="text-xs text-purple-800 hover:underline">Đơn hàng</Link>
                <span className="text-purple-300">|</span>
                <Link to="/admin/users" className="text-xs text-purple-800 hover:underline">Người dùng</Link>
                <span className="text-purple-300">|</span>
                <Link to="/admin/promotions" className="text-xs text-purple-800 hover:underline">Voucher</Link>
                <span className="text-purple-300">|</span>
                <Link to="/admin/dashboard" className="text-xs text-purple-800 hover:underline">Hệ thống</Link>
              </div>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-full py-1 px-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-800">{user.username}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    isAdmin ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


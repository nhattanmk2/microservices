import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import authApi from '../../api/authApi';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Mail,
  Calendar,
} from 'lucide-react';

const ROLE_FILTERS = [
  { id: 'all', label: 'Tất cả vai trò' },
  { id: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
  { id: 'USER', label: 'Người dùng (USER)' },
];

const SORT_OPTIONS = [
  { id: 'id_asc', label: 'Mã ID: Tăng dần' },
  { id: 'id_desc', label: 'Mã ID: Giảm dần' },
  { id: 'username_asc', label: 'Tên tài khoản: A -> Z' },
  { id: 'username_desc', label: 'Tên tài khoản: Z -> A' },
  { id: 'role_desc', label: 'Vai trò: Admin trước' },
];

const ITEMS_PER_PAGE = 15;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id_asc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await authApi.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      setError('Không thể tải danh sách tài khoản từ Auth Service (:8081).');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Bạn có chắc muốn đổi vai trò của '${user.username}' thành '${newRole}'?`)) {
      return;
    }

    try {
      setUpdatingId(user.id);
      await authApi.updateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setSuccessMsg(`Đã cập nhật vai trò '${user.username}' thành ${newRole} thành công!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Lỗi khi đổi vai trò:', err);
      alert('Không thể cập nhật vai trò người dùng: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Lọc và sắp xếp
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        // Tìm kiếm theo username hoặc email
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchUsername = (user.username || '').toLowerCase().includes(term);
          const matchEmail = (user.email || '').toLowerCase().includes(term);
          const matchId = String(user.id).includes(term);
          if (!matchUsername && !matchEmail && !matchId) return false;
        }

        // Lọc vai trò
        if (selectedRoleFilter !== 'all') {
          if ((user.role || 'USER') !== selectedRoleFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'id_asc') return a.id - b.id;
        if (sortBy === 'id_desc') return b.id - a.id;
        if (sortBy === 'username_asc') return (a.username || '').localeCompare(b.username || '');
        if (sortBy === 'username_desc') return (b.username || '').localeCompare(a.username || '');
        if (sortBy === 'role_desc') return (b.role || 'USER').localeCompare(a.role || 'USER');
        return 0;
      });
  }, [users, searchTerm, selectedRoleFilter, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('all');
    setSortBy('id_asc');
    setCurrentPage(1);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const standardUsers = total - admins;
    return { total, admins, standardUsers };
  }, [users]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header breadcrumb & title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại Dashboard Quản trị
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Quản lý Tài khoản & Người dùng
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tra cứu, phân quyền Admin/User và quản trị tài khoản hệ thống từ Auth Service (:8081)
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 text-sm font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng tài khoản</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Người dùng trong hệ thống</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quản trị viên (ADMIN)</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.admins}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toàn quyền hệ thống</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Khách mua hàng (USER)</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.standardUsers}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Người dùng thông thường</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Thông báo Alert */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <button
            onClick={loadUsers}
            className="ml-auto text-xs underline font-bold hover:text-rose-900"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Thanh công cụ Tìm kiếm & Bộ lọc */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên đăng nhập, email hoặc ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc theo Vai trò */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => {
                setSelectedRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-slate-700"
            >
              {ROLE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-slate-700"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thanh trạng thái bộ lọc */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div>
            Hiển thị <span className="font-bold text-slate-700">{filteredUsers.length}</span> / {users.length} tài khoản
            {searchTerm && <span> với từ khoá "{searchTerm}"</span>}
          </div>
          {(searchTerm || selectedRoleFilter !== 'all' || sortBy !== 'id_asc') && (
            <button
              onClick={handleResetFilters}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Xoá tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Danh sách người dùng Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">Đang tải danh sách tài khoản người dùng...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-base">Không tìm thấy tài khoản phù hợp</p>
            <p className="text-slate-400 text-xs mt-1">Thử đổi từ khoá tìm kiếm hoặc đặt lại bộ lọc</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-16">ID</th>
                    <th className="py-3.5 px-4">Tên đăng nhập</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Vai trò</th>
                    <th className="py-3.5 px-4">Ngày tạo</th>
                    <th className="py-3.5 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedUsers.map((user) => {
                    const isAdmin = user.role === 'ADMIN';
                    const isUpdating = updatingId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-center text-xs font-semibold text-slate-400">
                          #{user.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                isAdmin
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">{user.username}</span>
                              {user.username === 'admin' && (
                                <span className="text-[10px] text-amber-600 font-bold">Tài khoản quản trị gốc</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {user.email || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              USER
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {user.createdAt ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isUpdating || user.username === 'admin'}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              user.username === 'admin'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isAdmin
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                            title={user.username === 'admin' ? 'Không thể thay đổi tài khoản gốc' : 'Bấm để đổi vai trò'}
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isAdmin ? (
                              'Hạ xuống USER'
                            ) : (
                              'Nâng lên ADMIN'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phân trang Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Trang <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages} (Tổng số {filteredUsers.length} kết quả)
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && page - arr[idx - 1] > 1 && (
                        <span className="px-1 text-slate-400 text-xs">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 text-xs font-semibold rounded-lg transition ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;


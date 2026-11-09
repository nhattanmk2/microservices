import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import orderApi from '../../api/orderApi';
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Tag,
  DollarSign,
  User,
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả trạng thái' },
  { id: 'CREATED', label: 'Mới tạo (CREATED)' },
  { id: 'CONFIRMED', label: 'Đã xác nhận (CONFIRMED)' },
  { id: 'SHIPPING', label: 'Đang giao hàng (SHIPPING)' },
  { id: 'COMPLETED', label: 'Đã hoàn thành (COMPLETED)' },
  { id: 'CANCELLED', label: 'Đã huỷ (CANCELLED)' },
];

const SORT_OPTIONS = [
  { id: 'id_desc', label: 'Mã đơn hàng: Mới nhất' },
  { id: 'id_asc', label: 'Mã đơn hàng: Cũ nhất' },
  { id: 'price_desc', label: 'Tổng tiền: Cao -> Thấp' },
  { id: 'price_asc', label: 'Tổng tiền: Thấp -> Cao' },
  { id: 'qty_desc', label: 'Số lượng: Nhiều nhất' },
];

const ITEMS_PER_PAGE = 15;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id_desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await orderApi.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đơn hàng:', err);
      setError('Không thể tải danh sách đơn hàng từ Order Service (:8083).');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const updated = await orderApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status || newStatus } : o))
      );
      setSuccessMsg(`Cập nhật trạng thái đơn #${orderId} thành "${newStatus}" thành công!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
      alert('Không thể đổi trạng thái đơn hàng: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Lọc và sắp xếp
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Tìm kiếm theo ID, buyer username, product ID, mã voucher
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchId = String(order.id).includes(term);
          const matchBuyer = (order.buyerUsername || '').toLowerCase().includes(term);
          const matchProd = String(order.productId).includes(term);
          const matchPromo = (order.promotionCode || '').toLowerCase().includes(term);
          if (!matchId && !matchBuyer && !matchProd && !matchPromo) return false;
        }

        // Lọc theo trạng thái
        if (selectedStatusFilter !== 'all') {
          if ((order.status || 'CREATED').toUpperCase() !== selectedStatusFilter.toUpperCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'id_desc') return b.id - a.id;
        if (sortBy === 'id_asc') return a.id - b.id;
        if (sortBy === 'price_desc') return (b.totalPrice || 0) - (a.totalPrice || 0);
        if (sortBy === 'price_asc') return (a.totalPrice || 0) - (b.totalPrice || 0);
        if (sortBy === 'qty_desc') return (b.quantity || 0) - (a.quantity || 0);
        return 0;
      });
  }, [orders, searchTerm, selectedStatusFilter, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatusFilter('all');
    setSortBy('id_desc');
    setCurrentPage(1);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    const processing = total - completed - cancelled;
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return { total, completed, cancelled, processing, totalRevenue };
  }, [orders]);

  const renderStatusBadge = (status) => {
    const s = (status || 'CREATED').toUpperCase();
    switch (s) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Đã huỷ
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Truck className="w-3.5 h-3.5" />
            Đang giao
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã duyệt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Mới tạo
          </span>
        );
    }
  };

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
            <Package className="w-8 h-8 text-indigo-600" />
            Quản lý Đơn hàng
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi tiến độ, cập nhật trạng thái đơn hàng và xử lý hoàn trả tồn kho từ Order Service (:8083)
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 text-sm font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng đơn hàng</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tất cả giao dịch</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đang xử lý / Giao</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.processing}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Mới tạo & đang giao</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoàn tất thành công</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.completed}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Đã nhận hàng</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh thu tạm tính</p>
            <h3 className="text-xl font-black text-indigo-700 mt-1">
              {stats.totalRevenue.toLocaleString('vi-VN')} đ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Không tính đơn huỷ</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
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
            onClick={loadOrders}
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
              placeholder="Tìm theo mã đơn (#101), người mua, mã sản phẩm hoặc voucher..."
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

          {/* Lọc theo Trạng thái */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-slate-700"
            >
              {STATUS_FILTERS.map((f) => (
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
            Hiển thị <span className="font-bold text-slate-700">{filteredOrders.length}</span> / {orders.length} đơn hàng
            {searchTerm && <span> với từ khoá "{searchTerm}"</span>}
          </div>
          {(searchTerm || selectedStatusFilter !== 'all' || sortBy !== 'id_desc') && (
            <button
              onClick={handleResetFilters}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Xoá tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Danh sách Đơn hàng Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-base">Không tìm thấy đơn hàng phù hợp</p>
            <p className="text-slate-400 text-xs mt-1">Thử thay đổi từ khoá hoặc điều kiện lọc</p>
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
                    <th className="py-3.5 px-4 text-center w-16">Mã đơn</th>
                    <th className="py-3.5 px-4">Người mua</th>
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4 text-center">Số lượng</th>
                    <th className="py-3.5 px-4">Giảm giá / Voucher</th>
                    <th className="py-3.5 px-4 text-right">Tổng thanh toán</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Chuyển trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedOrders.map((order) => {
                    const isUpdating = updatingId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-center text-xs font-bold text-slate-600">
                          #{order.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {order.buyerUsername || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-medium text-slate-700">
                            Sản phẩm #{order.productId}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-bold text-slate-700">
                          x{order.quantity}
                        </td>
                        <td className="py-3 px-4">
                          {order.promotionCode ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Tag className="w-3 h-3" />
                                {order.promotionCode}
                              </span>
                              {order.discountAmount > 0 && (
                                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                                  -{(order.discountAmount || 0).toLocaleString('vi-VN')} đ
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Không áp dụng</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-indigo-700">
                          {(order.totalPrice || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderStatusBadge(order.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <select
                              value={order.status || 'CREATED'}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
                            >
                              <option value="CREATED">Mới tạo (CREATED)</option>
                              <option value="CONFIRMED">Đã duyệt (CONFIRMED)</option>
                              <option value="SHIPPING">Đang giao (SHIPPING)</option>
                              <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                              <option value="CANCELLED">Huỷ đơn (CANCELLED)</option>
                            </select>
                            {isUpdating && <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
                          </div>
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
                Trang <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages} (Tổng số {filteredOrders.length} kết quả)
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

export default AdminOrders;


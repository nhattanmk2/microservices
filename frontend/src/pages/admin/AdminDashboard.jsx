import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authApi from '../../api/authApi';
import productApi from '../../api/productApi';
import orderApi from '../../api/orderApi';
import promotionApi from '../../api/promotionApi';
import {
  ShieldCheck,
  Server,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Package,
  Users,
} from 'lucide-react';

const AdminDashboard = () => {
  const [statuses, setStatuses] = useState({
    gateway: { name: 'Gateway Server (:8080)', status: 'checking', message: '' },
    auth: { name: 'Auth Service (:8081)', status: 'checking', message: '' },
    product: { name: 'Product Service (:8082)', status: 'checking', message: '' },
    order: { name: 'Order Service (:8083)', status: 'checking', message: '' },
    promotion: { name: 'Promotion Service (:8084)', status: 'checking', message: '' },
  });

  useEffect(() => {
    checkAllServices();
  }, []);

  const checkAllServices = async () => {
    // 1. Auth check
    try {
      const authRes = await authApi.checkStatus();
      setStatuses((prev) => ({
        ...prev,
        auth: { ...prev.auth, status: 'online', message: typeof authRes === 'string' ? authRes : 'Online' },
        gateway: { ...prev.gateway, status: 'online', message: 'Routing hoạt động' },
      }));
    } catch (e) {
      setStatuses((prev) => ({
        ...prev,
        auth: { ...prev.auth, status: 'offline', message: 'Không thể kết nối' },
      }));
    }

    // 2. Product check
    try {
      await productApi.getAllProducts();
      setStatuses((prev) => ({
        ...prev,
        product: { ...prev.product, status: 'online', message: 'Online' },
      }));
    } catch (e) {
      setStatuses((prev) => ({
        ...prev,
        product: { ...prev.product, status: 'offline', message: 'Không thể kết nối' },
      }));
    }

    // 3. Order check
    try {
      await orderApi.getAllOrders();
      setStatuses((prev) => ({
        ...prev,
        order: { ...prev.order, status: 'online', message: 'Online' },
      }));
    } catch (e) {
      setStatuses((prev) => ({
        ...prev,
        order: { ...prev.order, status: 'offline', message: 'Không thể kết nối' },
      }));
    }

    // 4. Promotion check
    try {
      await promotionApi.getActivePromotions();
      setStatuses((prev) => ({
        ...prev,
        promotion: { ...prev.promotion, status: 'online', message: 'Online' },
      }));
    } catch (e) {
      setStatuses((prev) => ({
        ...prev,
        promotion: { ...prev.promotion, status: 'offline', message: 'Không thể kết nối' },
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Bảng điều khiển Quản trị</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Trung tâm giám sát trạng thái 7 microservices và quản lý toàn bộ hệ thống E-Commerce
          </p>
        </div>

        <button
          onClick={checkAllServices}
          className="inline-flex items-center space-x-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Kiểm tra lại kết nối</span>
        </button>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <Link
          to="/admin/products"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">Quản lý Sản phẩm</h3>
            <p className="text-xs text-slate-500 mt-1">Cập nhật giá bán, thêm mới và quản trị tồn kho</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 mt-4 inline-flex items-center">Truy cập →</span>
        </Link>

        <Link
          to="/admin/orders"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-sky-600 transition">Quản lý Đơn hàng</h3>
            <p className="text-xs text-slate-500 mt-1">Theo dõi đơn mua, duyệt trạng thái và hủy đơn</p>
          </div>
          <span className="text-xs font-semibold text-sky-600 mt-4 inline-flex items-center">Truy cập →</span>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition">Quản lý Người dùng</h3>
            <p className="text-xs text-slate-500 mt-1">Danh sách tài khoản, phân quyền Admin/User</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 mt-4 inline-flex items-center">Truy cập →</span>
        </Link>

        <Link
          to="/admin/promotions"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-600 transition">Quản lý Voucher</h3>
            <p className="text-xs text-slate-500 mt-1">Tạo mã ưu đãi, đặt chiết khấu và kích hoạt</p>
          </div>
          <span className="text-xs font-semibold text-purple-600 mt-4 inline-flex items-center">Truy cập →</span>
        </Link>

        <a
          href="http://localhost:8761"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition">Eureka Registry</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Xem chi tiết các instance đang online tại port 8761</p>
          </div>
          <span className="text-xs font-semibold text-amber-600 mt-4 inline-flex items-center">Mở tab mới ↗</span>
        </a>
      </div>

      {/* Service Status Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Server className="w-5 h-5 text-indigo-600" />
          <span>Trạng thái kết nối Microservices (qua Gateway :8080)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(statuses).map(([key, item]) => {
            const isOnline = item.status === 'online';
            return (
              <div
                key={key}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.message || 'Đang kiểm tra...'}</p>
                </div>
                <div className="flex items-center space-x-1.5">
                  {isOnline ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Chưa sẵn sàng</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

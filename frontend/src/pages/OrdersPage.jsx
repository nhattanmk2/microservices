import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderApi from '../api/orderApi';
import { Package, Clock, Ban, CheckCircle2, AlertCircle, ArrowRight, Ticket, RefreshCw } from 'lucide-react';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderApi.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      setError('Không thể tải lịch sử đơn hàng từ Order Service (:8083).');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId} không?`)) {
      return;
    }

    setCancellingId(orderId);
    setActionMessage('');

    try {
      const updated = await orderApi.cancelOrder(orderId);
      setActionMessage(`Đã hủy thành công đơn hàng #${orderId}. Lượt dùng voucher (nếu có) đã được hoàn trả tự động!`);
      // Update state locally
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể hủy đơn hàng';
      alert(`Lỗi khi hủy đơn hàng: ${msg}`);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Đơn hàng của tôi</h1>
          <p className="text-sm text-gray-500">Xem lại các đơn hàng bạn đã đặt và quản lý hủy đơn</p>
        </div>

        <button
          onClick={loadOrders}
          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-3xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">Bạn chưa có đơn hàng nào</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Hãy chọn mua các sản phẩm yêu thích và áp dụng voucher</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            <span>Khám phá sản phẩm ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-bold text-gray-900 text-base">Đơn hàng #{order.id}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isCancelled
                          ? 'bg-gray-100 text-gray-600 border border-gray-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {order.status || 'CREATED'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      Mã sản phẩm: <span className="font-medium text-gray-800">#{order.productId}</span> • Số lượng: <span className="font-medium text-gray-800">{order.quantity}</span>
                    </p>
                    {order.promotionCode && (
                      <p className="flex items-center space-x-1 text-indigo-600 font-medium">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Đã dùng mã: {order.promotionCode} (-{order.discountAmount?.toLocaleString('vi-VN')} đ)</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end w-full sm:w-auto">
                  <div className="mb-3">
                    <span className="text-xs text-gray-400 block sm:text-right">Tổng thanh toán:</span>
                    <span className="text-lg font-extrabold text-indigo-600">
                      {order.totalPrice?.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                    >
                      Chi tiết
                    </Link>

                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-xl transition disabled:opacity-50 inline-flex items-center space-x-1"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{cancellingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;


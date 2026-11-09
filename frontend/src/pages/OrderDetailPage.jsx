import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import orderApi from '../api/orderApi';
import { Package, ArrowLeft, Ticket, CheckCircle2, AlertCircle, Ban, User, ShoppingBag } from 'lucide-react';

const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const justCreated = location.state?.justCreated;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderApi.getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError('Không thể tìm thấy thông tin chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${id} này không?`)) {
      return;
    }

    setCancelling(true);
    try {
      await orderApi.cancelOrder(id);
      setCancelSuccess('Hủy đơn hàng thành công! Voucher (nếu có) đã được hoàn trả lại tài khoản của bạn.');
      loadOrder();
    } catch (err) {
      alert('Không thể hủy đơn hàng: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-red-200 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-700">{error || 'Không tìm thấy đơn hàng.'}</p>
        <Link to="/orders" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Về danh sách đơn
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/orders"
        className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh sách đơn hàng</span>
      </Link>

      {justCreated && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-bold">Đặt hàng thành công!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Đơn hàng đã được lưu trữ an toàn và voucher đã được ghi nhận vào hệ thống.
            </p>
          </div>
        </div>
      )}

      {cancelSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <span>{cancelSuccess}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-gray-900">Chi tiết Đơn hàng #{order.id}</h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isCancelled
                    ? 'bg-gray-100 text-gray-600 border border-gray-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Dữ liệu tổng hợp từ Order, Product & Auth Service qua Feign</p>
          </div>

          {!isCancelled && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition disabled:opacity-50 inline-flex items-center space-x-1.5"
            >
              <Ban className="w-4 h-4" />
              <span>{cancelling ? 'Đang hủy đơn...' : 'Hủy đơn hàng này'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          {/* Buyer Info */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-gray-400" />
              <span>Thông tin Khách mua (Auth Service)</span>
            </h3>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="text-gray-500">Tên tài khoản:</span>{' '}
                <span className="font-semibold text-gray-900">{order.buyer?.username || 'N/A'}</span>
              </p>
              <p>
                <span className="text-gray-500">Email:</span>{' '}
                <span className="font-medium text-gray-800">{order.buyer?.email || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span>Sản phẩm đặt mua (Product Service)</span>
            </h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-bold text-gray-900 text-base">{order.product?.name || 'Sản phẩm'}</p>
              <p className="text-gray-600 text-xs">
                Mã sản phẩm: #{order.product?.id} • Đơn giá: {order.product?.price?.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-gray-600 text-xs">
                Số lượng đặt: <span className="font-bold text-gray-800">{order.quantity}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="pt-6 border-t border-gray-100 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tiền gốc:</span>
            <span className="font-medium">{order.originalPrice?.toLocaleString('vi-VN')} đ</span>
          </div>

          {order.promotionCode && (
            <div className="flex justify-between text-sm text-emerald-600 font-medium">
              <span className="flex items-center space-x-1.5">
                <Ticket className="w-4 h-4" />
                <span>Mã giảm giá đã dùng ({order.promotionCode}):</span>
              </span>
              <span>-{order.discountAmount?.toLocaleString('vi-VN')} đ</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-4 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">Tổng thanh toán:</span>
            <span className="text-2xl font-extrabold text-indigo-600">
              {order.totalPrice?.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;


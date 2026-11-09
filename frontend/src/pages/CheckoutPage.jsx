import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productApi from '../api/productApi';
import promotionApi from '../api/promotionApi';
import orderApi from '../api/orderApi';
import { ShoppingBag, Ticket, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const productId = searchParams.get('productId');
  const initialQuantity = parseInt(searchParams.get('quantity') || '1', 10);
  const initialCode = searchParams.get('code') || '';

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [promotionCode, setPromotionCode] = useState(initialCode);
  const [discountInfo, setDiscountInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const [promoMessage, setPromoMessage] = useState('');

  useEffect(() => {
    if (productId) {
      loadProduct();
    } else {
      setError('Thiếu thông tin sản phẩm cần thanh toán.');
      setLoading(false);
    }
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await productApi.getProductById(productId);
      setProduct(data);
      if (initialCode) {
        testApplyPromotion(initialCode, data, initialQuantity);
      }
    } catch (err) {
      setError('Không tìm thấy thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const testApplyPromotion = async (codeToApply, currentProduct = product, currentQty = quantity) => {
    if (!codeToApply || !codeToApply.trim()) {
      setDiscountInfo(null);
      setPromoMessage('');
      return;
    }

    setApplyingPromo(true);
    setPromoMessage('');
    setError('');

    const prodPrice = currentProduct.price;
    const totalOrderAmount = prodPrice * currentQty;

    try {
      const applyPayload = {
        promotionCode: codeToApply.trim().toUpperCase(),
        orderAmount: totalOrderAmount,
        buyerUsername: user?.username || '',
        items: [
          {
            productId: parseInt(productId, 10),
            quantity: currentQty,
            unitPrice: prodPrice,
          },
        ],
      };

      const result = await promotionApi.applyPromotion(applyPayload);
      if (result.valid) {
        setDiscountInfo(result);
        setPromoMessage(`Áp dụng thành công! Giảm ${result.discountAmount.toLocaleString('vi-VN')} đ`);
      } else {
        setDiscountInfo(null);
        setPromoMessage(result.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.');
      }
    } catch (err) {
      setDiscountInfo(null);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi kiểm tra mã giảm giá';
      setPromoMessage(msg);
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleApplyClick = (e) => {
    e.preventDefault();
    if (product) {
      testApplyPromotion(promotionCode, product, quantity);
    }
  };

  const handleCreateOrder = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: window.location.pathname + window.location.search } } });
      return;
    }

    setOrdering(true);
    setError('');

    try {
      const newOrder = await orderApi.createOrder({
        productId: parseInt(productId, 10),
        quantity: quantity,
        promotionCode: discountInfo ? promotionCode.trim().toUpperCase() : null,
      });

      // Thành công -> chuyển đến chi tiết đơn hoặc danh sách đơn
      navigate(`/orders/${newOrder.id}`, { state: { justCreated: true } });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Đặt hàng không thành công';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-red-200 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-700">{error}</p>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const originalTotal = (product.price || 0) * quantity;
  const discountAmount = discountInfo?.discountAmount || 0;
  const finalTotal = Math.max(0, originalTotal - discountAmount);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to={`/products/${productId}`}
        className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại sản phẩm</span>
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8">
        Xác nhận Đặt hàng & Thanh toán
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Product & Quantity */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <span>Sản phẩm đã chọn</span>
            </h2>

            <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
              <div className="w-20 h-20 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Mã ID #{product.id}</p>
                <p className="text-sm font-semibold text-indigo-600 mt-1">
                  {product.price?.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">Số lượng mua:</span>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => {
                    const newQ = Math.max(1, quantity - 1);
                    setQuantity(newQ);
                    if (promotionCode) testApplyPromotion(promotionCode, product, newQ);
                  }}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1 text-sm font-semibold min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newQ = Math.min(product.inventory, quantity + 1);
                    setQuantity(newQ);
                    if (promotionCode) testApplyPromotion(promotionCode, product, newQ);
                  }}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Promotion / Voucher Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <Ticket className="w-5 h-5 text-indigo-600" />
              <span>Khuyến mãi & Mã giảm giá</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Nhập mã voucher để được kiểm tra và tính chiết khấu trực tiếp qua Promotion Service.
            </p>

            <form onSubmit={handleApplyClick} className="flex gap-2">
              <input
                type="text"
                placeholder="Ví dụ: SUMMER2026, FREESHIP..."
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={applyingPromo || !promotionCode.trim()}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {applyingPromo ? 'Đang kiểm tra...' : 'Áp dụng thử'}
              </button>
            </form>

            {promoMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  discountInfo
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {discountInfo ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{promoMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Chi tiết thanh toán</h2>

            <div className="space-y-3 text-sm text-gray-600 pb-4 border-b border-gray-100">
              <div className="flex justify-between">
                <span>Tiền hàng ({quantity} món):</span>
                <span className="font-medium text-gray-900">{originalTotal.toLocaleString('vi-VN')} đ</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Giảm giá ({promotionCode}):</span>
                  </span>
                  <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between items-baseline mb-6">
              <span className="text-base font-bold text-gray-900">Tổng thanh toán:</span>
              <span className="text-2xl font-extrabold text-indigo-600">
                {finalTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={ordering}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {ordering ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác nhận Đặt hàng</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Đơn hàng được lưu trữ và bảo vệ qua Order Service & Gateway.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;


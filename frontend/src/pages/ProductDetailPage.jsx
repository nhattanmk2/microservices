import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import productApi from '../api/productApi';
import promotionApi from '../api/promotionApi';
import { ShoppingBag, ArrowLeft, Ticket, ShieldCheck, Truck, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const prodData = await productApi.getProductById(id);
      setProduct(prodData);

      try {
        const promoData = await promotionApi.getForProduct(id);
        setPromotions(promoData || []);
      } catch (e) {
        // Có thể không có voucher riêng cho sản phẩm này
        setPromotions([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy thông tin sản phẩm này!');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (selectedPromoCode = '') => {
    let url = `/checkout?productId=${id}&quantity=${quantity}`;
    if (selectedPromoCode) {
      url += `&code=${selectedPromoCode}`;
    }
    navigate(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-red-200 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Lỗi truy xuất sản phẩm</h3>
        <p className="text-sm text-gray-500 mb-6">{error || 'Sản phẩm không tồn tại.'}</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    );
  }

  const currentStock = Number(product.stock ?? product.inventory ?? 0);
  const hasStock = currentStock > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh mục sản phẩm</span>
      </Link>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Product Visual */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 flex items-center justify-center min-h-[320px]">
          <div className="text-center">
            <div className="w-32 h-32 bg-white rounded-3xl shadow-sm mx-auto flex items-center justify-center text-indigo-600 mb-4">
              <ShoppingBag className="w-16 h-16" />
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-700 bg-indigo-100/80 px-3 py-1 rounded-full">
              Sản phẩm chính hãng #ID {product.id}
            </span>
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline space-x-3">
              <span className="text-3xl font-extrabold text-indigo-600">
                {product.price?.toLocaleString('vi-VN')} đ
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                hasStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {hasStock ? `Còn ${currentStock} trong kho` : 'Tạm hết hàng'}
              </span>
            </div>

            {/* Quantity Selector */}
            {hasStock && (
              <div className="mt-6 flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-base font-semibold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-semibold text-gray-800 min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-base font-semibold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  Tổng: {(product.price * quantity).toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}

            {/* Applicable Vouchers for this product */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2 mb-3">
                <Ticket className="w-4 h-4 text-indigo-600" />
                <span>Mã giảm giá áp dụng riêng cho sản phẩm này:</span>
              </h3>

              {promotions.length === 0 ? (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
                  Chưa có voucher độc quyền cho sản phẩm này. Bạn vẫn có thể dùng các voucher chung tại trang thanh toán.
                </p>
              ) : (
                <div className="space-y-2">
                  {promotions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded font-mono">
                            {p.code}
                          </span>
                          <span className="text-xs font-medium text-indigo-950">
                            {p.discountType === 'PERCENTAGE'
                              ? `Giảm ${p.discountValue}% (tối đa ${p.maxDiscountAmount?.toLocaleString('vi-VN')}đ)`
                              : `Giảm ${p.discountValue?.toLocaleString('vi-VN')}đ`}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{p.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuyNow(p.code)}
                        className="ml-3 px-3 py-1 bg-white border border-indigo-300 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-semibold rounded-lg transition shadow-2xs whitespace-nowrap"
                      >
                        Dùng mã này
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!hasStock}
              onClick={() => handleBuyNow()}
              className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{hasStock ? 'Đặt mua ngay' : 'Tạm hết hàng'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;


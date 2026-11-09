import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import promotionApi from '../api/promotionApi';
import {
  Ticket,
  Copy,
  Check,
  Clock,
  ShoppingBag,
  AlertCircle,
  Sparkles,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Percent,
  Banknote,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ITEMS_PER_PAGE = 9;

const MIN_ORDER_RANGES = [
  { id: 'all', label: 'Tất cả mức đơn tối thiểu', min: 0, max: Infinity },
  { id: 'zero', label: 'Không yêu cầu đơn tối thiểu (0đ)', min: 0, max: 0 },
  { id: 'under_200k', label: 'Dưới 200.000đ', min: 1, max: 200000 },
  { id: '200k_500k', label: 'Từ 200.000đ - 500.000đ', min: 200000, max: 500000 },
  { id: 'over_500k', label: 'Trên 500.000đ', min: 500000, max: Infinity },
];

const SORT_OPTIONS = [
  { id: 'default', label: 'Mặc định (ID voucher)' },
  { id: 'discount_desc', label: 'Mức giảm: Cao nhất -> Thấp nhất' },
  { id: 'discount_asc', label: 'Mức giảm: Thấp nhất -> Cao nhất' },
  { id: 'min_order_asc', label: 'Đơn tối thiểu: Thấp nhất' },
  { id: 'remaining_desc', label: 'Lượt còn lại: Nhiều nhất' },
];

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Bộ lọc states
  const [searchTerm, setSearchTerm] = useState('');
  const [discountTypeTab, setDiscountTypeTab] = useState('ALL'); // 'ALL' | 'PERCENTAGE' | 'FIXED_AMOUNT'
  const [selectedMinOrderRange, setSelectedMinOrderRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, discountTypeTab, selectedMinOrderRange, sortBy]);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await promotionApi.getActivePromotions();
      setPromotions(data || []);
    } catch (err) {
      setError('Không thể tải danh sách khuyến mãi từ Promotion Service (:8084).');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode('');
    }, 2000);
  };

  // Thống kê số lượng theo loại
  const countAll = promotions.length;
  const countPercent = promotions.filter((p) => p.discountType === 'PERCENTAGE').length;
  const countFixed = promotions.filter((p) => p.discountType === 'FIXED_AMOUNT').length;

  // Lọc và sắp xếp voucher
  const filteredPromotions = useMemo(() => {
    let result = [...promotions];

    // 1. Lọc theo tab loại giảm giá
    if (discountTypeTab !== 'ALL') {
      result = result.filter((p) => p.discountType === discountTypeTab);
    }

    // 2. Lọc theo từ khóa (Mã code, Tên, Mô tả)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.code?.toLowerCase().includes(term) ||
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // 3. Lọc theo đơn hàng tối thiểu
    const range = MIN_ORDER_RANGES.find((r) => r.id === selectedMinOrderRange);
    if (range && range.id !== 'all') {
      result = result.filter((p) => {
        const minOrder = Number(p.minOrderValue) || 0;
        if (range.id === 'zero') return minOrder === 0;
        return minOrder >= range.min && minOrder <= range.max;
      });
    }

    // 4. Sắp xếp
    if (sortBy === 'discount_desc') {
      result.sort((a, b) => (Number(b.discountValue) || 0) - (Number(a.discountValue) || 0));
    } else if (sortBy === 'discount_asc') {
      result.sort((a, b) => (Number(a.discountValue) || 0) - (Number(b.discountValue) || 0));
    } else if (sortBy === 'min_order_asc') {
      result.sort((a, b) => (Number(a.minOrderValue) || 0) - (Number(b.minOrderValue) || 0));
    } else if (sortBy === 'remaining_desc') {
      result.sort((a, b) => {
        const remA = Math.max(0, (a.usageLimit || 0) - (a.usedCount || 0));
        const remB = Math.max(0, (b.usageLimit || 0) - (b.usedCount || 0));
        return remB - remA;
      });
    }

    return result;
  }, [promotions, discountTypeTab, searchTerm, selectedMinOrderRange, sortBy]);

  const totalPages = Math.ceil(filteredPromotions.length / ITEMS_PER_PAGE) || 1;
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPromotions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPromotions, currentPage]);

  const hasActiveFilters =
    discountTypeTab !== 'ALL' ||
    searchTerm.trim() !== '' ||
    selectedMinOrderRange !== 'all' ||
    sortBy !== 'default';

  const resetFilters = () => {
    setDiscountTypeTab('ALL');
    setSearchTerm('');
    setSelectedMinOrderRange('all');
    setSortBy('default');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Trung tâm Ưu đãi & Voucher</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Kho Mã Giảm Giá Đang Kích Hoạt
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Hệ thống đang có <strong>{countAll}</strong> voucher ưu đãi. Sao chép mã voucher và nhập tại bước thanh toán để được giảm trực tiếp trên đơn hàng.
        </p>
      </div>

      {/* Quick Category Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200 space-x-1">
          <button
            onClick={() => setDiscountTypeTab('ALL')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              discountTypeTab === 'ALL'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tất cả</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
              {countAll}
            </span>
          </button>

          <button
            onClick={() => setDiscountTypeTab('PERCENTAGE')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              discountTypeTab === 'PERCENTAGE'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Percent className="w-4 h-4 text-purple-600" />
            <span>Giảm theo %</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-purple-100 text-purple-700 font-bold">
              {countPercent}
            </span>
          </button>

          <button
            onClick={() => setDiscountTypeTab('FIXED_AMOUNT')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              discountTypeTab === 'FIXED_AMOUNT'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Giảm tiền mặt</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-700 font-bold">
              {countFixed}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* 1. Tìm kiếm voucher */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nhập mã voucher (MEGA15, VIP...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Đơn tối thiểu */}
          <div className="relative">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedMinOrderRange}
              onChange={(e) => setSelectedMinOrderRange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 appearance-none cursor-pointer"
            >
              {MIN_ORDER_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sắp xếp */}
          <div className="relative">
            <ArrowUpDown className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Thống kê & Nút xóa lọc */}
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-xl">
              Tìm thấy <strong className="text-indigo-600">{filteredPromotions.length}</strong> voucher
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm text-gray-500">Đang đồng bộ dữ liệu từ Promotion Service...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
          <button
            onClick={loadPromotions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition"
          >
            Tải lại
          </button>
        </div>
      )}

      {/* No Vouchers Found State */}
      {!loading && !error && filteredPromotions.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-3xl">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">Chưa có voucher nào phù hợp với bộ lọc</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Hãy thử tìm từ khóa khác hoặc xóa bộ lọc để xem toàn bộ voucher.</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Voucher Cards Grid */}
      {!loading && !error && paginatedPromotions.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPromotions.map((promo) => {
            const isCopied = copiedCode === promo.code;
            const remainingUsage = Math.max(0, (promo.usageLimit || 0) - (promo.usedCount || 0));
            const isPercentage = promo.discountType === 'PERCENTAGE';

            return (
              <div
                key={promo.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition duration-200 relative flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Badge: Code & Copy Button */}
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${
                        isPercentage
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span className="font-mono font-bold text-sm tracking-wider">
                        {promo.code}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(promo.code)}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-700'
                      }`}
                      title="Sao chép mã vào clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chép mã</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Program Title & Value */}
                  <div className="my-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isPercentage ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPercentage ? 'Chiết khấu phần trăm' : 'Giảm tiền mặt trực tiếp'}
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1 mb-1">
                      {isPercentage
                        ? `Giảm ${promo.discountValue}%`
                        : `Giảm ${Number(promo.discountValue)?.toLocaleString('vi-VN')} đ`}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {promo.name ? `${promo.name} - ` : ''}
                      {promo.description}
                    </p>
                  </div>
                </div>

                {/* Conditions & Meta */}
                <div>
                  <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                    {isPercentage && promo.maxDiscountAmount && (
                      <div className="flex justify-between items-center">
                        <span>Mức giảm tối đa:</span>
                        <span className="font-bold text-gray-900">
                          {Number(promo.maxDiscountAmount)?.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>Đơn hàng tối thiểu:</span>
                      <span className="font-bold text-gray-900">
                        {Number(promo.minOrderValue) > 0
                          ? `${Number(promo.minOrderValue)?.toLocaleString('vi-VN')} đ`
                          : 'Không giới hạn (0đ)'}
                      </span>
                    </div>
                    {promo.usageLimit > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Lượt dùng còn lại:</span>
                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {remainingUsage} / {promo.usageLimit}
                        </span>
                      </div>
                    )}
                    {promo.endDate && (
                      <div className="flex justify-between items-center pt-1 text-[11px] text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Thời hạn áp dụng:</span>
                        </span>
                        <span>{new Date(promo.endDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <Link
                    to="/"
                    className="mt-5 w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-semibold text-center transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Dùng mã mua hàng ngay</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-gray-500">
              Hiển thị{' '}
              <strong className="text-gray-900">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredPromotions.length)}
              </strong>{' '}
              trong tổng số <strong className="text-gray-900">{filteredPromotions.length}</strong> voucher (Trang {currentPage}/{totalPages})
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const isGap = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {isGap && <span className="px-2 text-gray-400 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-xl text-xs font-semibold transition ${
                          currentPage === p
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Trang tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
    )}
    </div>
  );
};

export default PromotionsPage;

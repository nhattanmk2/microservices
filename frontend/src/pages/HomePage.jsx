import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import productApi from '../api/productApi';
import {
  ShoppingBag,
  Search,
  Sparkles,
  Tag,
  ArrowRight,
  PackageX,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Tv,
  Shirt,
  Home as HomeIcon,
  Layers,
} from 'lucide-react';

// Phân loại danh mục tự động dựa trên tên và mô tả sản phẩm
const getProductCategory = (p) => {
  const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
  if (/iphone|galaxy|xiaomi|pixel|phone|oppo|dien thoai|ipad|tablet/i.test(text)) return 'phone';
  if (/macbook|dell|thinkpad|asus|rog|hp|acer|laptop|pc|mac mini/i.test(text)) return 'laptop';
  if (/airpods|sony|bose|marshall|jbl|tai nghe|earbuds|headphone|am thanh/i.test(text)) return 'audio';
  if (/watch|garmin|dong ho|smartwatch/i.test(text)) return 'watch';
  if (/ultrasharp|oled|man hinh|monitor|tivi|tv/i.test(text)) return 'display';
  if (/nike|adidas|ao|quan|giay|balo|thoi trang/i.test(text)) return 'fashion';
  return 'home';
};

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: Layers },
  { id: 'phone', label: 'Điện thoại & Tablet', icon: Smartphone },
  { id: 'laptop', label: 'Laptop & Máy tính', icon: Laptop },
  { id: 'audio', label: 'Tai nghe & Âm thanh', icon: Headphones },
  { id: 'watch', label: 'Đồng hồ thông minh', icon: Watch },
  { id: 'display', label: 'Màn hình & TV', icon: Tv },
  { id: 'fashion', label: 'Thời trang & Giày', icon: Shirt },
  { id: 'home', label: 'Gia dụng & Đời sống', icon: HomeIcon },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá', min: 0, max: Infinity },
  { id: 'under_5m', label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { id: '5m_15m', label: 'Từ 5 - 15 triệu', min: 5000000, max: 15000000 },
  { id: '15m_30m', label: 'Từ 15 - 30 triệu', min: 15000000, max: 30000000 },
  { id: 'over_30m', label: 'Trên 30 triệu', min: 30000000, max: Infinity },
];

const STOCK_FILTERS = [
  { id: 'all', label: 'Tất cả trạng thái kho' },
  { id: 'in_stock', label: 'Chỉ sản phẩm còn hàng' },
  { id: 'out_of_stock', label: 'Sản phẩm tạm hết hàng' },
];

const SORT_OPTIONS = [
  { id: 'default', label: 'Mới nhất / Mặc định' },
  { id: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { id: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { id: 'name_asc', label: 'Tên sản phẩm: A -> Z' },
  { id: 'name_desc', label: 'Tên sản phẩm: Z -> A' },
  { id: 'stock_desc', label: 'Tồn kho: Nhiều nhất' },
];

const ITEMS_PER_PAGE = 16;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAllProducts();
      setProducts(data || []);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm. Hãy kiểm tra xem Gateway (:8080) và Product Service (:8082) đã chạy chưa.');
    } finally {
      setLoading(false);
    }
  };

  // Reset về trang 1 mỗi khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedPriceRange, selectedStockFilter, sortBy]);

  // Lọc và sắp xếp sản phẩm
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Lọc theo từ khóa (tên, mô tả, ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          String(p.id).includes(term)
      );
    }

    // 2. Lọc theo danh mục
    if (selectedCategory !== 'all') {
      result = result.filter((p) => getProductCategory(p) === selectedCategory);
    }

    // 3. Lọc theo khoảng giá
    const range = PRICE_RANGES.find((r) => r.id === selectedPriceRange);
    if (range && range.id !== 'all') {
      result = result.filter((p) => {
        const price = Number(p.price) || 0;
        return price >= range.min && price <= range.max;
      });
    }

    // 4. Lọc theo trạng thái tồn kho
    if (selectedStockFilter === 'in_stock') {
      result = result.filter((p) => Number(p.stock ?? p.inventory ?? 0) > 0);
    } else if (selectedStockFilter === 'out_of_stock') {
      result = result.filter((p) => Number(p.stock ?? p.inventory ?? 0) <= 0);
    }

    // 5. Sắp xếp
    if (sortBy === 'price_asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => Number(b.stock ?? b.inventory ?? 0) - Number(a.stock ?? a.inventory ?? 0));
    }

    return result;
  }, [products, searchTerm, selectedCategory, selectedPriceRange, selectedStockFilter, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedPriceRange !== 'all' ||
    selectedStockFilter !== 'all' ||
    sortBy !== 'default';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedStockFilter('all');
    setSortBy('default');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-8 sm:p-12 text-white mb-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Microservices E-Commerce</span>
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Mua sắm thông minh, ngập tràn ưu đãi voucher
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mb-6">
            Hệ thống kiến trúc phân tán kết nối Auth, Product, Order và Promotion Service với khả năng trừ tồn kho thời gian thực và tự động hoàn trả.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/promotions"
              className="inline-flex items-center space-x-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow"
            >
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>Săn mã giảm giá ngay (50 voucher)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center space-x-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition shadow-sm ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Filter, Search & Sort Control Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* 1. Tìm kiếm theo tên / mô tả / mã ID */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, ID..."
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

          {/* 2. Khoảng giá */}
          <div className="relative">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 appearance-none cursor-pointer"
            >
              {PRICE_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Lọc theo Tồn kho */}
          <div className="relative">
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 appearance-none cursor-pointer"
            >
              {STOCK_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Sắp xếp */}
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

          {/* 5. Thống kê & Nút xóa lọc */}
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-xl">
              Tìm thấy <strong className="text-indigo-600">{filteredProducts.length}</strong>
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

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm text-gray-500">Đang đồng bộ dữ liệu từ Product Service...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center my-6 max-w-xl mx-auto">
          <p className="font-semibold text-base mb-2">Đã xảy ra lỗi</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadProducts}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {/* No Products Found State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-3xl">
          <PackageX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">Chưa có sản phẩm nào phù hợp với bộ lọc</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Hãy thử chọn mức giá khác, đổi danh mục hoặc xóa bộ lọc.</p>
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

      {/* Products Grid */}
      {!loading && !error && paginatedProducts.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((p) => {
              const category = getProductCategory(p);
              const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label || 'Sản phẩm';
              const stock = Number(p.stock ?? p.inventory ?? 0);
              const hasStock = stock > 0;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition duration-200 group flex flex-col justify-between"
                >
                  {/* Product Card Top */}
                  <div>
                    <div className="h-44 bg-gradient-to-tr from-gray-100 via-indigo-50/40 to-purple-50/40 flex items-center justify-center relative p-4 group-hover:scale-[1.02] transition duration-300">
                      <div className="w-20 h-20 bg-white/90 rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                        <ShoppingBag className="w-10 h-10" />
                      </div>
                      <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-600 shadow-sm">
                        {categoryLabel}
                      </span>
                      <span
                        className={`absolute top-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          hasStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {hasStock ? `Còn ${stock} cái` : 'Hết hàng'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition text-base line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description || 'Sản phẩm chính hãng với tiêu chuẩn chất lượng cao và bảo hành đầy đủ.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom: Price & Button */}
                  <div className="p-5 pt-0">
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-gray-400 block font-medium">Giá bán niêm yết</span>
                        <span className="text-lg font-extrabold text-indigo-600">
                          {Number(p.price)?.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <Link
                        to={`/products/${p.id}`}
                        className="inline-flex items-center space-x-1 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-semibold transition"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                </strong>{' '}
                trong tổng số <strong className="text-gray-900">{filteredProducts.length}</strong> sản phẩm (Trang {currentPage}/{totalPages})
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

export default HomePage;

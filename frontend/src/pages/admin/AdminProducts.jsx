import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import productApi from '../../api/productApi';
import {
  ShoppingBag,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  PackageMinus,
  PackageX,
} from 'lucide-react';

const STOCK_FILTERS = [
  { id: 'all', label: 'Tất cả trạng thái kho' },
  { id: 'in_stock', label: 'Còn hàng (> 10 cái)' },
  { id: 'low_stock', label: 'Sắp hết hàng (1 - 10 cái)' },
  { id: 'out_of_stock', label: 'Hết hàng (0 cái)' },
];

const PRICE_FILTERS = [
  { id: 'all', label: 'Tất cả mức giá', min: 0, max: Infinity },
  { id: 'under_5m', label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { id: '5m_15m', label: 'Từ 5 - 15 triệu', min: 5000000, max: 15000000 },
  { id: '15m_30m', label: 'Từ 15 - 30 triệu', min: 15000000, max: 30000000 },
  { id: 'over_30m', label: 'Trên 30 triệu', min: 30000000, max: Infinity },
];

const SORT_OPTIONS = [
  { id: 'id_asc', label: 'Mã ID: Tăng dần (Mặc định)' },
  { id: 'id_desc', label: 'Mã ID: Giảm dần' },
  { id: 'price_desc', label: 'Giá: Cao -> Thấp' },
  { id: 'price_asc', label: 'Giá: Thấp -> Cao' },
  { id: 'stock_desc', label: 'Tồn kho: Nhiều nhất' },
  { id: 'stock_asc', label: 'Tồn kho: Ít nhất' },
  { id: 'name_asc', label: 'Tên: A -> Z' },
];

const ITEMS_PER_PAGE = 15;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bộ lọc states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id_asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '100', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productApi.getAllProducts();
      setProducts(data || []);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm từ Product Service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStockFilter, selectedPriceFilter, sortBy]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setError('');

    try {
      const stockVal = parseInt(newProduct.stock, 10) || 0;
      const payload = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description.trim(),
        stock: stockVal,
        inventory: stockVal,
      };

      const created = await productApi.createProduct(payload);
      setSuccessMsg(`Thêm thành công sản phẩm "${created.name}" (ID #${created.id}, Tồn kho: ${stockVal})!`);
      setIsModalOpen(false);
      setNewProduct({ name: '', price: '', stock: '100', description: '' });
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo sản phẩm';
      alert(`Không thể tạo sản phẩm: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          String(p.id).includes(term)
      );
    }

    // 2. Stock Filter
    if (selectedStockFilter === 'in_stock') {
      result = result.filter((p) => Number(p.stock ?? p.inventory ?? 0) > 10);
    } else if (selectedStockFilter === 'low_stock') {
      result = result.filter((p) => {
        const s = Number(p.stock ?? p.inventory ?? 0);
        return s > 0 && s <= 10;
      });
    } else if (selectedStockFilter === 'out_of_stock') {
      result = result.filter((p) => Number(p.stock ?? p.inventory ?? 0) <= 0);
    }

    // 3. Price Filter
    const range = PRICE_FILTERS.find((r) => r.id === selectedPriceFilter);
    if (range && range.id !== 'all') {
      result = result.filter((p) => {
        const price = Number(p.price) || 0;
        return price >= range.min && price <= range.max;
      });
    }

    // 4. Sort
    if (sortBy === 'id_asc') {
      result.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortBy === 'id_desc') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => Number(b.stock ?? b.inventory ?? 0) - Number(a.stock ?? a.inventory ?? 0));
    } else if (sortBy === 'stock_asc') {
      result.sort((a, b) => Number(a.stock ?? a.inventory ?? 0) - Number(b.stock ?? b.inventory ?? 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [products, searchTerm, selectedStockFilter, selectedPriceFilter, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedStockFilter !== 'all' ||
    selectedPriceFilter !== 'all' ||
    sortBy !== 'id_asc';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStockFilter('all');
    setSelectedPriceFilter('all');
    setSortBy('id_asc');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Dashboard Quản trị</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Quản lý Sản phẩm</h1>
          <p className="text-sm text-gray-500">Xem danh sách, kiểm tra tồn kho và thêm mới sản phẩm vào Product Service</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadProducts}
            className="p-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-sm"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Control & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* 1. Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
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

          {/* 2. Stock Filter */}
          <div className="relative">
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 cursor-pointer"
            >
              {STOCK_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Price Filter */}
          <div className="relative">
            <select
              value={selectedPriceFilter}
              onChange={(e) => setSelectedPriceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 cursor-pointer"
            >
              {PRICE_FILTERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Sort Options */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Results Counter & Reset */}
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-xl">
              Tổng <strong className="text-indigo-600">{filteredProducts.length}</strong>
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

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Tên sản phẩm</th>
                <th className="px-6 py-4">Giá bán</th>
                <th className="px-6 py-4">Tồn kho</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span>Đang tải danh sách sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const stock = Number(p.stock ?? p.inventory ?? 0);
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= 10;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-mono font-medium text-gray-500">#{p.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div>{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-gray-400 font-normal line-clamp-1 mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-600">
                        {Number(p.price)?.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOutOfStock ? (
                            <>
                              <PackageX className="w-3.5 h-3.5" />
                              <span>Hết hàng</span>
                            </>
                          ) : isLowStock ? (
                            <>
                              <PackageMinus className="w-3.5 h-3.5" />
                              <span>Sắp hết: {stock} cái</span>
                            </>
                          ) : (
                            <>
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Còn {stock} cái</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/products/${p.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                        >
                          Xem chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Hiển thị{' '}
              <strong>
                {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
              </strong>{' '}
              trong tổng số <strong>{filteredProducts.length}</strong> sản phẩm (Trang {currentPage}/{totalPages})
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                        className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
                          currentPage === p
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-white border border-gray-200'
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
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Thêm sản phẩm mới</h3>
                <p className="text-xs text-gray-500">Tạo mặt hàng mới trong hệ thống kho</p>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: iPhone 16 Pro Max 256GB"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows="2"
                  placeholder="Thông số kĩ thuật, màu sắc, bảo hành..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giá bán (VND) *</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    placeholder="25000000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số lượng kho *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="100"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

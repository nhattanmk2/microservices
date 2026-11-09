import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import promotionApi from '../../api/promotionApi';
import { Ticket, Plus, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, X, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderValue: '0',
    usageLimit: '100',
    limitPerUser: '1',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await promotionApi.getActivePromotions();
      setPromotions(data || []);
    } catch (err) {
      setError('Không thể tải danh sách khuyến mãi từ Promotion Service (:8084).');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (promo) => {
    const nextStatus = !promo.isActive;
    setTogglingId(promo.id);
    setSuccessMsg('');

    try {
      const updated = await promotionApi.toggleStatus(promo.id, nextStatus);
      setSuccessMsg(`Đã ${nextStatus ? 'bật' : 'tắt'} kích hoạt mã voucher "${promo.code}"!`);
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: nextStatus } : p))
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái';
      alert(`Không thể thay đổi trạng thái: ${msg}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setError('');

    try {
      const payload = {
        code: newPromo.code.trim().toUpperCase(),
        name: newPromo.name.trim() || newPromo.code.trim().toUpperCase(),
        description: newPromo.description.trim(),
        discountType: newPromo.discountType,
        discountValue: parseFloat(newPromo.discountValue),
        maxDiscountAmount: newPromo.maxDiscountAmount ? parseFloat(newPromo.maxDiscountAmount) : null,
        minOrderValue: parseFloat(newPromo.minOrderValue || '0'),
        usageLimit: parseInt(newPromo.usageLimit, 10),
        limitPerUser: parseInt(newPromo.limitPerUser, 10),
        startDate: newPromo.startDate ? `${newPromo.startDate}:00` : null,
        endDate: newPromo.endDate ? `${newPromo.endDate}:00` : null,
      };

      const created = await promotionApi.createPromotion(payload);
      setSuccessMsg(`Tạo mới voucher "${created.code}" thành công!`);
      setIsModalOpen(false);
      loadPromotions();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo khuyến mãi';
      alert(`Không thể tạo voucher: ${msg}`);
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Quản lý Khuyến mãi</h1>
          <p className="text-sm text-gray-500">Tạo mã voucher, cấu hình điều kiện và bật/tắt kích hoạt</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadPromotions}
            className="p-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-sm"
            title="Tải lại"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Voucher mới</span>
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 font-bold text-gray-500 uppercase text-xs">Mã Code</th>
                <th className="px-6 py-3.5 font-bold text-gray-500 uppercase text-xs">Mô tả</th>
                <th className="px-6 py-3.5 font-bold text-gray-500 uppercase text-xs">Mức giảm</th>
                <th className="px-6 py-3.5 font-bold text-gray-500 uppercase text-xs">Đơn tối thiểu</th>
                <th className="px-6 py-3.5 font-bold text-gray-500 uppercase text-xs">Lượt dùng</th>
                <th className="px-6 py-3.5 font-bold text-gray-500 uppercase text-xs">Trạng thái</th>
                <th className="px-6 py-3.5 font-bold text-gray-500 uppercase text-xs text-right">Bật/Tắt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Chưa có khuyến mãi nào. Nhấn "Tạo Voucher mới" để thêm.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const active = p.isActive !== false;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-purple-700">
                        {p.code}
                      </td>
                      <td className="px-6 py-4 text-gray-800 text-xs max-w-xs truncate">
                        {p.description || p.name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {p.discountType === 'PERCENTAGE'
                          ? `Giảm ${p.discountValue}%`
                          : `Giảm ${p.discountValue?.toLocaleString('vi-VN')} đ`}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {p.minOrderValue > 0 ? `${p.minOrderValue?.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-semibold text-gray-800">{p.usedCount || 0}</span>
                        <span className="text-gray-400"> / {p.usageLimit || '∞'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {active ? 'Đang kích hoạt' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          disabled={togglingId === p.id}
                          className="text-gray-400 hover:text-purple-600 transition disabled:opacity-50"
                          title={active ? 'Tắt kích hoạt' : 'Bật kích hoạt'}
                        >
                          {active ? (
                            <ToggleRight className="w-7 h-7 text-emerald-600 inline" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-gray-300 inline" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Promotion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Tạo mã Voucher mới</h2>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Mã Voucher
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: MEGA2026"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Loại giảm giá
                  </label>
                  <select
                    value={newPromo.discountType}
                    onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (VND)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Mô tả chương trình
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giảm 20% cho đơn hàng đầu tiên"
                  value={newPromo.description}
                  onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Giá trị giảm ({newPromo.discountType === 'PERCENTAGE' ? '%' : 'VND'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={newPromo.discountType === 'PERCENTAGE' ? '20' : '50000'}
                    value={newPromo.discountValue}
                    onChange={(e) => setNewPromo({ ...newPromo, discountValue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Giảm tối đa (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Không bắt buộc"
                    value={newPromo.maxDiscountAmount}
                    onChange={(e) => setNewPromo({ ...newPromo, maxDiscountAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Đơn tối thiểu
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPromo.minOrderValue}
                    onChange={(e) => setNewPromo({ ...newPromo, minOrderValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Tổng lượt dùng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPromo.usageLimit}
                    onChange={(e) => setNewPromo({ ...newPromo, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Lượt / User
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPromo.limitPerUser}
                    onChange={(e) => setNewPromo({ ...newPromo, limitPerUser: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;


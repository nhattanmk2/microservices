import axiosClient from './axiosClient';

const promotionApi = {
  getActivePromotions: async () => {
    const response = await axiosClient.get('/api/promotions');
    return response.data;
  },

  getPromotionByCode: async (code) => {
    const response = await axiosClient.get(`/api/promotions/${code}`);
    return response.data;
  },

  getForProduct: async (productId) => {
    const response = await axiosClient.get(`/api/promotions/product/${productId}`);
    return response.data;
  },

  applyPromotion: async (applyData) => {
    // applyData: { promotionCode, orderAmount, items, buyerUsername }
    const response = await axiosClient.post('/api/promotions/apply', applyData);
    return response.data;
  },

  createPromotion: async (promoData) => {
    // promoData: { code, description, discountType, discountValue, maxDiscountAmount, minOrderValue, usageLimit, perUserLimit, startDate, endDate, applicableProductIds }
    const response = await axiosClient.post('/api/promotions', promoData);
    return response.data;
  },

  toggleStatus: async (id, active) => {
    const response = await axiosClient.patch(`/api/promotions/${id}/status?active=${active}`);
    return response.data;
  },
};

export default promotionApi;


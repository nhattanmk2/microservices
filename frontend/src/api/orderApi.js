import axiosClient from './axiosClient';

const orderApi = {
  createOrder: async ({ productId, quantity, promotionCode }) => {
    let url = `/api/orders?productId=${productId}&quantity=${quantity}`;
    if (promotionCode) {
      url += `&promotionCode=${encodeURIComponent(promotionCode)}`;
    }
    const response = await axiosClient.post(url);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await axiosClient.get('/api/orders/my-orders');
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await axiosClient.get(`/api/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await axiosClient.post(`/api/orders/${id}/cancel`);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await axiosClient.get('/api/orders');
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await axiosClient.put(`/api/orders/${id}/status`, { status });
    return response.data;
  },
};

export default orderApi;


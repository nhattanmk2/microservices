import axiosClient from './axiosClient';

const productApi = {
  getAllProducts: async () => {
    const response = await axiosClient.get('/api/products');
    return response.data;
  },

  getProductById: async (id) => {
    const response = await axiosClient.get(`/api/products/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    // productData: { name, price, inventory }
    const response = await axiosClient.post('/api/products', productData);
    return response.data;
  },

  checkAuth: async () => {
    const response = await axiosClient.get('/api/products/check-auth');
    return response.data;
  },
};

export default productApi;


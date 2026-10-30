import api from './api';

export const getFavorites = async () => {
  const response = await api.get('/favorites');
  // api interceptor đã trả về response body, nên danh sách nằm ở response.data.
  // Giữ fallback để service vẫn hoạt động nếu interceptor trả về Axios response.
  const favorites = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : response?.data?.data;
  return Array.isArray(favorites) ? favorites : [];
};

export const addFavorite = async (facilityId) => {
  const response = await api.post('/favorites', { facilityId });
  return response.data;
};

export const removeFavorite = async (facilityId) => {
  const response = await api.delete(`/favorites/${facilityId}`);
  return response.data;
};

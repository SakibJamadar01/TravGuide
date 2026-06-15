import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getGuides = async (city = '') => {
    const url = city ? `/guides/search?city=${city}` : '/guides';
    const response = await api.get(url);
    return response.data;
};

export const getGuideByEmail = async (email) => {
    const response = await api.get(`/guides/by-email?email=${encodeURIComponent(email)}`);
    return response.data;
};

export const createGuide = async (guideData) => {
    const response = await api.post('/guides', guideData);
    return response.data;
};

export const uploadIdProof = async (guideId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/guides/${guideId}/upload-id`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const uploadSelfie = async (guideId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/guides/${guideId}/upload-selfie`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export default api;

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

export const createGuide = async (guideData) => {
    const response = await api.post('/guides', guideData);
    return response.data;
};

export default api;

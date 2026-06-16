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

export const updateGuide = async (guideId, guideData) => {
    const response = await api.put(`/guides/${guideId}`, guideData);
    return response.data;
};

export const createVerificationSession = async (guideId) => {
    const response = await api.post('/verification/session', { guideId });
    return response.data;
};

export const getVerificationStatus = async (guideId) => {
    const response = await api.get(`/verification/status/${guideId}`);
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

export const resetVerification = async (guideId) => {
    const response = await api.post('/verification/reset', { guideId });
    return response.data;
};

export const uploadProfilePicture = async (guideId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/guides/${guideId}/upload-profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const uploadGuidePost = async (guideId, files, location = '', caption = '', tags = '') => {
    const formData = new FormData();
    
    // Append multiple files
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    if (location) {
        formData.append('location', location);
    }
    if (caption) {
        formData.append('caption', caption);
    }
    if (tags) {
        formData.append('tags', tags);
    }
    const response = await axios.post(`${API_BASE_URL}/guides/${guideId}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getGuidePosts = async (guideId) => {
    const response = await api.get(`/guides/${guideId}/posts`);
    return response.data;
};

export const likeGuidePost = async (postId) => {
    const response = await api.post(`/guides/posts/${postId}/like`);
    return response.data;
};

export const uploadDestinationImages = async (guideId, files) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    const response = await axios.post(`${API_BASE_URL}/guides/${guideId}/upload-destination-images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteDestinationImage = async (guideId, fileName) => {
    const response = await api.delete(`/guides/${guideId}/destination-images?fileName=${encodeURIComponent(fileName)}`);
    return response.data;
};

export default api;

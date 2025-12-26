import axios from 'axios';

const API_URL = '/api';

export const api = {
  // ============================================
  // SERIES API
  // ============================================
  
  getAllSeries: async () => {
    const response = await axios.get(`${API_URL}/series`);
    return response.data;
  },

  getSeries: async (seriesId) => {
    const response = await axios.get(`${API_URL}/series/${seriesId}`);
    return response.data;
  },

  createSeries: async (data) => {
    const response = await axios.post(`${API_URL}/series`, data);
    return response.data;
  },

  updateSeries: async (seriesId, data) => {
    const response = await axios.put(`${API_URL}/series/${seriesId}`, data);
    return response.data;
  },

  deleteSeries: async (seriesId) => {
    const response = await axios.delete(`${API_URL}/series/${seriesId}`);
    return response.data;
  },

  uploadSeriesThumbnail: async (seriesId, file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    const response = await axios.post(
      `${API_URL}/series/${seriesId}/upload/thumbnail`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  getSeriesThumbnailUrl: (urlOrFilename) => {
    if (!urlOrFilename) return null;
    // If it's already a full URL (S3), return as-is
    if (urlOrFilename.startsWith('http')) return urlOrFilename;
    // Legacy local path
    return `/uploads/series-thumbnails/${urlOrFilename}`;
  },

  // ============================================
  // EPISODE API (with series context)
  // ============================================

  uploadThumbnail: async (seriesId, episodeIndex, file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    const response = await axios.post(
      `${API_URL}/series/${seriesId}/upload/thumbnail/${episodeIndex}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  uploadMedia: async (seriesId, episodeIndex, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('media', file));
    const response = await axios.post(
      `${API_URL}/series/${seriesId}/upload/media/${episodeIndex}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  uploadMusic: async (seriesId, episodeIndex, file) => {
    const formData = new FormData();
    formData.append('music', file);
    const response = await axios.post(
      `${API_URL}/series/${seriesId}/upload/music/${episodeIndex}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteMedia: async (seriesId, episodeIndex, mediaId) => {
    const response = await axios.delete(`${API_URL}/series/${seriesId}/media/${episodeIndex}/${mediaId}`);
    return response.data;
  },

  deleteMusic: async (seriesId, episodeIndex) => {
    const response = await axios.delete(`${API_URL}/series/${seriesId}/music/${episodeIndex}`);
    return response.data;
  },

  reorderMedia: async (seriesId, episodeIndex, mediaIds) => {
    const response = await axios.post(`${API_URL}/series/${seriesId}/media/${episodeIndex}/reorder`, { mediaIds });
    return response.data;
  },

  getThumbnailUrl: (urlOrFilename) => {
    if (!urlOrFilename) return null;
    // If it's already a full URL (S3), return as-is
    if (urlOrFilename.startsWith('http')) return urlOrFilename;
    // Legacy local path
    return `/uploads/thumbnails/${urlOrFilename}`;
  },

  getMediaUrl: (urlOrFilename) => {
    if (!urlOrFilename) return null;
    // If it's already a full URL (S3), return as-is
    if (urlOrFilename.startsWith('http')) return urlOrFilename;
    // Legacy local path
    return `/uploads/media/${urlOrFilename}`;
  },

  getMusicUrl: (urlOrFilename) => {
    if (!urlOrFilename) return null;
    // If it's already a full URL (S3), return as-is
    if (urlOrFilename.startsWith('http')) return urlOrFilename;
    // Legacy local path
    return `/uploads/music/${urlOrFilename}`;
  },

  // ============================================
  // LEGACY API (for backward compatibility)
  // ============================================

  getShow: async () => {
    const response = await axios.get(`${API_URL}/show`);
    return response.data;
  },

  saveShow: async (data) => {
    const response = await axios.post(`${API_URL}/show`, data);
    return response.data;
  }
};

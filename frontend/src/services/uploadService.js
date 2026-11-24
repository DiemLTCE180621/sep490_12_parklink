import api from './api';

const uploadService = {
  uploadFiles: async (filesArray, tokenOrFolder = 'chat', folderName) => {
    let selectedFolder = folderName;
    if (!selectedFolder) {
      if (typeof tokenOrFolder === 'string' && tokenOrFolder && !tokenOrFolder.startsWith('ey')) {
        selectedFolder = tokenOrFolder;
      } else {
        selectedFolder = 'chat';
      }
    }

    const formData = new FormData();
    filesArray.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/uploads?folder=${encodeURIComponent(selectedFolder)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  uploadSingle: async (file, folder = 'parking-facilities') => {
    const res = await uploadService.uploadFiles([file], folder);
    const urls = res?.data?.mediaUrls || res?.mediaUrls || [];
    const url = urls[0] || '';
    return {
      data: {
        secure_url: url,
        url,
        mediaUrls: urls,
      },
    };
  },
};

export default uploadService;

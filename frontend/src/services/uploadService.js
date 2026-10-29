import api from './api';

const uploadService = {
    uploadFiles: async (filesArray, _tokenOrFolder = 'chat', folderName) => {
        const selectedFolder = folderName || (
            _tokenOrFolder === 'complaints' ? 'complaints' : 'chat'
        );
        const formData = new FormData();
        filesArray.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post(`/uploads?folder=${encodeURIComponent(selectedFolder)}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    }
};

export default uploadService;

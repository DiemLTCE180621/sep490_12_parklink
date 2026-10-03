import axios from 'axios';

const API_URL = 'http://localhost:5000/api/uploads';

const uploadService = {
    // Upload nhiều file (tối đa 4 file)
    uploadFiles: async (filesArray, token) => {
        const formData = new FormData();
        filesArray.forEach(file => {
            formData.append('files', file); // Chú ý key 'files' phải khớp với backend upload.array('files')
        });

        const response = await axios.post(API_URL, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data; // Trả về { success: true, data: { mediaUrls: [...] } }
    }
};

export default uploadService;

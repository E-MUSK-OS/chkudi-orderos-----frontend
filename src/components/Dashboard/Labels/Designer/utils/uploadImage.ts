import axiosInstance from "@/services/axios";

export const uploadImageToServer = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/media/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.secure_url;
};

// Kept for backward compatibility in imports if needed, but redirects to local
export const uploadImageToCloudinary = uploadImageToServer;

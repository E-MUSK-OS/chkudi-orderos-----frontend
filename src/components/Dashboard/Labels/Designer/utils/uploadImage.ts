import axiosInstance from "@/services/axios";
import axios from "axios";

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  // We reuse the VMS signature endpoint to get a signed payload
  // In a real app we might have a dedicated label images signature endpoint
  const publicId = `label_img_${Date.now()}`;
  const response = await axiosInstance.post("/vms/signature", { publicId });
  const signature = response.data.data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("public_id", signature.publicId);
  formData.append("folder", signature.folder);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("overwrite", String(signature.overwrite));
  formData.append("signature", signature.signature);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    formData
  );

  return res.data.secure_url;
};

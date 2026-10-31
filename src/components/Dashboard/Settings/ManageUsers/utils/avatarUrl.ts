/**
 * Resolves an avatar value (which can be a NAS URL like /mnt/qnap-vms/user-profile-image/...)
 * into a valid browser-loadable HTTP URL.
 */
export const getAvatarUrl = (avatar?: string | null): string => {
  if (!avatar) return "";

  // If already an absolute HTTP, blob, or data URL
  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("blob:") ||
    avatar.startsWith("data:")
  ) {
    return avatar;
  }

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    rawApiUrl.replace(/\/api\/v1\/?$/, "") ||
    "";

  // Normalize backslashes (Windows UNC paths) to forward slashes
  const normalized = avatar.replace(/\\/g, "/");

  // If stored as NAS path: /mnt/qnap-vms/user-profile-image/<userFolder>/<fileName>
  const match = normalized.match(/user-profile-image\/(.+)$/);
  if (match) {
    return `${baseUrl}/uploads/user-profile-image/${match[1]}`;
  }

  return `${baseUrl}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
};


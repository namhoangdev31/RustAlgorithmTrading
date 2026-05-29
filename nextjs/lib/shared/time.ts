export function formatRelativeTime(dateInput: Date | string | null | undefined, locale: string = "en") {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const isVi = locale === "vi";

  if (diffInSeconds < 60) return isVi ? "Vừa xong" : "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return isVi ? `${diffInMinutes} phút trước` : `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return isVi ? `${diffInHours} giờ trước` : `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return isVi ? `${diffInDays} ngày trước` : `${diffInDays}d ago`;

  return date.toLocaleDateString(isVi ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

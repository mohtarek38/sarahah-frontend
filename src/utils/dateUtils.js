/**
 * Format a timestamp into a relative time string
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} Formatted relative time string
 */
export const getRelativeTime = (timestamp) => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInMs = now - messageDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour - show minutes
  if (diffInMinutes < 60) {
    if (diffInMinutes === 0) return "Just now";
    if (diffInMinutes === 1) return "Sent 1 minute ago";
    return `Sent ${diffInMinutes} minutes ago`;
  }

  // Less than 24 hours - show hours
  if (diffInHours < 24) {
    if (diffInHours === 1) return "Sent 1 hour ago";
    return `Sent ${diffInHours} hours ago`;
  }

  // Less than 7 days - show days
  if (diffInDays < 7) {
    if (diffInDays === 1) return "Sent 1 day ago";
    return `Sent ${diffInDays} days ago`;
  }

  // 7 days or more - show the actual date
  return `On ${messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: messageDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })}`;
};

/**
 * Format a date for profile join date display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatJoinDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const getAvatarUrl = (user) => {
  if (user?.avatar_url && user.avatar_url.trim()) {
    return user.avatar_url;
  }
  const seed = encodeURIComponent(user?.full_name || user?.email || "User");
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
};

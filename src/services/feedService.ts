import { supabase } from "../lib/supabase"

export async function loadFeed() {
  const { data, error } = await supabase
    .from("posts")
    .select(`id,
      user_id,
      caption,
      image_url,
      created_at,
      likes_count,
      comments_count,
      user:users(username, avatar_url, display_name, photo_url, xp, identity)`)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as any[]).map(post => ({
    ...post,
    user: Array.isArray(post.user) ? post.user[0] : post.user
  }))
}

import { supabase } from "../supabase"

export async function createPost(file: File, caption: string) {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) throw new Error("User not logged")

  const filePath = `${user.id}-${Date.now()}`

  const { error: uploadError } = await supabase.storage
    .from("posts")
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from("posts")
    .getPublicUrl(filePath)

  await supabase.from("posts").insert({
    user_id: user.id,
    image_url: data.publicUrl,
    caption,
    likes_count: 0,
    comments_count: 0
  })
}

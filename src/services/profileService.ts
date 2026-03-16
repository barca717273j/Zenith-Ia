import { supabase } from "../supabase"

export async function uploadAvatar(file: File){
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if(!user) return

  const path = `${user.id}-${Date.now()}`

  await supabase.storage
    .from("avatars")
    .upload(path,file)

  const { data: url } = supabase.storage
    .from("avatars")
    .getPublicUrl(path)

  await supabase
    .from("users")
    .upsert({
      id:user.id,
      avatar_url:url.publicUrl,
      photo_url:url.publicUrl
    })
}

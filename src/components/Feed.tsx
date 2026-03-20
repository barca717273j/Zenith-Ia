import { useEffect, useState } from "react"
import { loadFeed } from "../services/feedService"

export default function Feed(){
  const [posts,setPosts] = useState<any[]>([])

  useEffect(()=>{
    loadFeed().then(setPosts)
  },[])

  return(
    <div className="p-4 space-y-6">
      {Array.isArray(posts) && posts.map(post => (
        <div key={post.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
          {post.image_url && <img src={post.image_url} width="300" className="rounded-xl mb-4" />}
          <p className="text-white">{post.content}</p>
        </div>
      ))}
      {(!Array.isArray(posts) || posts.length === 0) && (
        <p className="text-white/40 text-center py-10">Nenhum post encontrado.</p>
      )}
    </div>
  )
}

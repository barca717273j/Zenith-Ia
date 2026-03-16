import { useEffect, useState } from "react"
import { loadFeed } from "../services/feedService"

export default function Feed(){
  const [posts,setPosts] = useState<any[]>([])

  useEffect(()=>{
    loadFeed().then(setPosts)
  },[])

  return(
    <div>
      {posts.map(post => (
        <div key={post.id}>
          <img src={post.image_url} width="300"/>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  )
}

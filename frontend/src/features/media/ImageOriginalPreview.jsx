// Admin-only — fetches a short-lived signed read URL for an original.
// Public/tablet must NEVER use this component.
import { useEffect, useState } from 'react'
import axios from 'axios'

export function ImageOriginalPreview({ objectPath, authToken, className }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!objectPath) return
    let cancelled = false
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL || '/api'}/media/original-url`, {
        params: { objectPath },
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(({ data }) => { if (!cancelled) setUrl(data.url) })
      .catch(() => { if (!cancelled) setUrl(null) })
    return () => { cancelled = true }
  }, [objectPath, authToken])

  if (!url) return null
  return <img src={url} alt="" className={className} />
}

export default ImageOriginalPreview

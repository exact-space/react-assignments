import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import "./App.css";

const API_URL = "https://picsum.photos/v2/list";
const PROXY_API_URL = "/picsum-api/v2/list"; // dev-server proxy (see vite.config.js)
const IMAGE_WIDTH = 200;
const TIMEOUT_MS = 8000;

// Fetch one page of photos. Tries picsum.photos directly, then the local proxy.
async function fetchPage(page) {
  for (const base of [API_URL, PROXY_API_URL]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}?page=${page}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (Array.isArray(data)) return data;
    } catch {
      // try the next source
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Couldn't reach picsum.photos. Check your internet connection or VPN.");
}

function Photo({ photo }) {
  const [likes, setLikes] = useState(0);
  // Reserve the image's space up front (keeps the scroll position stable while it loads).
  const height = Math.round((IMAGE_WIDTH * photo.height) / photo.width);

  return (
    <div className="photo">
      <img
        src={photo.download_url}
        alt={`Photo by ${photo.author}`}
        width={IMAGE_WIDTH}
        height={height}
        loading="lazy"
        onError={(e) => {
          // If the image can't load directly, retry once through the dev-server proxy.
          const img = e.currentTarget;
          if (img.dataset.retried) return;
          img.dataset.retried = "1";
          img.src = `/picsum-img/id/${photo.id}/${IMAGE_WIDTH * 2}/${height * 2}`;
        }}
      />
      <span className="author">Author: {photo.author}</span>
      <button
        className="like-btn"
        onClick={() => setLikes((n) => n + 1)}
        aria-label={`Like photo by ${photo.author}`}
      >
        <FontAwesomeIcon icon={faThumbsUp} />
      </button>
      <span className="like-count">{likes}</span>
    </div>
  );
}

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1); // next page to fetch
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadingRef = useRef(false); // guards against duplicate fetches (e.g. StrictMode, fast scrolling)
  const sentinelRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPage(page);
      if (data.length === 0) {
        setHasMore(false); // a page with no data: stop loading
      } else {
        // de-duplicate by id in case the same page is ever fetched twice
        setPhotos((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.filter((p) => !seen.has(p.id))];
        });
        setPage((p) => p + 1);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, hasMore]);

  // Infinite scroll: load the next page when the bottom sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !error) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, error, photos.length]);

  return (
    <div className="gallery">
      <h1>Photo gallery</h1>

      <div className="photo-list">
        {photos.map((photo) => (
          <Photo key={photo.id} photo={photo} />
        ))}
      </div>

      <div ref={sentinelRef} className="status">
        {loading && <p>Loading...</p>}
        {error && (
          <p className="error">
            {error}{" "}
            <button className="retry" onClick={loadMore}>
              Retry
            </button>
          </p>
        )}
        {!hasMore && photos.length > 0 && <p>You've reached the end.</p>}
      </div>
    </div>
  );
}

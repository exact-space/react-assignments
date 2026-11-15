import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const LIMIT = 10;
const TIMEOUT_MS = 10000;

function App() {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  // Sentinel ref for infinite scrolling
  const loaderRef = useRef(null);
  const loadingRef = useRef(false);
  loadingRef.current = loading;

  const fetchPhotos = useCallback(async (pageNum) => {
    if (loadingRef.current || !hasMore) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`https://picsum.photos/v2/list?page=${pageNum}&limit=${LIMIT}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors including Cloudflare 522
      if (!response.ok) {
        if (response.status === 522) {
          throw new Error('Picsum server connection timed out (Cloudflare Error 522).');
        }
        if (response.status >= 500) {
          throw new Error(`Picsum server error (${response.status}). Service temporarily unavailable.`);
        }
        throw new Error(`Failed to fetch photos: HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Picsum server returned an unexpected response (Service temporarily unavailable).');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setHasMore(false);
      } else {
        // Format each item with initial like count of 0
        const formattedPhotos = data.map((item) => ({
          id: item.id,
          author: item.author,
          // Use optimized Picsum URL for fast rendering with download_url fallback
          imageUrl: `https://picsum.photos/id/${item.id}/500/350`,
          originalUrl: item.download_url,
          likes: 0
        }));

        setPhotos((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newUnique = formattedPhotos.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newUnique];
        });

        if (data.length < LIMIT) {
          setHasMore(false);
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error fetching photos:', err);

      if (err.name === 'AbortError') {
        setError('Picsum API request timed out (Cloudflare Error 522 / Server Outage). Please try again.');
      } else {
        setError(err.message || 'Something went wrong while fetching photos.');
      }
    } finally {
      setLoading(false);
    }
  }, [hasMore]);

  // Initial fetch on mount
  useEffect(() => {
    fetchPhotos(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingRef.current && !error) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchPhotos(nextPage);
            return nextPage;
          });
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [fetchPhotos, hasMore, error]);

  // Increase like count on click
  const handleLike = (id) => {
    setPhotos((prevPhotos) =>
      prevPhotos.map((photo) =>
        photo.id === id ? { ...photo, likes: photo.likes + 1 } : photo
      )
    );
  };

  // Safe image error handling to avoid crashes
  const handleImageError = (id) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleRetry = () => {
    setError(null);
    fetchPhotos(page);
  };

  return (
    <div className="gallery-page">
      <header className="gallery-header-row">
        <h1 className="gallery-title">Photo gallery</h1>
      </header>

      {/* 1-Column list of articles matching photo-gallery.jpg */}
      <div className="gallery-list">
        {photos.map((photo) => (
          <div key={photo.id} className="gallery-item">
            <div className="gallery-image-box">
              {failedImages[photo.id] ? (
                <div className="gallery-placeholder" role="img" aria-label="Image unavailable">
                  <span>🖼️ Image unavailable</span>
                </div>
              ) : (
                <img
                  src={photo.imageUrl}
                  alt={`Photo by ${photo.author}`}
                  loading="lazy"
                  className="gallery-photo"
                  onError={() => handleImageError(photo.id)}
                />
              )}
            </div>

            <div className="gallery-info">
              <span className="author-text">Author: {photo.author}</span>
              <button
                type="button"
                className="thumbs-up-btn"
                onClick={() => handleLike(photo.id)}
                aria-label={`Like photo by ${photo.author}. Current likes: ${photo.likes}`}
              >
                <i className="fa-solid fa-thumbs-up thumbs-icon" aria-hidden="true"></i>
                <span className="like-count">{photo.likes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Initial load error state */}
      {error && photos.length === 0 && (
        <div className="gallery-error-banner">
          <p className="error-text">{error}</p>
          <button type="button" className="retry-action-btn" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Loading, pagination error, and infinite scroll sentinel */}
      <div ref={loaderRef} className="gallery-sentinel">
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Loading photos...</span>
          </div>
        )}

        {error && photos.length > 0 && (
          <div className="gallery-error-banner">
            <p className="error-text">{error}</p>
            <button type="button" className="retry-action-btn" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        {!hasMore && photos.length > 0 && (
          <div className="end-of-gallery">
            <p>No more photos to load.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

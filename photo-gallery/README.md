# Photo Gallery (React)

Single-page, one-column photo gallery with infinite scroll, built with React + Vite.

- Fetches paginated JSON from `https://picsum.photos/v2/list?page=N`.
- Shows each photo (`download_url`) with `Author: <author>`.
- When you reach the bottom of the page, the next page is fetched and appended. It stops when a page returns no data.
- Each photo has a Font Awesome thumbs-up icon with a count (starts at 0, +1 per click).

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Notes

- picsum.photos allows cross-origin requests, so it is called directly from the browser.
  If that fails or takes longer than 8 seconds, the app automatically retries through a
  dev-server proxy (`server.proxy` in `vite.config.js`). If both fail, an error with a Retry
  button is shown. Images that fail to load also fall back to the proxy.
- Font Awesome is installed from npm (`@fortawesome/react-fontawesome`).

import { Context } from "https://edge.netlify.com";

export default async (request, context) => {
  const headers = new Headers(request.headers);
  const userAgent = headers.get("User-Agent");

  if (userAgent && userAgent.match(/googlebot|bingbot|yandexbot|slurp|duckduckbot|baiduspider|facebot|ia_archiver|twitterbot|whatsapp/i)) {
    // If the user agent matches a crawler, modify the request to proxy to the prerender server
    const url = new URL(request.url);
    const pathname = url.pathname;
    const prerenderUrl = `https://prerender.irismessengers.wtf${pathname}`;
    const prerenderRequest = new Request(prerenderUrl, request);

    return fetch(prerenderRequest);
  } else {
    // If the user agent does not match a crawler, return the response from the original request
    const originalResponse = await fetch(request);

    return originalResponse;
  }
};
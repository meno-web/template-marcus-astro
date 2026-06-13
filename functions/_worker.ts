/**
 * Cloudflare Worker Entry Point
 * Routes /api/* to functions, everything else to static assets
 */

import { onRequestPost as sendEmail } from './api/send-email';

interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  TO_EMAIL: string;
  FROM_EMAIL?: string;
  EMAIL_SUBJECT?: string;
}

// Raw robots.txt content to bypass Cloudflare AI Audit injection
const ROBOTS_TXT = `User-agent: *
Allow: /

Sitemap: https://meno.so/sitemap.xml
`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Serve robots.txt directly to bypass Cloudflare managed content injection
    if (url.pathname === '/robots.txt') {
      return new Response(ROBOTS_TXT, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Route API requests
    if (url.pathname === '/api/send-email' && request.method === 'POST') {
      return sendEmail({
        request,
        env,
        params: {},
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: () => {},
      });
    }

    // Serve static assets for everything else
    const response = await env.ASSETS.fetch(request);

    // If asset not found, serve custom 404 page
    if (response.status === 404) {
      const notFoundUrl = new URL('/404.html', request.url);
      const notFoundResponse = await env.ASSETS.fetch(notFoundUrl);
      return new Response(notFoundResponse.body, {
        status: 404,
        headers: notFoundResponse.headers,
      });
    }

    return response;
  },
};

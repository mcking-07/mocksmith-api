import type { HandlerResponse } from '../types';

const responsify = (response: HandlerResponse) => {
  const status = response?.status ?? 200;
  const headers = new Headers(response?.headers ?? {});

  if (response?.body && typeof response?.body === 'object') {
    headers.set('content-type', 'application/json');
    const payload = JSON.stringify(response.body);

    return new Response(payload, { status, headers });
  }

  const payload = response?.body ? String(response.body) : null;
  return new Response(payload, { status, headers });
};

export { responsify };

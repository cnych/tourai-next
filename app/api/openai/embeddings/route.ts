import { fetchWithRetries } from "@/lib/request"
import {API} from "@/lib/config";

export async function POST(request: Request) {
  const response = await fetchWithRetries("https://api.d-id.com/talks/streams", {
    method: 'POST',
    headers: {
      Authorization: `Basic ${API.DID.API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: API.DID.AVATAR_IMAGE_URL,
    }),
  });

  if (response && response.ok) {
    const data = await response.json();
    return Response.json(data);
  }

  return Response.json({ error: 'Failed to create stream' }, { status: 500 });

}


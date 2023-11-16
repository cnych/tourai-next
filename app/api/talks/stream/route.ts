import { fetchWithRetries } from "@/lib/request"
import {DidAvatarUrl} from "@/lib/config";

export async function POST(request: Request) {
  const response = await fetchWithRetries("https://api.d-id.com/talks/streams", {
    method: 'POST',
    headers: {
      Authorization: `Basic ${process.env.DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: DidAvatarUrl,
    }),
  });

  if (response && response.ok) {
    const data = await response.json();
    return Response.json(data);
  }

  return Response.json({ error: 'Failed to create stream' }, { status: 500 });

  // {
  //   "id": "your_stream_id",
  //   "session_id": "your_session_id",
  //   "offer": "your_sdp_offer",
  //   "ice_servers": [
  //     {
  //       "urls": ["stun:stun.example.com"]
  //     }
  //   ]
  // }
}



export async function POST(request: Request) {
  const { streamId, sessionId, candidate, sdpMid, sdpMLineIndex } = await request.json()

  const iceResponse = await fetch(`https://api.d-id.com/talks/streams/${streamId}/ice`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${process.env.DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidate,
      sdpMid,
      sdpMLineIndex,
      session_id: sessionId,
    }),
  });

  if (iceResponse && iceResponse.ok) {
    const data = await iceResponse.json();
    return Response.json(data);
  }

  return Response.json({ error: 'Failed to ice candidate' }, { status: 500 });
}


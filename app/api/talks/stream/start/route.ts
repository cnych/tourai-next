
export async function POST(request: Request) {
  const { streamId, sessionId, answer } = await request.json()

  const sdpResponse = await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${process.env.DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: answer,
      session_id: sessionId,
    }),
  });

  if (sdpResponse && sdpResponse.ok) {
    const data = await sdpResponse.json();
    return Response.json(data);
  }

  return Response.json({ error: 'Failed to start stream' }, { status: 500 });
}


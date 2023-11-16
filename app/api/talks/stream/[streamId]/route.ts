import {fetchWithRetries} from "@/lib/request";
import {pineconeClient, queryPineconeVectorStoreAndQueryLLM} from "@/lib/llm";
import {PineconeIndexName} from "@/lib/config";


export async function POST(
  request: Request,
  { params }: { params: { streamId: string } }
) {
  const streamId = params.streamId
  const {input, sessionId} = await request.json()
  // const completion = await getAiChat("gpt-3.5-turbo", input)
  const text = await queryPineconeVectorStoreAndQueryLLM(pineconeClient, PineconeIndexName, input)

  const talkResponse = await fetchWithRetries(`https://api.d-id.com/talks/streams/${streamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${process.env.DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script: {
        type: 'text',
        subtitles: 'false',
        provider: {type: 'microsoft', voice_id: 'en-GB-RyanNeural'},
        input: text,
        ssml: 'false'
        // type: 'audio',
        // audio_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/webrtc.mp3',
      },
      driver_url: 'bank://lively/driver-06',
      config: {
        stitch: true,
      },
      session_id: sessionId,
    }),
  });

  if (talkResponse && talkResponse.ok) {
    const data = await talkResponse.json();
    return Response.json(data);
  }

  return Response.json({ error: 'Failed to talk' }, { status: 500 });
}


export async function DELETE(
  request: Request,
  { params }: { params: { streamId: string } }
) {
  const streamId = params.streamId
  const { sessionId} = await request.json()
  const res = await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({session_id: sessionId}),
  })

  if (res && res.ok) {
    const data = await res.json();
    return Response.json(data);
  }

  return Response.json({ error: 'Failed to delete talk' }, { status: 500 });

}
import {
  pineconeClient,
  queryPineconeVectorStoreAndQueryLLM,
} from '@/lib/llm'
import { PineconeIndexName } from '@/lib/config'

export async function POST(request: Request) {
  const body = await request.json()
  const text = await queryPineconeVectorStoreAndQueryLLM(pineconeClient, PineconeIndexName, body)
  return Response.json({
    data: text
  })
}

// export async function GET(request: Request) {
//   return Response.json({ code: 0, message: "Hello Next.js" }); // 默认http 响应状态码 为200
//   // 可通过第二参数进行设置，它是一个 ResponseInit 的参数类型
//   //   return NextResponse.json({ code: 0 }, { status: 500 });
// }


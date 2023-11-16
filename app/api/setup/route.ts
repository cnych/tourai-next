import { Pinecone } from '@pinecone-database/pinecone'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import {
  pineconeClient,
  createPineconeIndex,
  updatePinecone
} from '@/lib/llm'
import { PineconeIndexName } from '@/lib/config'

export async function GET(request: Request) {
  const loader = new DirectoryLoader('./documents', {
    ".txt": (path) => new TextLoader(path),
    ".md": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path)
  })

  const docs = await loader.load()
  const vectorDimensions = 1536

  try {
    await createPineconeIndex(pineconeClient, PineconeIndexName, vectorDimensions)
    await updatePinecone(pineconeClient, PineconeIndexName, docs)
  } catch (err) {
    console.log('error: ', err)
  }

  return Response.json({
    data: 'successfully created index and loaded data into pinecone...'
  })

}
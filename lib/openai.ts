import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

export async function getAiChat(model: string, input: string) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        "role": "assistant",
        "content": "Hello there, how may I assist you today?",
      },
      { role: 'user', content: input }],
    model: model,
  });
  return chatCompletion.choices[0].message.content;
}

export async function getEmbeddings(text: string) {
  const response = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-ada-002',
  })
  return response.data[0].embedding
}
//
// async function generateEmbeddings(): Promise<void> {
//   const data = await loadData();
//   const embeddings: { [key: string]: EmbeddingEntry } = {};
//
//   for (const row of data) {
//     const contentEmbedding = await getEmbeddings(row.content);
//     const chunkKey = `${row.postId}_${row.chunkId}`;
//     embeddings[chunkKey] = {
//       embeddings: contentEmbedding,
//       content: row.content,
//       url: row.url,
//       title: row.title,
//       publishDate: row.publishDate,
//       postId: row.postId,
//       chunkId: row.chunkId,
//     };
//     console.log('Saved embedding for post', row.postId, 'chunk', row.chunkId);
//     await new Promise((resolve) => setTimeout(resolve, 200)); // Add delay between requests
//   }
//
//   fs.writeFileSync('embeddings.json', JSON.stringify(embeddings));
//   console.log('Embeddings saved');
// }
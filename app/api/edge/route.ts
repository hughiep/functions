export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export function GET(request: Request) {
  console.log(`Request URL: ${request.url}`)
  return new Response(`Hello from ${process.env.VERCEL_REGION}`)
}

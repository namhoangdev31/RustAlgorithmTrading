import { NextRequest, NextResponse } from "next/server";
import { searchLepoShipMarketplace } from "@/lib/server/lepoship/marketplace-search";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await searchLepoShipMarketplace({
    query: params.get("q") || undefined,
    category: params.get("category") || undefined,
    locale: params.get("locale") || undefined,
    region: params.get("region") || request.headers.get("x-vercel-ip-country") || undefined,
    limit: Number(params.get("limit") || 20),
    offset: Number(params.get("offset") || 0),
  });
  return NextResponse.json(result, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

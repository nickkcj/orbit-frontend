import { NextRequest, NextResponse } from 'next/server'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'orbit.app.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const subdomain = extractSubdomain(host, BASE_DOMAIN)

  // Main domain - continue normally
  if (!subdomain) {
    return NextResponse.next()
  }

  // Subdomain detected - validate tenant
  try {
    const response = await fetch(`${API_URL}/api/v1/tenants/${subdomain}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      // Invalid tenant - rewrite to 404 page
      return NextResponse.rewrite(new URL('/tenant-not-found', request.url))
    }

    const tenant = await response.json()

    // Check tenant status
    if (tenant.status !== 'active') {
      return NextResponse.rewrite(new URL('/tenant-not-found', request.url))
    }

    // Valid tenant - add headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-slug', tenant.slug)
    requestHeaders.set('x-tenant-id', tenant.id)
    requestHeaders.set('x-tenant-name', tenant.name)

    // Rewrite to /c routes for subdomain requests
    const url = request.nextUrl.clone()
    url.pathname = `/c${url.pathname}`

    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Tenant validation error:', error)
    // On error, show 404 to be safe
    return NextResponse.rewrite(new URL('/tenant-not-found', request.url))
  }
}

function extractSubdomain(host: string, baseDomain: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0]

  // Handle localhost
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null
  }

  // Check if ends with base domain
  if (!hostWithoutPort.endsWith(baseDomain)) {
    return null
  }

  // Extract subdomain
  const subdomain = hostWithoutPort.replace(`.${baseDomain}`, '')

  // No subdomain or www
  if (!subdomain || subdomain === hostWithoutPort || subdomain === 'www') {
    return null
  }

  return subdomain
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - c (internal community routes - prevent infinite rewrite)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!api|_next/static|_next/image|c/|favicon.ico|images).*)',
  ],
}

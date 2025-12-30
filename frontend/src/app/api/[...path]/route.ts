import { NextRequest, NextResponse } from 'next/server';

// Runtime API proxy - works on Railway where NEXT_PUBLIC_API_URL is set at runtime
const getBackendUrl = () => {
  return process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path, 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(request: NextRequest, pathSegments: string[], method: string) {
  const backendUrl = getBackendUrl();
  const path = pathSegments.join('/');
  const url = `${backendUrl}/api/${path}`;
  
  // Get the search params
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${url}?${searchParams}` : url;
  
  console.log(`[API Proxy] ${method} ${fullUrl}`);
  
  try {
    // Prepare headers - forward most headers but not host
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.text();
        fetchOptions.body = body;
      } else {
        fetchOptions.body = await request.blob();
      }
    }
    
    const response = await fetch(fullUrl, fetchOptions);
    
    // Get response data
    const responseData = await response.text();
    
    // Create response with same status and headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[API Proxy] Error:`, error);
    return NextResponse.json(
      { error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    );
  }
}

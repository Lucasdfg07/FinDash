import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * WebSocket upgrade endpoint
 * GET /api/ws
 *
 * Clients should:
 * 1. Authenticate via NextAuth (get JWT token)
 * 2. Open WebSocket connection to this endpoint
 * 3. Send authorization header with token
 * 4. Subscribe to desired channels
 */

export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade?.toLowerCase() !== 'websocket') {
    return NextResponse.json(
      { error: 'WebSocket upgrade required' },
      { status: 400 }
    );
  }

  // Verify authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Extract token from header if available
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing authentication token' },
      { status: 401 }
    );
  }

  try {
    // Note: Actual WebSocket handling is done in server.ts
    // This route just validates authentication
    // The WebSocket upgrade happens at the server level

    const userId = (session.user as { id?: string } | undefined)?.id || 'default';
    return NextResponse.json(
      {
        message: 'WebSocket connection initiated',
        userId,
      },
      {
        status: 101,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
          'Sec-WebSocket-Accept': token,
        },
      }
    );
  } catch (error) {
    console.error('[WS] Error:', error);
    return NextResponse.json(
      { error: 'WebSocket connection failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ws/subscribe
 * Subscribe to real-time events (fallback for non-WebSocket environments)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { channels } = body;

    if (!Array.isArray(channels)) {
      return NextResponse.json(
        { error: 'channels must be an array' },
        { status: 400 }
      );
    }

    // Return subscription confirmation
    const userId = (session.user as { id?: string } | undefined)?.id || 'default';
    return NextResponse.json({
      success: true,
      userId,
      subscribed: channels,
      message:
        'Subscription setup. Use WebSocket for real-time updates or polling for fallback.',
    });
  } catch (error) {
    console.error('[WS] Subscription error:', error);
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 }
    );
  }
}

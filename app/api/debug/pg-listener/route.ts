import { NextResponse } from 'next/server';
import { isPgListenerConnected } from '@/lib/services/pgListener.service';

export async function GET() {
  try {
    const connected = isPgListenerConnected();
    return NextResponse.json({ connected });
  } catch (err) {
    return NextResponse.json({ connected: false, error: String(err) }, { status: 500 });
  }
}


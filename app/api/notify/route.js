// app/api/notify/route.js
import { NextResponse } from 'next/server';
import { sendTelegramNotification } from '../../../lib/telegram';

export async function POST(req) {
  try {
    const { type, data } = await req.json();
    await sendTelegramNotification(type, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
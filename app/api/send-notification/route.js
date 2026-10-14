import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Fungsi helper untuk membuat Google OAuth2 token dari serviceAccountKey.json secara mandiri
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: serviceAccount.token_uri,
    exp: expiry,
    iat: now
  })).toString('base64url');

  const unsignedToken = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');

  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const data = await res.json();
  return data.access_token;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, title, message, targetUrl } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'FCM Token wajib disertakan.' }, { status: 400 });
    }

    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      return NextResponse.json({ success: false, error: 'File serviceAccountKey.json tidak ditemukan.' }, { status: 500 });
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    const accessToken = await getAccessToken(serviceAccount);

    // Kirim notifikasi menggunakan FCM HTTP v1 API standar
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
    
    const fcmResponse = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: token,
          notification: {
            title: title || 'Harvest Agency',
            body: message || 'Pembaruan informasi penting.',
          },
          data: {
            targetUrl: targetUrl || '/',
          },
        },
      }),
    });

    const result = await fcmResponse.json();

    if (!fcmResponse.ok) {
      throw new Error(result.error?.message || 'Gagal mengirim via FCM REST API');
    }

    return NextResponse.json({
      success: true,
      message: 'Notifikasi berhasil dikirim via FCM REST API!',
      messageId: result.name,
    });
  } catch (error) {
    console.error('Error FCM REST:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
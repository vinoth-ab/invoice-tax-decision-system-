import { NextResponse } from 'next/server';
import { runApiSeed } from '@/scripts/seed-via-api.mjs';

export async function POST() {
  try {
    const res = await runApiSeed();
    return NextResponse.json({ success: true, message: 'Sample dataset seeded successfully into Supabase.' });
  } catch (error: any) {
    console.error('API seed error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

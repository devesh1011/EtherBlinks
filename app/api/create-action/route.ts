import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import crypto from 'crypto';

// Generate a short, readable ID
function generateShortId(): string {
  return crypto.randomBytes(8).toString('base64url').substring(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate short ID for the action
    const shortId = generateShortId();
    
    // Add the short ID to the action data
    const actionData = {
      ...body,
      short_id: shortId,
      created_at: new Date().toISOString()
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('actions')
      .insert([actionData])
      .select('id, short_id, action_type')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Generate the short URL
    const shortUrl = `${request.nextUrl.origin}/a/${data.action_type}-${data.short_id}`;

    return NextResponse.json({ 
      id: data.id, 
      short_id: data.short_id,
      short_url: shortUrl 
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
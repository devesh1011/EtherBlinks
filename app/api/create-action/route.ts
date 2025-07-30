import { NextResponse, NextRequest } from 'next/server';

import { supabase } from '@/lib/supabaseClient';



export async function POST(request: NextRequest) {

try {

const body = await request.json();


// Supabase is flexible and will only insert into the columns provided in the body object.

// This handles both 'tip' and 'nft_sale' actions automatically.

const { data, error } = await supabase

.from('actions')

.insert([body])

.select('id')

.single();



if (error) {

throw new Error(error.message);

}



return NextResponse.json({ id: data.id }, { status: 200 });

} catch (error: any) {

return NextResponse.json({ error: error.message }, { status: 500 });

}

}
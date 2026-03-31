import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (email !== 'hrga@imajin.id' || password !== 'admin123') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const user = existingUser.users.find(u => u.email === email);

  if (!user) {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !newUser.user) {
      return NextResponse.json({ error: error?.message }, { status: 400 });
    }

    await supabase.from('users').insert({
      id: newUser.user.id,
      email,
      role: 'admin',
    });

    return NextResponse.json({ message: 'Admin created successfully' });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || userData.role !== 'admin') {
    await supabase.from('users').upsert({
      id: user.id,
      email,
      role: 'admin',
    });
  }

  return NextResponse.json({ message: 'Admin verified' });
}
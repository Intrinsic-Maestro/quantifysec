import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CFODashboardClient from './CFODashboardClient';
import { DEFAULT_DATA } from '../sharedData';

export default async function CFODashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  let dashboardData = DEFAULT_DATA;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${API_URL}/api/run-pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      dashboardData = await res.json();
    } else {
      const fallback = await fetch(`${API_URL}/api/dashboard-data`, { cache: 'no-store' });
      if (fallback.ok) {
        dashboardData = await fallback.json();
      }
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data, using fallback", error);
  }

  return <CFODashboardClient data={dashboardData} />;
}
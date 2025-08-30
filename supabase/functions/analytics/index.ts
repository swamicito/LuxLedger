import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, ...data } = await req.json()

    switch (action) {
      case 'track_event':
        return await trackEvent(supabase, data)
      case 'get_dashboard_metrics':
        return await getDashboardMetrics(supabase)
      case 'get_asset_performance':
        return await getAssetPerformance(supabase)
      case 'get_user_engagement':
        return await getUserEngagement(supabase)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Analytics function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function trackEvent(supabase: any, data: any) {
  const { event_type, event_data, asset_id, session_id } = data

  // Get user IP and user agent from request
  const ip_address = data.ip_address || null
  const user_agent = data.user_agent || null

  const { data: result, error } = await supabase
    .from('analytics_events')
    .insert({
      event_type,
      event_data,
      asset_id,
      session_id,
      ip_address,
      user_agent,
      user_id: data.user_id || null
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDashboardMetrics(supabase: any) {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get new users this month
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo)

  // Get total assets
  const { count: totalAssets } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })

  // Get verified assets
  const { count: verifiedAssets } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .in('status', ['verified', 'tokenized', 'listed'])

  // Get total transactions
  const { count: totalTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })

  // Get transaction volume
  const { data: volumeData } = await supabase
    .from('transactions')
    .select('price')
    .eq('status', 'completed')

  const totalVolume = volumeData?.reduce((sum: number, t: any) => sum + parseFloat(t.price), 0) || 0

  // Get KYC stats
  const { count: pendingKyc } = await supabase
    .from('kyc_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: approvedKyc } = await supabase
    .from('kyc_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  return new Response(
    JSON.stringify({
      totalUsers: totalUsers || 0,
      newUsers: newUsers || 0,
      totalAssets: totalAssets || 0,
      verifiedAssets: verifiedAssets || 0,
      totalTransactions: totalTransactions || 0,
      totalVolume,
      pendingKyc: pendingKyc || 0,
      approvedKyc: approvedKyc || 0,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAssetPerformance(supabase: any) {
  // Get asset categories performance
  const { data: categoryData } = await supabase
    .from('assets')
    .select('category, estimated_value')
    .not('estimated_value', 'is', null)

  const categoryPerformance = categoryData?.reduce((acc: any, asset: any) => {
    const category = asset.category
    if (!acc[category]) {
      acc[category] = { count: 0, totalValue: 0 }
    }
    acc[category].count++
    acc[category].totalValue += parseFloat(asset.estimated_value)
    return acc
  }, {}) || {}

  // Get recent asset activity
  const { data: recentActivity } = await supabase
    .from('assets')
    .select('id, title, category, status, created_at, estimated_value')
    .order('created_at', { ascending: false })
    .limit(10)

  return new Response(
    JSON.stringify({
      categoryPerformance,
      recentActivity: recentActivity || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUserEngagement(supabase: any) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get daily active users
  const { data: dailyActive } = await supabase
    .from('analytics_events')
    .select('user_id, created_at')
    .gte('created_at', sevenDaysAgo)
    .not('user_id', 'is', null)

  // Group by day
  const dailyEngagement = dailyActive?.reduce((acc: any, event: any) => {
    const date = event.created_at.split('T')[0]
    if (!acc[date]) {
      acc[date] = new Set()
    }
    acc[date].add(event.user_id)
    return acc
  }, {}) || {}

  // Convert to array format
  const engagementData = Object.entries(dailyEngagement).map(([date, users]: [string, any]) => ({
    date,
    activeUsers: users.size
  }))

  // Get top events
  const { data: eventCounts } = await supabase
    .from('analytics_events')
    .select('event_type')
    .gte('created_at', sevenDaysAgo)

  const topEvents = eventCounts?.reduce((acc: any, event: any) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1
    return acc
  }, {}) || {}

  return new Response(
    JSON.stringify({
      dailyEngagement: engagementData,
      topEvents
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export function useAnalytics() {
  const { user } = useAuth();
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const trackEvent = async (eventType: string, eventData: any = {}, assetId?: string) => {
    try {
      await supabase.functions.invoke('analytics', {
        body: {
          action: 'track_event',
          event_type: eventType,
          event_data: eventData,
          asset_id: assetId,
          session_id: sessionId,
          user_id: user?.id,
          ip_address: null, // Client-side can't access real IP
          user_agent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const getDashboardMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { action: 'get_dashboard_metrics' },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return null;
    }
  };

  const getAssetPerformance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { action: 'get_asset_performance' },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching asset performance:', error);
      return null;
    }
  };

  const getUserEngagement = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { action: 'get_user_engagement' },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      return null;
    }
  };

  // Auto-track page views
  useEffect(() => {
    trackEvent('page_view', { 
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    trackEvent,
    getDashboardMetrics,
    getAssetPerformance,
    getUserEngagement,
  };
}
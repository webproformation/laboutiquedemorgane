'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface LivePresenceTrackerProps {
  streamId: string;
}

export default function LivePresenceTracker({ streamId }: LivePresenceTrackerProps) {
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());
  const hasClaimedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user || !streamId) return;

    startTimeRef.current = Date.now();

    const checkInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000 / 60);

      if (elapsed >= 10 && !hasClaimedRef.current) {
        claimLiveBonus(elapsed);
      }
    }, 60000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [user, streamId]);

  const claimLiveBonus = async (watchDurationMinutes: number) => {
    if (!user || hasClaimedRef.current) return;

    try {
      const { data, error } = await supabase.rpc('award_live_presence_bonus', {
        p_user_id: user.id,
        p_stream_id: streamId,
        p_watch_duration_minutes: watchDurationMinutes
      });

      if (error) throw error;

      if (data.success) {
        hasClaimedRef.current = true;
        toast.success(data.message, {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error claiming live bonus:', error);
    }
  };

  return null;
}
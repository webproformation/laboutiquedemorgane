'use client';

import { useState, useEffect } from 'react';
import { Gem } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';

interface HiddenDiamondProps {
  diamondId: string;
  pageUrl: string;
}

export default function HiddenDiamond({ diamondId, pageUrl }: HiddenDiamondProps) {
  const { user } = useAuth();
  const [isFound, setIsFound] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [reward, setReward] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkDiamondStatus();
  }, [diamondId, user]);

  const checkDiamondStatus = async () => {
    if (!user) {
      setIsVisible(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('diamond_finds')
        .select('id')
        .eq('user_id', user.id)
        .eq('diamond_id', diamondId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsFound(true);
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking diamond status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (!user) {
      alert('Connecte-toi pour gagner des récompenses !');
      return;
    }

    if (isFound) return;

    try {
      const { data, error } = await supabase.rpc('award_diamond_find_bonus', {
        p_user_id: user.id,
        p_diamond_id: diamondId
      });

      if (error) throw error;

      if (data.success) {
        setReward(data.amount);
        setMessage(data.message);
        setIsFound(true);
        setShowDialog(true);
        setIsVisible(false);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error claiming diamond:', error);
    }
  };

  if (isLoading || !isVisible || isFound) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed z-50 cursor-pointer hover:scale-110 transition-transform animate-bounce"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        aria-label="Diamant caché"
      >
        <Gem className="w-8 h-8 text-blue-500 drop-shadow-lg" fill="currentColor" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Félicitations !</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Gem className="w-16 h-16 mx-auto mb-4 text-blue-500" fill="currentColor" />
            <p className="text-lg mb-2">{message}</p>
            <p className="text-3xl font-bold text-blue-600">+{reward} €</p>
          </div>
          <Button onClick={() => setShowDialog(false)} className="w-full">
            Super !
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
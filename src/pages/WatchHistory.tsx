import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { getWatchHistory, WatchHistory as WatchHistoryEntry } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';
import { toast } from 'sonner';

const WatchHistory = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const fetchedHistory = await getWatchHistory(user.id);
        setHistory(fetchedHistory);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch watch history.');
        console.error(err);
        toast.error('Failed to load watch history.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSessionLoading && user) {
      fetchHistory();
    } else if (!isSessionLoading && !user) {
      navigate('/auth');
      toast.error('You must be logged in to view your watch history.');
    }
  }, [user, isSessionLoading, navigate]);

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-10">Loading watch history...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
  }

  if (!user) {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Watch History</h1>

      {history.length === 0 ? (
        <div className="text-center text-muted-foreground">
          You haven't watched any videos yet. Start exploring!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {history.map((entry) => (
            <VideoCard key={entry.id} video={entry.videos} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchHistory;
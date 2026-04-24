import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SequentialRunner from '../components/SequentialRunner';
import { TRACKS, type TrackId } from '../lib/tracks';
import { shuffle } from '../lib/utils';

export default function Hardcore() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = (cert?.toUpperCase() ?? '') as TrackId;
  const track = TRACKS[trackId];

  const [sessionKey, setSessionKey] = useState(0);
  const navigate = useNavigate();

  if (!track) return <Navigate to="/" replace />;

  const pool = shuffle(track.hardcoreQuestions);

  return (
    <PageShell>
      <SequentialRunner
        key={sessionKey}
        track={track}
        pool={pool}
        onExitPath="/"
        onRestart={() => setSessionKey((k) => k + 1)}
        onChangeConfig={() => navigate('/')}
      />
    </PageShell>
  );
}

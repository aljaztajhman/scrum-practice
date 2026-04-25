import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import LengthPicker from '../components/LengthPicker';
import PageHeader from '../components/PageHeader';
import PageShell from '../components/PageShell';
import SequentialRunner from '../components/SequentialRunner';
import { TRACKS, type TrackId } from '../lib/tracks';
import { shuffle } from '../lib/utils';

export default function Practice() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = (cert?.toUpperCase() ?? '') as TrackId;
  const track = TRACKS[trackId];
  const [length, setLength] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  if (!track) return <Navigate to="/" replace />;
  if (length === null) {
    return (
      <PageShell>
        <PageHeader
          eyebrow={`${track.title} · Practice`}
          title="Practice"
          italic="at your pace"
          tagline="Answer, see the why, move on. Pick a length."
          backTo="/"
        />
        <LengthPicker
          options={[
            { n: 10, label: 'Warm-up', sub: 'Quick pulse-check' },
            { n: 30, label: 'Standard', sub: 'Balanced practice' },
            { n: track.questions.length, label: 'Full exam', sub: `All ${track.questions.length} · mirrors the real test` },
          ]}
          onPick={setLength}
        />
      </PageShell>
    );
  }
  const pool = shuffle(track.questions).slice(0, length);
  return (
    <PageShell>
      <SequentialRunner key={sessionKey} track={track} pool={pool} onExitPath="/" onRestart={() => setSessionKey((k) => k + 1)} onChangeConfig={() => setLength(null)} />
    </PageShell>
  );
}

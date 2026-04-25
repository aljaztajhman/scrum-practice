import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageShell from '../components/PageShell';
import SequentialRunner from '../components/SequentialRunner';
import TopicPicker from '../components/TopicPicker';
import { TRACKS, type TrackId } from '../lib/tracks';
import { shuffle } from '../lib/utils';

export default function Drill() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = (cert?.toUpperCase() ?? '') as TrackId;
  const track = TRACKS[trackId];
  const [topic, setTopic] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  if (!track) return <Navigate to="/" replace />;
  if (topic === null) {
    return (
      <PageShell>
        <PageHeader eyebrow={`${track.title} · Drill`} title="Drill" italic="one area" tagline="Pick a topic and grind it until it clicks." backTo="/" />
        <TopicPicker track={track} onPick={setTopic} />
      </PageShell>
    );
  }
  const pool = shuffle(track.questions.filter((q) => q.topic === topic));
  return (
    <PageShell>
      <SequentialRunner key={sessionKey} track={track} pool={pool} onExitPath="/" onRestart={() => setSessionKey((k) => k + 1)} onChangeConfig={() => setTopic(null)} />
    </PageShell>
  );
}

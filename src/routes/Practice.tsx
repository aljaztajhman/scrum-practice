import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import LengthPicker from '../components/LengthPicker';
import PageHeader from '../components/PageHeader';
import PageShell from '../components/PageShell';
import SequentialRunner from '../components/SequentialRunner';
import { useT } from '../i18n/LanguageContext';
import { TRACKS, type TrackId } from '../lib/tracks';
import { shuffle } from '../lib/utils';

export default function Practice() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = (cert?.toUpperCase() ?? '') as TrackId;
  const track = TRACKS[trackId];
  const t = useT();

  const [length, setLength] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  if (!track) return <Navigate to="/" replace />;

  if (length === null) {
    return (
      <PageShell>
        <PageHeader
          eyebrow={`${track.title} · ${t('practice.eyebrowSuffix')}`}
          title={t('practice.title')}
          italic={t('practice.italic')}
          tagline={t('practice.tagline')}
          backTo="/"
        />
        <LengthPicker
          options={[
            { n: 10, labelKey: 'length.warmup', subKey: 'length.warmup.sub' },
            { n: 30, labelKey: 'length.standard', subKey: 'length.standard.sub' },
            { n: track.questions.length, labelKey: 'length.full', subKey: 'length.full.sub' },
          ]}
          onPick={setLength}
        />
      </PageShell>
    );
  }

  const pool = shuffle(track.questions).slice(0, length);

  return (
    <PageShell>
      <SequentialRunner
        key={sessionKey}
        track={track}
        pool={pool}
        onExitPath="/"
        onRestart={() => setSessionKey((k) => k + 1)}
        onChangeConfig={() => setLength(null)}
      />
    </PageShell>
  );
}

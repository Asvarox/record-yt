import { useEffect, useRef, useState } from 'react';
import './App.css';
import YouTube from 'react-youtube';
import { useReactMediaRecorder } from './useMediaRecorder';
import createPersistedState from 'use-persisted-state';
import { useMicrophoneList } from './MicrophoneList';

const useVideoId = createPersistedState<string>('video-id');
const usePreviousVideos = createPersistedState<Array<{ id: string, title: string }>>('previous-videos');
const useLag = createPersistedState<number>('lag-id');

function App() {
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>(undefined);
  const deviceList = useMicrophoneList();

  const [video, setVideo] = useVideoId('jcL38GYrk-I'); // DBeHQfvqO6k
  const [playbackStartedAt, setPlaybackStartedAt] = useState(0);
  const [recordOffset, setRecordOffset] = useState(0);
  const [recordStartedAt, setRecordStartedAt] = useState(0);
  const recorder = useReactMediaRecorder({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      ...(selectedDevice ? { deviceId: selectedDevice } : {}),
    },
    video: false,
    askPermissionOnMount: true,
    onStart: () => setRecordStartedAt(performance.now()),
  });
  const [isRecording, setIsRecording] = useState(false);
  const player = useRef<YouTube | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [lag, setLag] = useLag(-56);

  const timeoutRef = useRef<number>();
  const pauseAudio = () => {
    audio.current?.pause();
    clearTimeout(timeoutRef.current);
  };

  const playAt = (seconds: number) => {
    clearTimeout(timeoutRef.current);
    const newTime = seconds + (recordStartedAt - playbackStartedAt) / 1000 + lag / 1000 - recordOffset;

    if (newTime < 0) {
      audio.current && (audio.current.currentTime = 0);
      timeoutRef.current = setTimeout(() => audio.current?.play(), newTime * -1000 * (1 / (audio.current?.playbackRate ?? 1)));
    } else {
      audio.current && (audio.current.currentTime = newTime);
      const start = performance.now();
      audio.current?.play().then(() => console.log('playback lag', performance.now() - start));
    }
  };
  const startRecording = async () => {
    await player.current?.getInternalPlayer().pauseVideo();
    setTimeout(async () => {
      setIsRecording(true);
      const time = await player.current?.internalPlayer.getCurrentTime();
      setRecordOffset(time);
      player.current?.internalPlayer.playVideo();
    }, 100);
  };

  const restartPlayer = () => {
    player.current?.internalPlayer.seekTo(0);
    player.current?.internalPlayer.playVideo();
  };

  useEffect(() => {
    const audioElem = audio.current;
    if (audioElem && !audioElem.paused && !audioElem.ended && !!audioElem.currentTime) {
      player.current?.getInternalPlayer().getCurrentTime().then((time: number) => {
        audioElem.currentTime = time + (recordStartedAt - playbackStartedAt) / 1000 + lag / 1000 - recordOffset;
      });
    }
  }, [lag, audio]);

  const stopRecording = () => {
    setIsRecording(false);
    recorder.stopRecording();
  };

  const [previousVideos, setPreviousVideos] = usePreviousVideos([]);

  return (
        <div className="App">
           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{
                previousVideos.map(({ id, title }) => (
                    <button onClick={() => setVideo(id)} disabled={id === video} key={id}>{title}</button>
                ))
            }
           </div>
            <input value={video} onChange={e => {
              const vid = e.target.value;
              try {
                const linkUrl = new URL(vid);
                const vidId = linkUrl.searchParams.get('v');
                if (vidId) { setVideo(vidId); } else throw new Error('invalid link');
              } catch (e: any) {
                setVideo(vid);
              }
            }}/>
            <YouTube
                ref={player}
                videoId={video}
                id="youtube-player"
                onPlaybackRateChange={async () => {
                  const currentRate = await player.current?.getInternalPlayer().getPlaybackRate();
                  audio.current && (audio.current.playbackRate = currentRate);
                  playAt(await player.current?.getInternalPlayer().getCurrentTime());
                }}
                onPlay={() => {
                  if (!isRecording) {
                    player.current?.internalPlayer.getCurrentTime().then(playAt);
                  } else {
                    setPlaybackStartedAt(performance.now());
                    recorder.startRecording();
                  }

                  if (!previousVideos.find(({ id }) => video === id)) {
                    const title = document.getElementById('youtube-player')?.title ?? video;
                    setPreviousVideos(current => [{ id: video, title }, ...current].slice(0, 10));
                  }
                }}
                     onEnd={isRecording ? stopRecording : pauseAudio}
                     onPause={isRecording ? stopRecording : pauseAudio}

            />
            <audio src={recorder.mediaBlobUrl} controls ref={audio}/>
            {!isRecording && <button onClick={startRecording}>record</button>}
            {isRecording && <button onClick={stopRecording}>stop recording</button>}
            <button onClick={restartPlayer}>replay</button>
          <div>
            <input type="number" step={4} value={lag} onChange={e => setLag(+e.target.value)}/><br />
            <input type={'range'} min={-250} max={250} value={lag} onChange={e => setLag(+e.target.value)} style={{ width: 640 }} />
          </div>
          <div>
            <select onChange={e => setSelectedDevice(e.target.value)} value={selectedDevice ?? 'default'}>
              {deviceList.map(device => <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>)}
            </select>
          </div>
        </div>
  );
}

export default App;

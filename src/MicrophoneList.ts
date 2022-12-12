import { useEffect, useState } from 'react';

export interface InputSource {
  label: string
  deviceId: string
}

export function useMicrophoneList() {
  const [list, setList] = useState<InputSource[]>([]);

  useEffect(() => {
    const onChange = async () => {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputList = (devices as any as Array<MediaStreamTrack & MediaDeviceInfo>)
        .filter((device) => device.kind === 'audioinput')
        .flat();

      setList(inputList);
    };
    onChange();

    navigator.mediaDevices.addEventListener('devicechange', onChange);

    return () => navigator.mediaDevices.removeEventListener('devicechange', onChange);
  }, []);

  return list;
}

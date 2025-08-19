import { useEffect, useState } from 'react';

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
}

export const useMediaDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === 'videoinput'
        );
        setDevices(videoDevices);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to get media devices'
        );
      }
    };

    getDevices();
  }, []);

  return [devices, setDevices, error] as const;
};

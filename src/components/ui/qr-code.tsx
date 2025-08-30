import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 200, className = '' }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#0A0A0A',
          light: '#F8F6F0'
        }
      }).catch(console.error);
    }
  }, [value, size]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`border border-gray-300 rounded-lg ${className}`}
    />
  );
}

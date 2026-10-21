import { QrCode as ArkQrCode } from '@ark-ui/react/qr-code';
import styles from './QrCode.module.css';

type QrCodeProps = {
  value: string;
  size?: number;
  overlaySrc?: string;
  overlayAlt?: string;
};

export default function QrCode({
  value,
  size = 224,
  overlaySrc = '/android/android-launchericon-192-192.png',
  overlayAlt = 'MyPísnička',
}: Readonly<QrCodeProps>) {
  return (
    <ArkQrCode.Root
      className={styles.qrCode}
      value={value}
      encoding={{ ecc: 'H' }}
    >
      <ArkQrCode.Frame
        className={styles.qrFrame}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <ArkQrCode.Pattern className={styles.qrPattern} />
      </ArkQrCode.Frame>
      <ArkQrCode.Overlay className={styles.qrOverlay}>
        <img
          className={styles.qrOverlayImage}
          src={overlaySrc}
          alt={overlayAlt}
        />
      </ArkQrCode.Overlay>
    </ArkQrCode.Root>
  );
}

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders `text` as a QR code PNG data URL (client side). */
export function useQrDataUrl(text: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 1, width: 512 }).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);
  return url;
}

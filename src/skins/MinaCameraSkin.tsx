import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Props } from "./shared";
import { ArrowLeft, Camera, CameraOff, Download, RefreshCw, RotateCcw, SwitchCamera } from "lucide-react";
import "./mina-camera.css";

type CameraState = "loading" | "ready" | "blocked" | "missing" | "unsupported" | "error";
type Photo = { src: string; name: string };

function cameraError(error: unknown): CameraState {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError" || error.name === "SecurityError") return "blocked";
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") return "missing";
  }
  return "error";
}

function fileName(extension = "jpg") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `mina-camera-${timestamp}.${extension}`;
}

const errorMessages: Record<Exclude<CameraState, "loading" | "ready">, string> = {
  blocked: "カメラへのアクセスが許可されていません。ブラウザの設定でカメラを許可してください。",
  missing: "この端末ではカメラが見つかりませんでした。",
  unsupported: "このブラウザではカメラを直接開けません。HTTPSのページをSafariやChromeで開いてください。",
  error: "カメラを起動できませんでした。別のアプリがカメラを使っていないか確認してください。",
};

/** Real, permission-based local camera. Images never leave this browser through app code. */
export function MinaCameraSkin(p: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraRef = useRef<HTMLInputElement | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [restart, setRestart] = useState(0);
  const [status, setStatus] = useState<CameraState>("loading");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    const video = videoRef.current;
    setStatus("loading");
    setMessage("");

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    async function openCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (!cancelled) setStatus(cameraError(error));
      }
    }

    void openCamera();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
      if (video) video.srcObject = null;
    };
  }, [facing, restart]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function takePhoto() {
    const video = videoRef.current;
    if (status !== "ready" || !video || !video.videoWidth || !video.videoHeight) {
      setMessage("映像の準備ができるまで、少しお待ちください。");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setMessage("撮影に失敗しました。もう一度お試しください。");
      return;
    }
    if (facing === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const src = canvas.toDataURL("image/jpeg", 0.92);
      setPhoto({ src, name: fileName() });
      setMessage("");
      stopCamera();
    } catch {
      setMessage("写真を保存する準備ができませんでした。");
    }
  }

  function retake() {
    setPhoto(null);
    setRestart((count) => count + 1);
  }

  async function savePhoto() {
    if (!photo) return;
    try {
      const blob = await (await fetch(photo.src)).blob();
      const file = new File([blob], photo.name, { type: blob.type || "image/jpeg" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "MINA Camera" });
          setMessage("共有メニューから端末への保存を選べます。");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = photo.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 5000);
      setMessage("端末のダウンロード先に保存しました。");
    } catch {
      setMessage("保存できませんでした。写真を長押しして保存してください。");
    }
  }

  function openNativePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        stopCamera();
        setPhoto({ src: reader.result, name: file.name || fileName() });
        setMessage("");
      }
    };
    reader.onerror = () => setMessage("写真を読み込めませんでした。");
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  }

  return (
    <section className="catalog-skin mina-live-camera" aria-label="ライブカメラ">
      <header className="mina-live-camera-header">
        <button aria-label="カメラを閉じる" onClick={() => { stopCamera(); p.onBack(); }}>
          <ArrowLeft size={21} /> 戻る
        </button>
        <strong>カメラ</strong>
        <span>LIVE</span>
      </header>

      <div className="mina-live-camera-screen">
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          aria-label="リアルタイムのカメラ映像"
          className={`mina-live-camera-video${facing === "user" ? " mirrored" : ""}`}
        />
        {photo && <img className="mina-live-camera-photo" src={photo.src} alt="撮影した写真のプレビュー" />}
        {!photo && status !== "ready" && (
          <div className="mina-live-camera-notice" role="status">
            {status === "loading" ? (
              <>
                <Camera size={31} />
                <p>カメラを起動しています…</p>
                <small>初回はブラウザのカメラ使用を許可してください。</small>
              </>
            ) : (
              <>
                <CameraOff size={31} />
                <p>{errorMessages[status]}</p>
                <button onClick={() => setRestart((count) => count + 1)}><RefreshCw size={15} /> 再試行</button>
              </>
            )}
          </div>
        )}
        {!photo && <span className="mina-live-camera-reticle" aria-hidden="true" />}
      </div>

      <div className="mina-live-camera-actions">
        {photo ? (
          <>
            <button className="mina-live-camera-side" onClick={retake} aria-label="写真を撮り直す">
              <RotateCcw size={22} /><small>撮り直す</small>
            </button>
            <button className="mina-live-camera-shutter saved" onClick={() => void savePhoto()} aria-label="写真を保存または共有する">
              <Download size={26} />
            </button>
            <span className="mina-live-camera-side placeholder" />
          </>
        ) : (
          <>
            <button className="mina-live-camera-side" onClick={() => nativeCameraRef.current?.click()} aria-label="端末の標準カメラを開く">
              <Camera size={22} /><small>標準カメラ</small>
            </button>
            <button className="mina-live-camera-shutter" onClick={takePhoto} disabled={status !== "ready"} aria-label="写真を撮る"><span /></button>
            <button className="mina-live-camera-side" onClick={() => setFacing((value) => value === "environment" ? "user" : "environment")} disabled={status === "loading"} aria-label="前面と背面のカメラを切り替える">
              <SwitchCamera size={23} /><small>切り替え</small>
            </button>
          </>
        )}
      </div>
      <input
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="mina-live-camera-file"
        tabIndex={-1}
        aria-label="標準カメラで写真を撮る"
        onChange={openNativePhoto}
      />
      <p className="mina-live-camera-caption" role="status">{message || (photo ? "共有または保存して、端末に写真を残せます。" : "カメラの映像や写真はサーバーに送信しません。")}</p>
    </section>
  );
}

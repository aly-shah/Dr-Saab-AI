"use client";

// Reusable 16:9 video block. Renders a real <video> when `src` is passed,
// otherwise a branded placeholder so layout and copy stay final.
//
// Autoplay only survives browser policy while muted, so the video starts muted
// and the viewer opts into audio via the sound button. If autoplay is blocked
// anyway (data saver, iOS Low Power Mode), the button falls back to starting
// playback with sound on — the one case where a click grants both at once.

import { useEffect, useRef, useState } from "react";

export default function VideoBlock({ src = "", poster = "", caption = "", className = "" }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // Autoplay is started here rather than via the `autoPlay` attribute: React
  // does not render `muted` into the SSR markup, so the attribute alone races
  // the hydration that sets it and Safari/Chrome block the play as unmuted.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    v.muted = true;
    v.play().catch(() => {
      // Blocked — the sound button becomes an explicit play affordance.
    });
  }, [src]);

  async function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    const nextMuted = !v.muted;
    v.muted = nextMuted;
    setMuted(nextMuted);
    // Unmuting a video that autoplay never started still needs a play() — this
    // click is the user gesture that permits it.
    if (v.paused) {
      try {
        await v.play();
      } catch {
        /* leave the native controls as the fallback */
      }
    }
  }

  return (
    <div className={`mx-auto w-full max-w-3xl ${className}`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-dark to-ink shadow-card ring-1 ring-line/40">
        <div className="aspect-video w-full">
          {src ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              controls
              muted
              loop
              playsInline
              preload="metadata"
              poster={poster || undefined}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
            >
              <source src={src} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="grid h-full w-full place-items-center text-center text-white/90">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <p className="mt-4 text-sm font-medium text-white/80">Intro video</p>
                <p className="text-xs text-white/50">Coming soon</p>
              </div>
            </div>
          )}
        </div>

        {src && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Unmute video" : "Mute video"}
            aria-pressed={!muted}
            className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-ink/60 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-ink/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {muted ? (
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="m22 9-1.4-1.4L18 10.2 15.4 7.6 14 9l2.6 2.6L14 14.2l1.4 1.4 2.6-2.6 2.6 2.6L22 14.2l-2.6-2.6L22 9z" />
                </svg>
                <span>{playing ? "Unmute" : "Tap for sound"}</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7 1 1 0 0 0 1.4 1.4 7 7 0 0 0 0-9.9 1 1 0 1 0-1.4 1.4z" />
                  <path d="M18.4 5.6a9 9 0 0 1 0 12.8 1 1 0 0 0 1.4 1.4 11 11 0 0 0 0-15.6 1 1 0 1 0-1.4 1.4z" />
                </svg>
                <span>Mute</span>
              </>
            )}
          </button>
        )}
      </div>
      {caption && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-[16px] leading-relaxed text-ink/70">
          {caption}
        </p>
      )}
    </div>
  );
}

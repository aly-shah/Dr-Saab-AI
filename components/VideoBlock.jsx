// Reusable 16:9 video block. Drops in a real <video> once a file is placed in
// /public (pass `src`). Until then it renders a branded placeholder so layout
// and copy are final and only the asset needs swapping in.

export default function VideoBlock({ src = "", poster = "", caption = "", className = "" }) {
  return (
    <div className={`mx-auto w-full max-w-3xl ${className}`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-dark to-ink shadow-card ring-1 ring-line/40">
        <div className="aspect-video w-full">
          {src ? (
            <video
              className="h-full w-full object-cover"
              controls
              playsInline
              preload="metadata"
              poster={poster || undefined}
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
                <p className="mt-4 text-sm font-medium text-white/80">30-second intro video</p>
                <p className="text-xs text-white/50">Coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {caption && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-[16px] leading-relaxed text-ink/70">
          {caption}
        </p>
      )}
    </div>
  );
}

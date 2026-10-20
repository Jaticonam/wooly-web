import { useReadingProgress } from "../../hooks/useReadingProgress";

export default function BlogReadingProgress() {
  const progress = useReadingProgress();

  return (
    <div className="blog-reading-progress">
      <div
        className="blog-reading-bar"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

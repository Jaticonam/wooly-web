type Props = {
  title: string;
  children: React.ReactNode;
};

export default function BlogRailCard({ title, children }: Props) {
  return (
    <div className="blog-rail-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

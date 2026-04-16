interface ChartCardProps {
  title: string;
  fullTitle?: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyMessage?: string;
  skeletonHeight?: string;
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  fullTitle,
  isLoading,
  isEmpty,
  emptyMessage = "No data in this period",
  skeletonHeight = "h-64",
  children,
}: ChartCardProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="card-title">{title}</h3>
        <div className={`skeleton ${skeletonHeight} rounded-lg`} />
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="card">
        <h3 className="card-title">{title}</h3>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="card">
      <h3 className="card-title">{fullTitle ?? title}</h3>
      {children}
    </div>
  );
}

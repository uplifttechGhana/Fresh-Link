import '../../styles/page-loader.css';

export function PageLoader() {
  return (
    <div className="page-loader-overlay">
      <div className="pl-wrapper">
        <div className="pl-circle" />
        <div className="pl-circle" />
        <div className="pl-circle" />
        <div className="pl-shadow" />
        <div className="pl-shadow" />
        <div className="pl-shadow" />
      </div>
    </div>
  );
}

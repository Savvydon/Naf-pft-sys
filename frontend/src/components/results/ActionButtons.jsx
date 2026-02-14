export default function ActionButtons({ onDownload, onHome }) {
  return (
    <div className="action-buttons">
      <button onClick={onDownload} className="btn pdf-btn">
        Download as PDF
      </button>
      <button className="btn email-btn">
        Send to Email
      </button>
      <button onClick={onHome} className="btn home-btn">
        Back to Homepage
      </button>
    </div>
  );
}
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link className="site-footer-brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-dot" />
          </span>
          <span>
            <strong>Eventora</strong>
            <small>Find your next great experience.</small>
          </span>
        </Link>
        <nav className="site-footer-links" aria-label="Footer navigation">
          <Link to="/events">Explore events</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <span className="site-footer-copyright">&copy; 2026 Eventora</span>
      </div>
    </footer>
  );
}

export default Footer;

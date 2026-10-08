import { useEffect } from "react";
import { useLocation } from "wouter";

// Les changements de page ici ne rechargent jamais vraiment le navigateur
// (site "une page"), donc le défilement reste où il était sans ce composant.
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

import React from "react";
import { useNavigate } from "react-router";

export default function RouterBridge() {
  const navigate = useNavigate();

  React.useEffect(() => {
    window.goToAbout = (tab: string = 'help', anchor?: string) => {
      navigate('/app/about', { state: { selectedTab: tab, scrollTo: anchor } });
    };

    return () => {
      delete window.goToAbout;
    };
  }, [navigate]);

  return null;
}

declare global {
  interface Window {
    goToAbout?: (tab?: string) => void;
  }
}
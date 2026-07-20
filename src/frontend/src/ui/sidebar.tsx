// Seitenleiste mit angepasster Navigation (kein History/ERP-Simulator)

import { NavLink, Link } from "react-router-dom";
import { Home, BarChart2, UploadCloud, User } from "lucide-react";
import { useEffect, useState } from "react";
import sherpaiLogo from "../assets/sherpai_logo.png";
import sapLogo from "../assets/SAP.png";
import timelineLogo from "../assets/TimLine-ERP.png";

type ThemeKey = "verifai" | "timeline" | "sap";

const THEMES: Record<ThemeKey, { brand: string; logo: string }> = {
  verifai:  { brand: "#EA580C", logo: sherpaiLogo },
  timeline: { brand: "#16A34A", logo: timelineLogo },
  sap:      { brand: "#298CE6", logo: sapLogo },
};

const MENU = [
  { icon: <Home size={20} />,        label: "Dashboard",      to: "/" },
  { icon: <UploadCloud size={20} />, label: "Neue Analyse",   to: "/start" },
  { icon: <BarChart2 size={20} />,   label: "Ergebnisse",     to: "/results" },
  { icon: <User size={20} />,        label: "Profil",         to: "/profile" },
];

const Sidebar = () => {
  const [themeKey, setThemeKey] = useState<ThemeKey>("verifai");

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", THEMES.verifai.brand);

    const handler = (event: Event) => {
      const key = (event as CustomEvent<ThemeKey>).detail;
      const next: ThemeKey = key && key in THEMES ? key : "verifai";
      setThemeKey(next);
      document.documentElement.style.setProperty("--brand", THEMES[next].brand);
    };

    window.addEventListener("verifaication-theme-changed", handler);
    return () => window.removeEventListener("verifaication-theme-changed", handler);
  }, []);

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-100 flex justify-center">
        <Link to="/">
          <img src={THEMES[themeKey].logo} alt="Logo" className="h-30 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 mt-4">
        {MENU.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-6 py-3 text-sm transition ${
                isActive
                  ? "bg-[var(--brand)]/10 text-[var(--brand)] font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[var(--brand)]"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

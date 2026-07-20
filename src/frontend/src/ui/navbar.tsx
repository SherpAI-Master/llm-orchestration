// src/ui/navbar.tsx

import { Search, Bell } from "lucide-react";
import { useI18n } from "../context/i18nContext";

const Navbar = () => {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      {/* Suchleiste – füllt dynamisch die Breite */}
      <div className="flex items-center gap-3 flex-1 max-w-xl bg-gray-100 px-4 py-2 rounded-lg">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder={t("nav.searchPlaceholder")}
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {/* Rechts: Language-Toggle + Notification + Avatar */}
      <div className="flex items-center gap-4 ml-6">
        {/* einfache Sprachumschaltung */}
        <div className="flex items-center rounded-full border border-gray-200 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setLang("de")}
            className={`px-3 py-1 transition ${
              lang === "de"
                ? "bg-[var(--brand)] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t("nav.language.de")}
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1 border-l border-gray-200 transition ${
              lang === "en"
                ? "bg-[var(--brand)] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t("nav.language.en")}
          </button>
        </div>

        <Bell
          size={20}
          className="text-gray-600 hover:text-[var(--brand)] transition"
        />
        <div className="w-8 h-8 bg-[var(--brand)]/10 text-[var(--brand)] rounded-full flex items-center justify-center font-semibold">
          M
        </div>
      </div>
    </header>
  );
};

export default Navbar;

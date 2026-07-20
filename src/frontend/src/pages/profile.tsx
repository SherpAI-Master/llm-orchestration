// src/pages/profile.tsx

import Button from "../ui/button";
import sherpaiLogo from "../assets/sherpai_logo.png";
import sapLogo from "../assets/SAP.png";
import timelineLogo from "../assets/TimLine-ERP.png";
import { useI18n } from "../context/i18nContext";

type ThemeKey = "verifai" | "timeline" | "sap";

type ThemeConfig = {
  labelKey: string;
  descriptionKey: string;
  brand: string;
  logo: string;
  
};

const themes: Record<ThemeKey, ThemeConfig> = {
  verifai: {
    labelKey: "profile.theme.verifai.label",
    descriptionKey: "profile.theme.verifai.description",
    brand: "#EA580C",
    logo: sherpaiLogo,
  },
  timeline: {
    labelKey: "profile.theme.timeline.label",
    descriptionKey: "profile.theme.timeline.description",
    brand: "#16A34A",
    logo: timelineLogo,
  },
  sap: {
    labelKey: "profile.theme.sap.label",
    descriptionKey: "profile.theme.sap.description",
    brand: "#298CE6",
    logo: sapLogo,
  },
};

/**
 * Zentraler Theme-Switcher:
 */
function applyTheme(key: ThemeKey) {
  window.dispatchEvent(
    new CustomEvent<ThemeKey>("verifaication-theme-changed", {
      detail: key,
    })
  );
}

export default function Profile() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("profile.title")}
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl">
            {t("profile.subtitle")}
          </p>
        </header>

        {/* Branding-Karten */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {t("profile.section.brandingTitle")}
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <BrandCard
              title={t(themes.verifai.labelKey)}
              description={t(themes.verifai.descriptionKey)}
              color={themes.verifai.brand}
              logo={themes.verifai.logo}
              onSelect={() => applyTheme("verifai")}
            />
            <BrandCard
              title={t(themes.timeline.labelKey)}
              description={t(themes.timeline.descriptionKey)}
              color={themes.timeline.brand}
              logo={themes.timeline.logo}
              onSelect={() => applyTheme("timeline")}
            />
            <BrandCard
              title={t(themes.sap.labelKey)}
              description={t(themes.sap.descriptionKey)}
              color={themes.sap.brand}
              logo={themes.sap.logo}
              onSelect={() => applyTheme("sap")}
            />
          </div>

          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            {t("profile.techHint.prefix")}{" "}
            <code className="bg-gray-100 px-1 rounded text-[10px]">
              verifaication-theme-changed
            </code>{" "}
            {t("profile.techHint.middle")}{" "}
            <code className="bg-gray-100 px-1 rounded text-[10px]">
              --brand
            </code>
            . {t("profile.techHint.suffix")}
          </p>
        </section>
      </div>
    </div>
  );
}

type BrandCardProps = {
  title: string;
  description: string;
  color: string;
  logo: string;
  onSelect: () => void;
};

function BrandCard({
  title,
  description,
  color,
  logo,
  onSelect,
}: BrandCardProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="flex items-center h-20 overflow-hidden">
          <img
            src={logo}
            alt={title}
            className="h-16 w-auto max-w-[220px] object-contain"
          />
        </div>

        <p className="text-xs text-gray-600">{description}</p>
      </div>

      <div className="mt-4">
        <Button
          size="sm"
          className="w-full justify-center text-xs"
          onClick={onSelect}
        >
          {t("profile.brandCard.activate")}
        </Button>
      </div>
    </div>
  );
}

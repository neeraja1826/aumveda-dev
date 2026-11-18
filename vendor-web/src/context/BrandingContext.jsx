import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_BASE_URL } from "../config/api";


const BrandingContext = createContext(null);


const DEFAULT_BRANDING = {
  site_name: "AUMVEDA",
  logo_url: "",
  favicon_url: "",
  branding_version: 1,
};


export function BrandingProvider({ children }) {
  const [branding, setBranding] =
    useState(DEFAULT_BRANDING);

  const [loadingBranding, setLoadingBranding] =
    useState(true);


  useEffect(() => {
    loadBranding();
  }, []);


  async function loadBranding() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/site-settings/branding`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load branding."
        );
      }

      const data =
        await response.json();

      const nextBranding = {
        ...DEFAULT_BRANDING,
        ...(data?.branding || {}),
      };

      setBranding(nextBranding);

      if (
        nextBranding.favicon_url
      ) {
        updateFavicon(
          nextBranding.favicon_url
        );
      }

      if (
        nextBranding.site_name
      ) {
        document.title =
          `${nextBranding.site_name} Vendor`;
      }

    } catch (error) {
      console.error(
        "Branding load failed:",
        error
      );

      setBranding(
        DEFAULT_BRANDING
      );

    } finally {
      setLoadingBranding(false);
    }
  }


  function updateFavicon(url) {
    let favicon =
      document.querySelector(
        "link[rel='icon']"
      );

    if (!favicon) {
      favicon =
        document.createElement(
          "link"
        );

      favicon.rel =
        "icon";

      document.head.appendChild(
        favicon
      );
    }

    favicon.href =
      url;
  }


  return (
    <BrandingContext.Provider
      value={{
        branding,
        loadingBranding,
        refreshBranding:
          loadBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}


export function useBranding() {
  const context =
    useContext(
      BrandingContext
    );

  if (!context) {
    throw new Error(
      "useBranding must be used inside BrandingProvider"
    );
  }

  return context;
}

import {
  useState,
} from "react";

import {
  useBranding,
} from "../../context/BrandingContext";


export default function AumvedaLogo({
  className = "",
  alt,
}) {
  const {
    branding,
  } = useBranding();

  const [imageFailed, setImageFailed] =
    useState(false);


  if (
    !branding.logo_url ||
    imageFailed
  ) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Georgia, 'Times New Roman', serif",
          fontWeight: 600,
          color: "#381f12",
        }}
      >
        {branding.site_name}
      </span>
    );
  }


  return (
    <img
      src={branding.logo_url}
      alt={
        alt ||
        branding.site_name ||
        "AUMVEDA"
      }
      className={className}
      onError={() =>
        setImageFailed(true)
      }
    />
  );
}
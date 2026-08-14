import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon — same mark as icon.tsx, scaled up (Apple applies its own corner
 * rounding, so this stays a filled square rather than a circle). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0055A4",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 118,
            fontWeight: 700,
            color: "#FAF6EE",
            lineHeight: 1,
            transform: "translateY(6px)",
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size },
  );
}

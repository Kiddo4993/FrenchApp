import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Brand favicon: bleu de France disc, a cream serif "M" for Maîtrise. Gold is reserved for
 * in-app mastery states (PLAN.md §8), so it's deliberately not used here. */
export default function Icon() {
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
          borderRadius: "50%",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 21,
            fontWeight: 700,
            color: "#FAF6EE",
            lineHeight: 1,
            transform: "translateY(1px)",
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size },
  );
}

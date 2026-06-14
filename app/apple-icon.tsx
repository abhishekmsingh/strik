import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#c2570c",
          color: "#faf8f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 140,
          fontFamily: "serif",
          lineHeight: 1,
          paddingBottom: 16,
        }}
      >
        s
      </div>
    ),
    size,
  );
}

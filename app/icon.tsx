import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 150,
          fontFamily: "serif",
          lineHeight: 1,
          paddingBottom: 18,
        }}
      >
        s
      </div>
    ),
    size,
  );
}

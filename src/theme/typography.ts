import { TextStyle } from "react-native";

type TypeStyle = Pick<TextStyle, "fontSize" | "fontWeight" | "lineHeight" | "letterSpacing">;

export const typography: Record<
  "display" | "title" | "heading" | "subheading" | "body" | "bodyBold" | "caption" | "label" | "button",
  TypeStyle
> = {
  display: { fontSize: 32, fontWeight: "800", lineHeight: 38, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: "700", lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  subheading: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 21 },
  bodyBold: { fontSize: 15, fontWeight: "600", lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "700", lineHeight: 16, letterSpacing: 0.4 },
  button: { fontSize: 16, fontWeight: "700", lineHeight: 20 },
};

import logo from "figma:asset/8536944db60aa84480edfb5d9399542fc5e3c55d.png";

interface SenacLogoProps {
  variant?: "default" | "white";
}

export function SenacLogo({ variant = "default" }: SenacLogoProps) {
  return (
    <img
      src={logo}
      alt="SENAC"
      className={`h-12 w-auto ${variant === "white" ? "brightness-0 invert" : ""}`}
    />
  );
}
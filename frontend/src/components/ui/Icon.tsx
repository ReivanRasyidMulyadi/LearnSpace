// Thin Ionicons wrapper so the icon lib can be swapped in one place.
import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface IconProps {
  name: IoniconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

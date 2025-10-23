import React from "react";
import {
  FontAwesome5,
  Fontisto,
  MaterialIcons,
  Ionicons,
  Feather,
  AntDesign,
  Entypo,
  MaterialCommunityIcons,
  FontAwesome6,
  FontAwesome,
  Foundation,
} from "@expo/vector-icons";

const IconLibraries = {
  FontAwesome5,
  FontAwesome6,
  FontAwesome,
  Fontisto,
  MaterialIcons,
  Ionicons,
  Feather,
  AntDesign,
  Entypo,
  MaterialCommunityIcons,
  Foundation,
};

export const Icon = ({
  library,
  name,
  size = 24,
  color = "black",
  style,
  onPress,
  className,
}) => {
  const IconComponent = IconLibraries[library];

  if (!IconComponent) {
    console.error(`Icon library "${library}" not found.`);
    return null;
  }

  return (
    <IconComponent
      name={name}
      size={size}
      color={color}
      style={style}
      onPress={onPress}
      className={className}
    />
  );
};

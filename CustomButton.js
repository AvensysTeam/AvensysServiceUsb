import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles';

const CustomButton = ({ title, onPress, style, styletext }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={[styles.textbutton, styletext]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

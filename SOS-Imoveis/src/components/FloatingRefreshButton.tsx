import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { RefreshCw } from 'lucide-react-native';

interface Props {
  onPress: () => void;
}

export const FloatingRefreshButton: React.FC<Props> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <RefreshCw size={24} color="#FFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  },
});

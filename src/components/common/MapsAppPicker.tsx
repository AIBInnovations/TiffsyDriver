import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Switch } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { setPreferredIosMapsApp, type IosMapsApp } from '../../utils/maps';

interface MapsAppPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (app: IosMapsApp) => void;
}

export default function MapsAppPicker({ visible, onClose, onSelect }: MapsAppPickerProps) {
  const [remember, setRemember] = useState(true);

  const handlePick = async (app: IosMapsApp) => {
    if (remember) {
      await setPreferredIosMapsApp(app);
    }
    onClose();
    setTimeout(() => onSelect(app), 100);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Open Navigation</Text>
            <Text style={styles.message}>Which maps app would you like to use?</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, styles.firstOption]}
              onPress={() => handlePick('google')}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#10B98115' }]}>
                <MaterialCommunityIcons name="google-maps" size={22} color="#10B981" />
              </View>
              <Text style={styles.optionText}>Google Maps</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, styles.lastOption]}
              onPress={() => handlePick('apple')}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#3B82F615' }]}>
                <MaterialCommunityIcons name="map" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.optionText}>Apple Maps</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.rememberRow}>
            <Text style={styles.rememberText}>Set as default</Text>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  firstOption: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  lastOption: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 0,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  rememberText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

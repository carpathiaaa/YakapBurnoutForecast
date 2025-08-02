// navigation/MainNavigator.tsx
import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Modal, Pressable, View, Text, TouchableOpacity } from 'react-native';

import BottomTabNavigator from './BottomTabNavigator';
import OnboardingScreen from '../features/onboarding/OnboardingScreen';

const Stack = createStackNavigator();

// Modal Context
interface ModalContextType {
  isModalVisible: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export default function MainNavigator() {
  // Simulate onboarding state. Replace with real persisted value later.
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const modalContextValue = {
    isModalVisible,
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={modalContextValue}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!hasOnboarded ? (
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen {...props} onDone={() => setHasOnboarded(true)} />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Weekly Check-in Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        {/* Backdrop with darkened background */}
        <Pressable 
          onPress={closeModal}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Modal content */}
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              borderWidth: 2,
              borderColor: 'black',
              padding: 24,
              marginHorizontal: 16,
              width: 320,
              maxWidth: '90%',
            }}
          >
            {/* Header with X button */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'black' }}>Weekly Check-in</Text>
              <TouchableOpacity 
                onPress={closeModal}
                style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 24, color: '#666' }}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Modal content placeholder */}
            <View style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#666', textAlign: 'center' }}>Modal content will go here</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ModalContext.Provider>
  );
}

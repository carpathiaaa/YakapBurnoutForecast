import "./global.css";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import MainNavigator from './navigation/MainNavigator';


export default function App() {
  return <MainNavigator />;
}

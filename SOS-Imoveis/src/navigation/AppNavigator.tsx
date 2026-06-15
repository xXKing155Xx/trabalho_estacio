import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BrokersScreen from '../screens/BrokersScreen';
import ClientsScreen from '../screens/ClientsScreen';
import HomeScreen from '../screens/HomeScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import AgendaScreen from '../screens/AgendaScreen';
import CommissionScreen from '../screens/CommissionScreen';
import ContractsScreen from '../screens/ContractsScreen';
import AccessibilityScreen from '../screens/AccessibilityScreen';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerStyle: { backgroundColor: '#07111F' }, headerTintColor: '#FFF', contentStyle: { backgroundColor: '#07111F' } }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'SOS Imóveis' }} />
        <Stack.Screen name="Brokers" component={BrokersScreen} options={{ title: 'Corretores' }} />
        <Stack.Screen name="Clients" component={ClientsScreen} options={{ title: 'Clientes' }} />
        <Stack.Screen name="Properties" component={PropertiesScreen} options={{ title: 'Imóveis' }} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'Assistente Imobiliário Digital' }} />
        <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ title: 'Calculadora Imobiliária' }} />
        <Stack.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda de Visitas' }} />
        <Stack.Screen name="Commission" component={CommissionScreen} options={{ title: 'Comissão Estimada' }} />
        <Stack.Screen name="Contracts" component={ContractsScreen} options={{ title: 'Contratos' }} />
        <Stack.Screen name="Acessibilidade" component={AccessibilityScreen} options={{ title: 'Acessibilidade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

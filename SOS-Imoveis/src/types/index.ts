export interface Broker {
  id: number;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  registrationNumber: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  budget: string;
  financingMethod: string;
}

export interface Property {
  id: number;
  title: string;
  address: string;
  price: string;
  type: string;
  brokerName?: string;
  photos?: string;
}

export interface Contract {
  id: number;
  name: string;
  pdfUri: string;
  password: string;
}

export interface AccessibilityTerm {
  id: number;
  term: string;
  description: string;
  videoUri: string;
  category?: string;
}

export interface UserAccount {
  id: number;
  login: string;
  password: string;
  email: string;
  role: 'corretor' | 'cliente';
}

export type RootStackParamList = {
  Welcome: undefined;
  Home: { userRole?: 'corretor' | 'cliente' } | undefined;
  Brokers: { selectedBrokerName?: string; userRole?: 'corretor' | 'cliente' } | undefined;
  Clients: { userRole?: 'corretor' | 'cliente' } | undefined;
  Properties: { selectedPropertyId?: number; userRole?: 'corretor' | 'cliente' } | undefined;
  Chatbot: { userRole?: 'corretor' | 'cliente' } | undefined;
  Calculator: undefined;
  Agenda: { userRole?: 'corretor' | 'cliente' } | undefined;
  Commission: { userRole?: 'corretor' | 'cliente' } | undefined;
  Contracts: { userRole?: 'corretor' | 'cliente' } | undefined;
  Acessibilidade: { userRole?: 'corretor' | 'cliente' } | undefined;
};

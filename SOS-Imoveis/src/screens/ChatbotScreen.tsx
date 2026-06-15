import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../types';

const quickTopics = [
  { category: 'Corretores', label: 'Prospecção', answer: 'Prospecção eficiente começa com imóveis bem posicionados, preço compatível e apresentação clara para atrair mais interessados.' },
  { category: 'Corretores', label: 'Negociação', answer: 'Na negociação, compare preço de mercado, prazo e condições para fechar com segurança e agilidade.' },
  { category: 'Corretores', label: 'Atendimento', answer: 'Um bom atendimento combina clareza, rapidez e orientação sobre documentos, valores e próximos passos.' },
  { category: 'Corretores', label: 'Lead qualificado', answer: 'Priorize clientes com perfil, renda e objetivo claros para aumentar a chance de conversão.' },
  { category: 'Corretores', label: 'Documentação', answer: 'A documentação correta evita atrasos, reduz riscos e deixa a transação mais confiável para todas as partes.' },
  { category: 'Corretores', label: 'Follow-up', answer: 'O follow-up rápido mantém o cliente informado, aumenta a confiança e reduz o risco de perder a oportunidade.' },
  { category: 'Corretores', label: 'Fechamento', answer: 'Fechar bem significa alinhar valor, prazo, documentação e expectativas antes de formalizar a venda.' },
  { category: 'Corretores', label: 'Apresentação', answer: 'Uma apresentação clara destaca pontos fortes do imóvel, do bairro e das condições de negociação.' },
  { category: 'Corretores', label: 'Visita', answer: 'Na visita, mostre a localização, a iluminação, a circulação e os diferenciais que atraem o comprador.' },
  { category: 'Corretores', label: 'Parceria', answer: 'Parcerias com escritórios, bancos e imobiliárias ampliam o alcance e facilitam o fechamento de negócios.' },
  { category: 'Clientes', label: 'Financiamento', answer: 'Para financiamento, compare entrada, prazo, taxa e valor total. Entrada maior reduz parcela e custo total.' },
  { category: 'Clientes', label: 'Parcela ideal', answer: 'A parcela ideal é aquela que não compromete mais de 30% da renda mensal do comprador.' },
  { category: 'Clientes', label: 'Aluguel', answer: 'Para aluguel, avalie preço de locação, condomínio, manutenção e risco de vacância.' },
  { category: 'Clientes', label: 'Entrada', answer: 'A entrada reduz o valor financiado e costuma diminuir a parcela e os juros totais.' },
  { category: 'Clientes', label: 'Documentos', answer: 'Geralmente são usados RG, CPF, comprovante de renda, certidões e documentos do imóvel.' },
  { category: 'Clientes', label: 'Taxas', answer: 'Considere taxas de cartório, escritura, registro e condomínio para não ter surpresas no orçamento.' },
  { category: 'Clientes', label: 'Prazo', answer: 'Um prazo maior reduz a parcela, mas aumenta o valor total pago ao longo do financiamento.' },
  { category: 'Clientes', label: 'Investimento', answer: 'Avalie valorização, custo total e potencial de aluguel antes de decidir pelo imóvel ideal.' },
  { category: 'Clientes', label: 'Comparação', answer: 'Compare opções semelhantes para escolher a melhor relação custo, localização e conforto para o cliente.' },
  { category: 'Clientes', label: 'Segurança', answer: 'Verifique documentação, histórico do imóvel e condições legais para garantir uma compra segura.' },
  { category: 'Imóveis', label: 'Valorização', answer: 'A valorização cresce com localização, infraestrutura, mobilidade e qualidade do imóvel.' },
  { category: 'Imóveis', label: 'Venda rápida', answer: 'Para vender rápido, use fotos boas, preço realista e destaque a localização.' },
  { category: 'Imóveis', label: 'Condomínio', answer: 'O condomínio deve ser analisado junto com o aluguel e as despesas mensais do imóvel.' },
  { category: 'Imóveis', label: 'Locação', answer: 'Em locação, avalie inquilino, prazo do contrato e manutenção do imóvel.' },
  { category: 'Imóveis', label: 'Investimento', answer: 'Um bom investimento imobiliário combina localização, valorização e fluxo de aluguel estável.' },
  { category: 'Imóveis', label: 'Layout', answer: 'O layout eficiente melhora circulação, conforto e a percepção de espaço para compradores e locatários.' },
  { category: 'Imóveis', label: 'Localização', answer: 'A localização define acesso a escolas, comércio, transporte e potencial de valorização no mercado.' },
  { category: 'Imóveis', label: 'Fotos', answer: 'Fotos bem iluminadas destacam a beleza do imóvel e ajudam a atrair mais interessados rapidamente.' },
  { category: 'Imóveis', label: 'Manutenção', answer: 'Manutenção preventiva aumenta a vida útil do imóvel e melhora a experiência dos futuros ocupantes.' },
  { category: 'Imóveis', label: 'Mercado', answer: 'Acompanhar o mercado ajuda a ajustar preço, estratégia de venda e momento ideal para anunciar.' },
];

export default function ChatbotScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const route = useRoute<RouteProp<RootStackParamList, 'Chatbot'>>();
  const userRole = route.params?.userRole ?? 'corretor';
  const isClientUser = userRole === 'cliente';
  const initialMessage = 'Olá! Toque em um tema para receber uma resposta rápida e prática sobre imóveis.';
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string }>>([
    { role: 'bot', text: initialMessage },
  ]);

  const filteredTopics = isClientUser
    ? quickTopics.filter((topic) => topic.category === 'Clientes' || topic.category === 'Imóveis')
    : quickTopics.filter((topic) => topic.category !== 'Clientes');

  const groupedTopics = filteredTopics.reduce<Record<string, typeof filteredTopics>>((acc, topic) => {
    acc[topic.category] = [...(acc[topic.category] || []), topic];
    return acc;
  }, {});

  const handleTopicPress = (topic: { label: string; answer: string }) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: topic.label },
      { role: 'bot', text: topic.answer },
    ]);
  };

  const clearConversation = () => {
    setMessages([{ role: 'bot', text: initialMessage }]);
  };

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', input: '#0F1C2B', text: '#FFF', muted: '#C7D2E0', border: '#253A53', accent: '#5EEAD4' }
    : { background: '#F5F7FB', surface: '#FFFFFF', input: '#EEF4FF', text: '#111827', muted: '#4B5563', border: '#D1D5DB', accent: '#5EEAD4' };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: palette.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
      <AccessibilityFab />
      <View style={styles.headingRow}>
        <View style={styles.headingTextBox}>
          <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Assistente Imobiliário Offline</Text>
          <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>Respostas rápidas por tópicos, com temas relevantes de compra, venda, aluguel e financiamento.</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearConversation}>
          <Text style={styles.clearButtonText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.topicBox, { backgroundColor: palette.surface, borderColor: palette.border }]} contentContainerStyle={styles.topicBoxContent} showsVerticalScrollIndicator={false} bounces={false}>
        <Text style={[styles.topicTitle, { color: palette.accent }]}>Tópicos por perfil</Text>
        <Text style={[styles.topicHint, { color: palette.muted }]}>Selecione um tema para receber uma resposta prática.</Text>
        {Object.entries(groupedTopics).map(([category, topics]) => (
          <View key={category} style={styles.topicSection}>
            <Text style={[styles.sectionLabel, { color: palette.accent }]}>{category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicScrollContent} bounces={false}>
              {topics.map((topic) => (
                <TouchableOpacity key={topic.label} style={[styles.topicChip, { backgroundColor: palette.input, borderColor: palette.border }]} onPress={() => handleTopicPress(topic)}>
                  <Text style={[styles.topicChipText, { color: palette.text }]}>{topic.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <ScrollView style={[styles.chatBox, { backgroundColor: palette.surface, borderColor: palette.border }]} contentContainerStyle={styles.chatContent}>
        {messages.map((message, index) => {
          const isDark = theme === 'dark';
          const bubbleStyle = message.role === 'user'
            ? { backgroundColor: isDark ? '#1E3A8A' : '#2563EB', borderColor: isDark ? '#000000' : 'transparent', borderWidth: isDark ? 1 : 0 }
            : { backgroundColor: isDark ? '#0F172A' : '#EEF4FF', borderColor: isDark ? '#000000' : '#D1D5DB', borderWidth: 1 };
          const textColor = isDark ? '#F8FAFC' : '#111827';

          return (
            <View key={`${message.role}-${index}`} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.botBubble, bubbleStyle]}>
              <Text style={[styles.bubbleText, { color: textColor }]}>{message.text}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footerNote, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.footerText, { color: palette.muted }]}>Resposta rápida por tópicos — toque em um tema para iniciar.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F', padding: 18 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  headingTextBox: { flex: 1, paddingRight: 8 },
  heading: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  description: { color: '#C7D2E0', marginTop: 4 },
  clearButton: { backgroundColor: '#1D4ED8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  clearButtonText: { color: '#FFF', fontWeight: '700' },
  topicBox: { backgroundColor: '#12253C', borderRadius: 18, padding: 10, marginBottom: 10, maxHeight: 270 },
  topicBoxContent: { paddingBottom: 18 },
  topicTitle: { color: '#5EEAD4', fontWeight: '700', marginBottom: 2 },
  topicHint: { color: '#BFDBFE', fontSize: 12, marginBottom: 8 },
  topicSection: { marginBottom: 8 },
  sectionLabel: { color: '#F9A8D4', fontWeight: '700', marginBottom: 6 },
  topicList: { marginBottom: 2 },
  topicScrollContent: { alignItems: 'center', paddingRight: 4 },
  topicChip: { backgroundColor: '#0F1C2B', borderColor: '#1D4ED8', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8 },
  topicChipText: { color: '#E5EEF8', fontWeight: '700' },
  chatBox: { flex: 1.4, backgroundColor: '#12253C', borderRadius: 18, padding: 10, minHeight: 240 },
  chatContent: { paddingBottom: 10 },
  bubble: { borderRadius: 14, padding: 10, marginBottom: 8, maxWidth: '88%' },
  userBubble: { backgroundColor: '#2563EB', alignSelf: 'flex-end' },
  botBubble: { backgroundColor: '#EEF4FF', alignSelf: 'flex-start' },
  bubbleText: { color: '#FFF' },
  footerNote: { marginTop: 8, padding: 10, borderRadius: 14, borderWidth: 1 },
  footerText: { color: '#BFDBFE', fontSize: 12 },
});

import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { Eye, EyeOff } from 'lucide-react-native';

import { AppLogo } from '../components/AppLogo';
import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import { createUser, deleteUser, listUsers, loginUser, resetUserPassword } from '../database/db';
import type { RootStackParamList, UserAccount } from '../types';

export default function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, fontScale } = useAccessibilitySettings();
  const [mode, setMode] = useState<'login' | 'cadastro'>('login');
  const [role, setRole] = useState<'corretor' | 'cliente'>('cliente');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [showLocalManager, setShowLocalManager] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(false);

  const isLight = theme === 'light';
  const AUTO_LOGIN_KEY = 'sos_imoveis_last_login';
  const AUTO_LOGIN_FLAG_KEY = 'sos_imoveis_auto_login';
  const palette = {
    background: isLight ? '#F4F8FF' : '#07111F',
    panel: isLight ? '#FFFFFF' : '#12253C',
    border: isLight ? '#D8E3F2' : '#253A53',
    text: isLight ? '#0F172A' : '#FFF',
    muted: isLight ? '#334155' : '#C7D2E0',
    accent: isLight ? '#2563EB' : '#5EEAD4',
    input: isLight ? '#F8FAFC' : '#0F172A',
  };

  const saveLastLogin = async (nextLogin: string, nextPassword: string, nextRole: 'corretor' | 'cliente' = role) => {
    await SecureStore.setItemAsync(AUTO_LOGIN_KEY, JSON.stringify({ login: nextLogin, password: nextPassword, role: nextRole }));
    await SecureStore.setItemAsync(AUTO_LOGIN_FLAG_KEY, autoLoginEnabled ? 'true' : 'false');
  };

  const resetManualFields = () => {
    setLogin('');
    setEmail('');
    setPassword('');
    setResetEmail('');
    setNewPassword('');
  };

  const handleContinue = async () => {
    if (mode === 'cadastro') {
      if (!login.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Atenção', 'Informe nome, e-mail e senha para cadastrar.');
        return;
      }

      const created = await createUser({
        login: login.trim(),
        password: password.trim(),
        email: email.trim(),
        role,
      });

      if (!created) {
        Alert.alert('Erro', 'Não foi possível cadastrar. Verifique se esse usuário já existe.');
        return;
      }

      navigation.navigate('Home', { userRole: role });
      return;
    }

    if (!login.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Informe e-mail e senha para entrar.');
      return;
    }

    const user = await loginUser(login.trim(), password.trim());

    if (!user) {
      Alert.alert('Acesso negado', 'E-mail ou senha inválidos.');
      return;
    }

    await saveLastLogin(login.trim(), password.trim(), user.role);
    navigation.navigate('Home', { userRole: user.role });
  };

  const loadLocalManager = async () => {
    setUsers(await listUsers());
  };

  const loadSavedCredentials = async () => {
    try {
      const [storedLogin, storedFlag] = await Promise.all([
        SecureStore.getItemAsync(AUTO_LOGIN_KEY),
        SecureStore.getItemAsync(AUTO_LOGIN_FLAG_KEY),
      ]);

      const autoEnabled = storedFlag === 'true';
      setAutoLoginEnabled(autoEnabled);

      if (autoEnabled && storedLogin) {
        const parsed = JSON.parse(storedLogin) as { login?: string; password?: string };
        setLogin(parsed.login ?? '');
        setPassword(parsed.password ?? '');
      }
    } catch {
      setAutoLoginEnabled(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setShowResetPanel(false);
      setShowLocalManager(false);
      setShowResetPassword(false);
      loadSavedCredentials();
    }, [])
  );

  useEffect(() => {
    if (showLocalManager) {
      loadLocalManager();
    }
  }, [showLocalManager]);

  const handleLocalManager = () => {
    setShowLocalManager((prev) => !prev);
    setShowResetPanel(false);
  };

  const handleDeleteUser = async (id: number) => {
    Alert.alert('Excluir login', 'Deseja remover este usuário cadastrado localmente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteUser(id);
          await loadLocalManager();
        },
      },
    ]);
  };

  const handleQuickLogin = async (user: UserAccount) => {
    try {
      const foundUser = await loginUser(user.login, user.password);

      if (!foundUser) {
        Alert.alert('Erro', 'Não foi possível entrar com este usuário cadastrado.');
        return;
      }

      await SecureStore.setItemAsync(AUTO_LOGIN_KEY, JSON.stringify({ login: foundUser.login, password: foundUser.password, role: foundUser.role }));
      await SecureStore.setItemAsync(AUTO_LOGIN_FLAG_KEY, 'true');
      setAutoLoginEnabled(true);
      navigation.navigate('Home', { userRole: foundUser.role });
    } catch {
      Alert.alert('Erro', 'Falha ao entrar com este usuário.');
    }
  };

  const handleForgotPassword = () => {
    setShowResetPanel((prev) => !prev);
    setShowLocalManager(false);
  };

  const handleResetPassword = async () => {
    const emailValue = resetEmail.trim();
    const passwordValue = newPassword.trim();

    if (!emailValue || !passwordValue) {
      Alert.alert('Atenção', 'Informe o e-mail e a nova senha para atualizar.');
      return;
    }

    const ok = await resetUserPassword(emailValue, passwordValue);

    if (!ok) {
      Alert.alert('Falha', 'Não foi possível atualizar a senha neste momento.');
      return;
    }

    setResetEmail('');
    setNewPassword('');
    setShowResetPanel(false);
    await loadLocalManager();
    Alert.alert('Senha atualizada', 'A nova senha foi salva e já aparece no gerenciador de cadastros.');
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <AppLogo theme={theme} />
      <Text style={[styles.eyebrow, { color: palette.accent, fontSize: 12 * fontScale }]}>Acesso rápido</Text>
      <Text style={[styles.title, { color: palette.text, fontSize: 28 * fontScale }]}>Bem-vindo ao SOS Imóveis</Text>
      <Text style={[styles.subtitle, { color: palette.muted, fontSize: 14 * fontScale }]}>Use esta tela para entrar ou cadastrar manualmente. Os dados ficam apenas nesta sessão.</Text>

      <View style={[styles.card, { backgroundColor: palette.panel, borderColor: palette.border }]}> 
        <View style={styles.segmented}> 
          <TouchableOpacity
            style={[styles.segmentButton, mode === 'login' && styles.segmentButtonActive, { borderColor: palette.border }]}
            onPress={() => {
              resetManualFields();
              setMode('login');
            }}
          >
            <Text style={[styles.segmentText, { color: mode === 'login' ? palette.accent : palette.muted }]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, mode === 'cadastro' && styles.segmentButtonActive, { borderColor: palette.border }]}
            onPress={() => {
              resetManualFields();
              setMode('cadastro');
            }}
          >
            <Text style={[styles.segmentText, { color: mode === 'cadastro' ? palette.accent : palette.muted }]}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.roleRow}>
          {(['corretor', 'cliente'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.roleChip, role === item && styles.roleChipActive, { borderColor: palette.border }]}
              onPress={() => setRole(item)}
            >
              <Text style={[styles.roleChipText, { color: role === item ? palette.accent : palette.muted }]}>
                {item === 'corretor' ? 'Corretor' : 'Cliente'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'cadastro' ? (
          <TextInput
            value={login}
            onChangeText={setLogin}
            placeholder="Nome"
            autoCapitalize="words"
            placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
            style={[styles.input, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
          />
        ) : (
          <TextInput
            value={login}
            onChangeText={setLogin}
            placeholder="Login"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
            style={[styles.input, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
          />
        )}

        {mode === 'cadastro' ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
            style={[styles.input, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
          />
        ) : null}

        <View style={styles.inputWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Senha"
            secureTextEntry={!showPassword}
            placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
            style={[styles.input, styles.inputWithIcon, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <Eye size={18} color={palette.accent} /> : <EyeOff size={18} color={palette.accent} />}
          </TouchableOpacity>
        </View>

        {mode === 'login' ? (
          <TouchableOpacity
            style={[styles.rememberBox, { borderColor: palette.border, backgroundColor: palette.input }]}
            onPress={async () => {
              const nextValue = !autoLoginEnabled;
              setAutoLoginEnabled(nextValue);
              await SecureStore.setItemAsync(AUTO_LOGIN_FLAG_KEY, nextValue ? 'true' : 'false');
            }}
            activeOpacity={0.9}
          >
            <View style={[styles.checkbox, autoLoginEnabled && styles.checkboxChecked, { borderColor: palette.border }]} />
            <View style={styles.rememberTextBox}>
              <Text style={[styles.rememberTitle, { color: palette.text }]}>Login automático</Text>
              <Text style={[styles.rememberHint, { color: palette.muted }]}>Mantém o último login salvo para preencher e entrar mais rápido.</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.accent }]} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>{mode === 'cadastro' ? 'Cadastrar' : 'Entrar no app'}</Text>
        </TouchableOpacity>

        <View style={styles.linksRow}>
          <TouchableOpacity style={[styles.secondaryAction, { borderColor: palette.border }]} onPress={handleLocalManager}>
            <Text style={[styles.linkText, { color: palette.accent }]}>Gerenciar cadastros</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryAction, { borderColor: palette.border }]} onPress={handleForgotPassword}>
            <Text style={[styles.linkText, { color: palette.accent }]}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        {showResetPanel ? (
          <View style={[styles.resetBox, { backgroundColor: palette.input, borderColor: palette.border }]}> 
            <Text style={[styles.resetTitle, { color: palette.text }]}>Atualizar senha</Text>
            <TextInput
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="E-mail do cadastro"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
              style={[styles.input, { backgroundColor: palette.panel, color: palette.text, borderColor: palette.border }]}
            />
            <View style={styles.inputWrap}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nova senha"
                secureTextEntry={!showResetPassword}
                placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
                style={[styles.input, styles.inputWithIcon, { backgroundColor: palette.panel, color: palette.text, borderColor: palette.border }]}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowResetPassword((prev) => !prev)}
                accessibilityLabel={showResetPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
              >
                {showResetPassword ? <Eye size={18} color={palette.accent} /> : <EyeOff size={18} color={palette.accent} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.accent }]} onPress={handleResetPassword}>
              <Text style={styles.primaryButtonText}>Atualizar senha</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showLocalManager ? (
          <View style={[styles.managerBox, { backgroundColor: palette.input, borderColor: palette.border }]}> 
            <Text style={[styles.managerTitle, { color: palette.text }]}>Cadastros de acesso</Text>
            <Text style={[styles.managerHint, { color: palette.muted }]}>Exclua os usuários cadastrados na tela de login/cadastro.</Text>
            <ScrollView style={styles.managerScroll} nestedScrollEnabled>
              {users.length ? users.map((item) => (
                <View key={item.id} style={[styles.managerItem, { borderColor: palette.border }]}> 
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.managerItemTitle, { color: palette.text }]}>{item.login}</Text>
                    <Text style={[styles.managerItemText, { color: palette.muted }]}>{item.email || 'Sem e-mail'}</Text>
                    <Text style={[styles.managerItemText, { color: palette.accent }]}>Usuário: {item.role === 'corretor' ? 'Corretor' : 'Cliente'}</Text>
                  </View>
                  <View style={styles.actionColumn}>
                    <TouchableOpacity style={styles.loginChip} onPress={() => handleQuickLogin(item)}>
                      <Text style={styles.loginChipText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteChip} onPress={() => handleDeleteUser(item.id)}>
                      <Text style={styles.deleteChipText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )) : <Text style={[styles.emptyState, { color: palette.muted }]}>Nenhum usuário cadastrado.</Text>}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <View style={styles.accessibilityAnchor}>
        <AccessibilityFab />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 32 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 2, marginTop: 12 },
  title: { fontWeight: '800', marginTop: 8 },
  subtitle: { marginTop: 8, lineHeight: 20 },
  card: { marginTop: 18, borderRadius: 24, borderWidth: 1, padding: 18 },
  segmented: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  segmentButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  segmentButtonActive: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  segmentText: { fontWeight: '700' },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  roleChip: { flex: 1, borderWidth: 1, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  roleChipActive: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  roleChipText: { fontWeight: '700', textTransform: 'capitalize' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  inputWrap: { position: 'relative', marginBottom: 10 },
  inputWithIcon: { paddingRight: 46 },
  eyeButton: { position: 'absolute', right: 12, top: 12, padding: 4 },
  primaryButton: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  rememberBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 10, marginTop: 6 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, marginRight: 10 },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  rememberTextBox: { flex: 1 },
  rememberTitle: { fontSize: 13, fontWeight: '700' },
  rememberHint: { fontSize: 11, marginTop: 2 },
  primaryButtonText: { color: '#FFF', fontWeight: '800' },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  secondaryAction: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  linkText: { fontSize: 12, fontWeight: '700' },
  resetBox: { marginTop: 12, borderWidth: 1, borderRadius: 18, padding: 10 },
  resetTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  managerBox: { marginTop: 12, borderWidth: 1, borderRadius: 18, padding: 10 },
  managerTitle: { fontSize: 15, fontWeight: '800' },
  managerHint: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  managerScroll: { maxHeight: 220 },
  managerSectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 4, marginBottom: 4 },
  managerItem: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 8, marginBottom: 8 },
  managerItemTitle: { fontSize: 13, fontWeight: '700' },
  managerItemText: { fontSize: 11, marginTop: 2 },
  actionColumn: { gap: 6, alignItems: 'stretch', minWidth: 96 },
  loginChip: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, minWidth: 88, alignItems: 'center' },
  loginChipText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  deleteChip: { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, minWidth: 88, alignItems: 'center' },
  deleteChipText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  emptyState: { fontSize: 12, marginBottom: 6 },
  fab: { position: 'absolute', left: 18, bottom: 72, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6 },
  fabText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  accessibilityAnchor: { position: 'absolute', right: 18, bottom: 180, zIndex: 10 },
});

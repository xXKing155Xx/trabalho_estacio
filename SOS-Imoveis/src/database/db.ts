import * as SQLite from 'expo-sqlite';

import { Broker, Client, Property, Contract, AccessibilityTerm, UserAccount } from '../types';

export interface PropertyReview {
  id: number;
  propertyId: number;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const db = SQLite.openDatabaseSync('sos_imoveis.db');

export const initDatabase = async (): Promise<void> => {
  db.execSync(`CREATE TABLE IF NOT EXISTS brokers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    specialty TEXT,
    registrationNumber TEXT
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    budget TEXT,
    financingMethod TEXT
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    address TEXT,
    price TEXT,
    type TEXT,
    brokerName TEXT,
    photos TEXT
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pdfUri TEXT,
    password TEXT NOT NULL
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS accessibility_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term TEXT NOT NULL,
    description TEXT NOT NULL,
    videoUri TEXT NOT NULL,
    category TEXT
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cliente'
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS property_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER NOT NULL,
    clientName TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(propertyId, clientName)
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS property_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER NOT NULL,
    clientName TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(propertyId, clientName)
  );`);

  const brokerColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(brokers)');
  if (!brokerColumns.some((column) => column.name === 'registrationNumber')) {
    db.execSync('ALTER TABLE brokers ADD COLUMN registrationNumber TEXT DEFAULT \"\";');
  }

  const clientColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(clients)');
  if (!clientColumns.some((column) => column.name === 'financingMethod')) {
    db.execSync('ALTER TABLE clients ADD COLUMN financingMethod TEXT DEFAULT \"\";');
  }

  const propertyColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(properties)');
  if (!propertyColumns.some((column) => column.name === 'brokerName')) {
    db.execSync('ALTER TABLE properties ADD COLUMN brokerName TEXT DEFAULT "";');
  }
  if (!propertyColumns.some((column) => column.name === 'photos')) {
    db.execSync('ALTER TABLE properties ADD COLUMN photos TEXT;');
  }

  const termCount = db.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM accessibility_terms');
  if ((termCount[0]?.count ?? 0) === 0) {
    db.execSync(`INSERT INTO accessibility_terms (term, description, videoUri, category) VALUES
      ('Comprar imóvel', 'Entenda o passo a passo para comprar seu imóvel com segurança.', '', 'Imóveis'),
      ('Vender imóvel', 'Aprenda como preparar, divulgar e fechar a venda com clareza.', '', 'Imóveis'),
      ('Alugar imóvel', 'Saiba como avaliar locação, contrato e documentação.', '', 'Imóveis'),
      ('Financiamento', 'Entenda entrada, parcelas e taxas de financiamento.', '', 'Financeiro'),
      ('Documentação', 'Veja os documentos e informações necessárias para cada etapa.', '', 'Documentos'),
      ('Corretores', 'Conheça como os corretores ajudam na negociação e no atendimento.', '', 'Atendimento'),
      ('Clientes', 'Aprenda como acompanhar clientes, visitas e propostas.', '', 'Atendimento');`);
  }
};

const runInsert = (source: string, params: Array<string | number | boolean | null>): number => {
  const result = db.runSync(source, params);
  return result.lastInsertRowId;
};

const runUpdate = (source: string, params: Array<string | number | boolean | null>): void => {
  db.runSync(source, params);
};

const runDelete = (source: string, params: Array<string | number | boolean | null>): void => {
  db.runSync(source, params);
};

const fetchAll = <T,>(source: string): T[] => db.getAllSync<T>(source);

export const listBrokers = async (): Promise<Broker[]> => fetchAll<Broker>('SELECT * FROM brokers ORDER BY id DESC');
export const addBroker = async (broker: Omit<Broker, 'id'>): Promise<number> =>
  runInsert('INSERT INTO brokers (name, phone, email, specialty, registrationNumber) VALUES (?, ?, ?, ?, ?)', [broker.name, broker.phone, broker.email, broker.specialty, broker.registrationNumber]);
export const updateBroker = async (broker: Broker): Promise<void> =>
  runUpdate('UPDATE brokers SET name = ?, phone = ?, email = ?, specialty = ?, registrationNumber = ? WHERE id = ?', [broker.name, broker.phone, broker.email, broker.specialty, broker.registrationNumber, broker.id]);
export const deleteBroker = async (id: number): Promise<void> => runDelete('DELETE FROM brokers WHERE id = ?', [id]);

export const listClients = async (): Promise<Client[]> => fetchAll<Client>('SELECT * FROM clients ORDER BY id DESC');
export const addClient = async (client: Omit<Client, 'id'>): Promise<number> =>
  runInsert('INSERT INTO clients (name, phone, email, budget, financingMethod) VALUES (?, ?, ?, ?, ?)', [client.name, client.phone, client.email, client.budget, client.financingMethod]);
export const updateClient = async (client: Client): Promise<void> =>
  runUpdate('UPDATE clients SET name = ?, phone = ?, email = ?, budget = ?, financingMethod = ? WHERE id = ?', [client.name, client.phone, client.email, client.budget, client.financingMethod, client.id]);
export const deleteClient = async (id: number): Promise<void> => runDelete('DELETE FROM clients WHERE id = ?', [id]);

export const listProperties = async (): Promise<Property[]> => fetchAll<Property>('SELECT * FROM properties ORDER BY id DESC');
export const addProperty = async (property: Omit<Property, 'id'>): Promise<number> =>
  runInsert('INSERT INTO properties (title, address, price, type, brokerName, photos) VALUES (?, ?, ?, ?, ?, ?)', [property.title, property.address, property.price, property.type, property.brokerName ?? '', property.photos ?? '']);
export const updateProperty = async (property: Property): Promise<void> =>
  runUpdate('UPDATE properties SET title = ?, address = ?, price = ?, type = ?, brokerName = ?, photos = ? WHERE id = ?', [property.title, property.address, property.price, property.type, property.brokerName ?? '', property.photos ?? '', property.id]);
export const deleteProperty = async (id: number): Promise<void> => runDelete('DELETE FROM properties WHERE id = ?', [id]);

export const listPropertyReviews = async (): Promise<PropertyReview[]> => fetchAll<PropertyReview>('SELECT * FROM property_reviews ORDER BY id DESC');
export const listFavoriteProperties = async (clientName: string): Promise<number[]> =>
  fetchAll<{ propertyId: number }>(`SELECT propertyId FROM property_favorites WHERE clientName = '${clientName.replace(/'/g, "''")}' ORDER BY id DESC`).map((item) => item.propertyId);
export const isPropertyFavorite = async (propertyId: number, clientName: string): Promise<boolean> =>
  (await listFavoriteProperties(clientName)).includes(propertyId);
export const togglePropertyFavorite = async (propertyId: number, clientName: string): Promise<void> => {
  const favorite = await isPropertyFavorite(propertyId, clientName);
  if (favorite) {
    runDelete('DELETE FROM property_favorites WHERE propertyId = ? AND clientName = ?', [propertyId, clientName]);
  } else {
    runInsert('INSERT INTO property_favorites (propertyId, clientName) VALUES (?, ?)', [propertyId, clientName]);
  }
};
export const upsertPropertyReview = async (review: Omit<PropertyReview, 'id' | 'createdAt'>): Promise<void> => {
  db.runSync(
    'INSERT INTO property_reviews (propertyId, clientName, rating, comment) VALUES (?, ?, ?, ?) ' +
    'ON CONFLICT(propertyId, clientName) DO UPDATE SET rating = excluded.rating, comment = excluded.comment, createdAt = CURRENT_TIMESTAMP',
    [review.propertyId, review.clientName, review.rating, review.comment]
  );
};
export const deletePropertyReview = async (propertyId: number, clientName: string): Promise<void> =>
  runDelete('DELETE FROM property_reviews WHERE propertyId = ? AND clientName = ?', [propertyId, clientName]);

export const listContracts = async (): Promise<Contract[]> => fetchAll<Contract>('SELECT * FROM contracts ORDER BY id DESC');
export const addContract = async (contract: Omit<Contract, 'id'>): Promise<number> =>
  runInsert('INSERT INTO contracts (name, pdfUri, password) VALUES (?, ?, ?)', [contract.name, contract.pdfUri, contract.password]);
export const updateContract = async (contract: Contract): Promise<void> =>
  runUpdate('UPDATE contracts SET name = ?, pdfUri = ?, password = ? WHERE id = ?', [contract.name, contract.pdfUri, contract.password, contract.id]);
export const deleteContract = async (id: number): Promise<void> => runDelete('DELETE FROM contracts WHERE id = ?', [id]);

export const listAccessibilityTerms = async (): Promise<AccessibilityTerm[]> => fetchAll<AccessibilityTerm>('SELECT * FROM accessibility_terms ORDER BY id ASC');
export const addAccessibilityTerm = async (term: Omit<AccessibilityTerm, 'id'>): Promise<number> =>
  runInsert('INSERT INTO accessibility_terms (term, description, videoUri, category) VALUES (?, ?, ?, ?)', [term.term, term.description, term.videoUri, term.category ?? '']);
export const updateAccessibilityTerm = async (term: AccessibilityTerm): Promise<void> =>
  runUpdate('UPDATE accessibility_terms SET term = ?, description = ?, videoUri = ?, category = ? WHERE id = ?', [term.term, term.description, term.videoUri, term.category ?? '', term.id]);

export const listUsers = async (): Promise<UserAccount[]> => fetchAll<UserAccount>('SELECT * FROM users ORDER BY id DESC');
export const deleteUser = async (id: number): Promise<void> => runDelete('DELETE FROM users WHERE id = ?', [id]);

export const findUserByLogin = async (login: string): Promise<UserAccount | null> => {
  const rows = fetchAll<UserAccount>(`SELECT * FROM users WHERE login = '${login.replace(/'/g, "''")}' LIMIT 1`);
  return rows[0] ?? null;
};

export const findUserByEmail = async (email: string): Promise<UserAccount | null> => {
  const rows = fetchAll<UserAccount>(`SELECT * FROM users WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1`);
  return rows[0] ?? null;
};

export const createUser = async (user: Omit<UserAccount, 'id'>): Promise<boolean> => {
  try {
    runInsert('INSERT INTO users (login, password, email, role) VALUES (?, ?, ?, ?)', [user.login, user.password, user.email, user.role]);
    return true;
  } catch {
    return false;
  }
};

export const loginUser = async (identifier: string, password: string): Promise<UserAccount | null> => {
  const normalizedIdentifier = identifier.trim().replace(/'/g, "''");
  const normalizedPassword = password.replace(/'/g, "''");

  const rows = fetchAll<UserAccount>(
    `SELECT * FROM users WHERE (login = '${normalizedIdentifier}' OR email = '${normalizedIdentifier}') AND password = '${normalizedPassword}' LIMIT 1`
  );

  return rows[0] ?? null;
};

export const resetUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
  try {
    db.runSync('UPDATE users SET password = ? WHERE email = ?', [newPassword, email]);
    return true;
  } catch {
    return false;
  }
};

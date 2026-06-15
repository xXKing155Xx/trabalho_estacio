import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { addProperty, deleteProperty, deletePropertyReview, isPropertyFavorite, listProperties, listPropertyReviews, togglePropertyFavorite, updateProperty, upsertPropertyReview } from '../database/db';
import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import { FloatingRefreshButton } from '../components/FloatingRefreshButton';
import type { Property, RootStackParamList } from '../types';
import * as SecureStore from 'expo-secure-store';

export default function PropertiesScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const searchInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<Property>>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Properties'>>();
  const selectedPropertyId = route.params?.selectedPropertyId;
  const [userRole, setUserRole] = useState<'corretor' | 'cliente'>(route.params?.userRole ?? 'cliente');
  const isClientUser = userRole === 'cliente';
  const [properties, setProperties] = useState<Property[]>([]);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Record<number, { rating: number; comment: string }>>({});
  const [allReviews, setAllReviews] = useState<Array<{ propertyId: number; clientName: string; rating: number; comment: string }>>([]);
  const [favoritePropertyIds, setFavoritePropertyIds] = useState<number[]>([]);
  const [currentClientName, setCurrentClientName] = useState('Cliente');
  const [expandedReviewPropertyIds, setExpandedReviewPropertyIds] = useState<Record<number, boolean>>({});
  const [selectedRatingFilterByProperty, setSelectedRatingFilterByProperty] = useState<Record<number, number | null>>({});
  const [selectedPhotoList, setSelectedPhotoList] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const loadProperties = async () => {
    const data = await listProperties();
    setProperties(data);
  };

  const loadReviews = async (clientName = currentClientName) => {
    const [data, currentProperties] = await Promise.all([listPropertyReviews(), listProperties()]);
    setAllReviews(data);
    setProperties(currentProperties);

    const myReviews = data.reduce<Record<number, { rating: number; comment: string }>>((acc, review) => {
      if (review.clientName === clientName) {
        acc[review.propertyId] = { rating: review.rating, comment: review.comment };
      }
      return acc;
    }, {});

    setReviews(myReviews);

    const favoriteIds = [] as number[];
    for (const property of currentProperties) {
      if (await isPropertyFavorite(property.id, clientName)) favoriteIds.push(property.id);
    }
    setFavoritePropertyIds(favoriteIds);
  };

  useEffect(() => {
    const restoreRole = async () => {
      const routeRole = route.params?.userRole;
      if (routeRole) {
        setUserRole(routeRole);
        return;
      }

      try {
        const stored = await SecureStore.getItemAsync('sos_imoveis_last_login');
        if (stored) {
          const parsed = JSON.parse(stored) as { role?: 'corretor' | 'cliente' };
          if (parsed.role) {
            setUserRole(parsed.role);
          }
        }
      } catch {
        setUserRole('cliente');
      }
    };

    restoreRole();
  }, [route.params]);

  useEffect(() => {
    const loadCurrentClient = async () => {
      try {
        const stored = await SecureStore.getItemAsync('sos_imoveis_last_login');
        if (stored) {
          const parsed = JSON.parse(stored) as { login?: string };
          const nextName = parsed.login || 'Cliente';
          setCurrentClientName(nextName);
          await loadReviews(nextName);
        }
      } catch {
        setCurrentClientName('Cliente');
        await loadReviews('Cliente');
      }
    };

    loadProperties();
    loadCurrentClient();
  }, []);

  useEffect(() => {
    if (!selectedPropertyId || !properties.length) return;

    const index = properties.findIndex((item) => item.id === selectedPropertyId);
    if (index >= 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
      });
    }
  }, [properties, selectedPropertyId]);


  const resetForm = () => {
    setTitle('');
    setAddress('');
    setPrice('');
    setType('');
    setBrokerName('');
    setPhotos([]);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Informe o título do imóvel.');
      return;
    }

    const photosJson = JSON.stringify(photos);

    if (editingId !== null) {
      await updateProperty({ id: editingId, title, address, price, type, brokerName, photos: photosJson });
    } else {
      await addProperty({ title, address, price, type, brokerName, photos: photosJson });
    }

    resetForm();
    await loadProperties();
  };

  const parsePhotos = (value?: string) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : value.split(',').map((item) => item.trim()).filter(Boolean);
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((item) => item !== uri));
  };

  const movePhoto = (fromIndex: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const nextIndex = fromIndex + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(nextIndex, 0, moved);
      return updated;
    });
  };

  const handleEdit = (item: Property) => {
    setEditingId(item.id);
    setTitle(item.title);
    setAddress(item.address);
    setPrice(item.price);
    setType(item.type);
    setBrokerName(item.brokerName || '');
    setPhotos(parsePhotos(item.photos));
  };

  const applyFilter = () => {
    setFilterQuery(searchInput.trim().toLowerCase());
  };

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', input: '#0F1C2B', text: '#FFF', muted: '#C7D2E0', border: '#253A53', accent: '#5EEAD4' }
    : { background: '#F5F7FB', surface: '#FFFFFF', input: '#EEF4FF', text: '#111827', muted: '#4B5563', border: '#D1D5DB', accent: '#2563EB' };

  const filteredProperties = properties.filter((item) => {
    const matchesQuery = [item.title, item.address, item.price, item.type, item.brokerName || '']
      .join(' ')
      .toLowerCase()
      .includes(filterQuery);

    const matchesFavorites = showOnlyFavorites ? favoritePropertyIds.includes(item.id) : true;

    return matchesQuery && matchesFavorites;
  });

  const handleDelete = async (id: number) => {
    await deleteProperty(id);
    await loadProperties();
  };

  const handleReviewChange = (propertyId: number, rating: number, comment: string) => {
    setReviews((prev) => ({
      ...prev,
      [propertyId]: { rating, comment },
    }));
  };

  const handleReviewSave = async (propertyId: number) => {
    const currentReview = reviews[propertyId];
    if (!currentReview?.rating) {
      Alert.alert('Atenção', 'Selecione de 1 a 5 estrelas antes de salvar.');
      return;
    }

    await upsertPropertyReview({
      propertyId,
      clientName: currentClientName,
      rating: currentReview.rating,
      comment: currentReview.comment.trim(),
    });

    await loadReviews();
    Alert.alert('Avaliação salva', 'Sua avaliação foi registrada para este imóvel.');
  };

  const handleToggleFavorite = async (propertyId: number) => {
    await togglePropertyFavorite(propertyId, currentClientName);
    await loadReviews(currentClientName);
  };

  const handleReviewDelete = async (propertyId: number) => {
    await deletePropertyReview(propertyId, currentClientName);
    setReviews((prev) => {
      const next = { ...prev };
      delete next[propertyId];
      return next;
    });
    await loadReviews();
  };

  const handleDeleteReviewComment = async (propertyId: number, clientName: string) => {
    await deletePropertyReview(propertyId, clientName);
    await loadReviews();
  };

  const openPhotoViewer = (photosToShow: string[], startIndex = 0) => {
    setSelectedPhotoList(photosToShow);
    setSelectedPhotoIndex(startIndex);
  };

  const closePhotoViewer = () => {
    setSelectedPhotoList([]);
    setSelectedPhotoIndex(0);
  };

  const handlePickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri).filter(Boolean) as string[];
      setPhotos((prev) => [...prev, ...newUris]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Imóveis</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>
        {isClientUser ? 'Avalie os imóveis, salve favoritos e veja quais estão mais bem avaliados.' : 'Cadastre imóveis com endereço, valor e tipo de uso.'}
      </Text>
      {isClientUser ? (
        <View style={[styles.summaryBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.summaryTitle, { color: palette.text }]}>Top avaliados</Text>
          {properties
            .map((item) => {
              const reviewsForItem = allReviews.filter((review) => review.propertyId === item.id);
              const avg = reviewsForItem.length ? reviewsForItem.reduce((sum, review) => sum + review.rating, 0) / reviewsForItem.length : 0;
              return { item, avg, count: reviewsForItem.length };
            })
            .sort((a, b) => b.avg - a.avg || b.count - a.count)
            .slice(0, 3)
            .map(({ item, avg, count }) => (
              <View key={`rank-${item.id}`} style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: palette.text }]}>{item.title}</Text>
                <Text style={[styles.summaryValue, { color: palette.accent }]}>⭐ {avg.toFixed(1)} ({count} aval.)</Text>
              </View>
            ))}
        </View>
      ) : null}
      <AccessibilityFab />

      <View style={[styles.formBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <View style={styles.searchRow}>
          <TextInput
            ref={searchInputRef}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={applyFilter}
            returnKeyType="search"
            placeholder="Filtrar imóveis por título, endereço, preço, tipo ou corretor"
            style={[styles.searchInput, { backgroundColor: palette.input, color: palette.text }]}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.filterButton} onPress={applyFilter}>
            <SlidersHorizontal size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {isClientUser ? (
          <View style={styles.filterChipRow}>
            <TouchableOpacity
              style={[styles.filterChip, !showOnlyFavorites && styles.filterChipActive, { borderColor: palette.border }]}
              onPress={() => setShowOnlyFavorites(false)}
            >
              <Text style={[styles.filterChipText, { color: !showOnlyFavorites ? palette.accent : palette.muted }]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, showOnlyFavorites && styles.filterChipActive, { borderColor: palette.border }]}
              onPress={() => setShowOnlyFavorites(true)}
            >
              <Text style={[styles.filterChipText, { color: showOnlyFavorites ? palette.accent : palette.muted }]}>Favoritos</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isClientUser ? (
          <>
            <TextInput value={title} onChangeText={setTitle} placeholder="Título" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={address} onChangeText={setAddress} placeholder="Endereço" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={price} onChangeText={setPrice} placeholder="Preço" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={type} onChangeText={setType} placeholder="Tipo" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={brokerName} onChangeText={setBrokerName} placeholder="Nome do corretor responsável" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickPhotos}>
          <Text style={styles.galleryButtonText}>Escolher da galeria</Text>
        </TouchableOpacity>
        {photos.length > 0 ? (
          <View style={styles.photoPreviewBox}>
            {photos.map((photo, index) => (
              <View key={`${photo}-${index}`} style={[styles.photoPreviewItem, { backgroundColor: theme === 'dark' ? '#0F172A' : '#EEF4FF', borderColor: theme === 'dark' ? '#1E293B' : '#D1D5DB', borderWidth: 1 }]}>
                <Image source={{ uri: photo }} style={styles.photoPreviewImage} />
                <View style={styles.photoControlsRow}>
                  <TouchableOpacity style={styles.photoMoveButton} onPress={() => movePhoto(index, -1)} disabled={index === 0}>
                    <Text style={[styles.photoMoveText, index === 0 && styles.photoMoveTextDisabled, { color: theme === 'dark' ? '#5EEAD4' : '#2563EB' }]}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoMoveButton} onPress={() => movePhoto(index, 1)} disabled={index === photos.length - 1}>
                    <Text style={[styles.photoMoveText, index === photos.length - 1 && styles.photoMoveTextDisabled, { color: theme === 'dark' ? '#5EEAD4' : '#2563EB' }]}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => handleRemovePhoto(photo)}>
                    <Text style={[styles.removePhotoText, { color: theme === 'dark' ? '#FCA5A5' : '#DC2626' }]}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
                <Text style={styles.primaryButtonText}>{editingId !== null ? 'Salvar alterações' : 'Adicionar imóvel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredProperties}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const currentReview = reviews[item.id];
          const propertyReviews = allReviews.filter((review) => review.propertyId === item.id);
          const selectedRatingFilter = selectedRatingFilterByProperty[item.id] ?? null;
          const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: propertyReviews.filter((review) => review.rating === star).length,
          }));
          const filteredReviews = selectedRatingFilter
            ? propertyReviews.filter((review) => review.rating === selectedRatingFilter)
            : propertyReviews;
          const ratingSum = propertyReviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = propertyReviews.length ? ratingSum / propertyReviews.length : 0;
          const isFavorite = favoritePropertyIds.includes(item.id);
          return (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, item.id === selectedPropertyId && styles.cardSelected]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{item.title}</Text>
              <Text style={[styles.cardText, { color: palette.muted }]}>{item.address}</Text>
              <Text style={[styles.cardText, { color: palette.muted }]}>R$ {item.price}</Text>
              <Text style={[styles.cardText, { color: palette.muted }]}>Tipo: {item.type || 'Não informado'}</Text>
              {isClientUser ? (
                <TouchableOpacity style={styles.favoriteButton} onPress={() => handleToggleFavorite(item.id)}>
                  <Text style={[styles.favoriteButtonText, { color: isFavorite ? '#FBBF24' : palette.muted }]}> {isFavorite ? '★ Favorito' : '☆ Favoritar'} </Text>
                </TouchableOpacity>
              ) : null}
              {item.brokerName ? (
                <TouchableOpacity onPress={() => (navigation as any).navigate('Brokers', { selectedBrokerName: item.brokerName, userRole })}>
                  <Text style={[styles.brokerLink, { color: palette.accent }]}>Corretor: {item.brokerName}</Text>
                </TouchableOpacity>
              ) : null}
              {parsePhotos(item.photos).length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow} contentContainerStyle={styles.photoRowContent}>
                  {parsePhotos(item.photos).map((photo, index) => (
                    <TouchableOpacity key={`${item.id}-${index}`} onPress={() => openPhotoViewer(parsePhotos(item.photos), index)}>
                      <Image source={{ uri: photo }} style={styles.photoThumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </View>
            {isClientUser ? (
              <View style={styles.clientReviewBox}>
                <Text style={[styles.reviewTitle, { color: palette.text }]}>Avalie este imóvel</Text>
                <View style={styles.ratingFilterRow}>
                  <TouchableOpacity
                    style={[styles.ratingFilterChip, selectedRatingFilter === null && styles.ratingFilterChipActive, { borderColor: palette.border }]}
                    onPress={() => setSelectedRatingFilterByProperty((prev) => ({ ...prev, [item.id]: null }))}
                  >
                    <Text style={[styles.ratingFilterText, { color: selectedRatingFilter === null ? palette.accent : palette.muted }]}>Todos</Text>
                  </TouchableOpacity>
                  {ratingCounts.map(({ star, count }) => (
                    <TouchableOpacity
                      key={`${item.id}-${star}-chip`}
                      style={[styles.ratingFilterChip, selectedRatingFilter === star && styles.ratingFilterChipActive, { borderColor: palette.border }]}
                      onPress={() => setSelectedRatingFilterByProperty((prev) => ({
                        ...prev,
                        [item.id]: prev[item.id] === star ? null : star,
                      }))}
                    >
                      <Text style={[styles.ratingFilterText, { color: selectedRatingFilter === star ? palette.accent : palette.muted }]}>⭐ {star} ({count})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {filteredReviews.length > 0 ? (
                  <View style={styles.reviewListBox}>
                    {filteredReviews.map((review) => (
                      <View key={`${item.id}-${review.clientName}`} style={styles.reviewItemBox}>
                        <Text style={[styles.reviewAuthor, { color: palette.text }]}>{review.clientName}</Text>
                        <Text style={[styles.reviewStarsText, { color: palette.accent }]}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                        <Text style={[styles.reviewComment, { color: palette.muted }]}>{review.comment || 'Sem comentário.'}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text style={[styles.reviewSummary, { color: palette.muted }]}>⭐ {averageRating.toFixed(1)} / 5 · {propertyReviews.length} avaliação(ões)</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={`${item.id}-${star}`}
                      onPress={() => handleReviewChange(item.id, star, currentReview?.comment || '')}
                    >
                      <Text style={[styles.starIcon, { color: (currentReview?.rating || 0) >= star ? '#FBBF24' : '#64748B' }]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={currentReview?.comment || ''}
                  onChangeText={(value) => handleReviewChange(item.id, currentReview?.rating || 0, value)}
                  placeholder="Escreva seu comentário"
                  multiline
                  style={[styles.reviewInput, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
                  placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.reviewButton} onPress={() => handleReviewSave(item.id)}>
                    <Text style={styles.reviewButtonText}>Salvar avaliação</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reviewDeleteButton} onPress={() => handleReviewDelete(item.id)}>
                    <Text style={styles.reviewDeleteButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.smallButton} onPress={() => handleEdit(item)}>
                  <Text style={styles.smallButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryReviewButton}
                  onPress={() => setExpandedReviewPropertyIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                >
                  <Text style={styles.secondaryReviewButtonText}>Ver avaliações</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}
            {expandedReviewPropertyIds[item.id] && !isClientUser ? (
              <View style={styles.clientReviewBox}>
                <Text style={[styles.reviewTitle, { color: palette.text }]}>Avaliações do imóvel</Text>
                <Text style={[styles.reviewSummary, { color: palette.muted }]}>⭐ {averageRating.toFixed(1)} / 5 · {propertyReviews.length} avaliação(ões)</Text>
                <View style={styles.ratingFilterRow}>
                  <TouchableOpacity
                    style={[styles.ratingFilterChip, selectedRatingFilter === null && styles.ratingFilterChipActive, { borderColor: palette.border }]}
                    onPress={() => setSelectedRatingFilterByProperty((prev) => ({ ...prev, [item.id]: null }))}
                  >
                    <Text style={[styles.ratingFilterText, { color: selectedRatingFilter === null ? palette.accent : palette.muted }]}>Todos</Text>
                  </TouchableOpacity>
                  {ratingCounts.map(({ star, count }) => (
                    <TouchableOpacity
                      key={`${item.id}-${star}-chip-readonly`}
                      style={[styles.ratingFilterChip, selectedRatingFilter === star && styles.ratingFilterChipActive, { borderColor: palette.border }]}
                      onPress={() => setSelectedRatingFilterByProperty((prev) => ({ ...prev, [item.id]: prev[item.id] === star ? null : star }))}
                    >
                      <Text style={[styles.ratingFilterText, { color: selectedRatingFilter === star ? palette.accent : palette.muted }]}>⭐ {star} ({count})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {filteredReviews.length > 0 ? (
                  <View style={styles.reviewListBox}>
                    {filteredReviews.map((review) => (
                      <View key={`${item.id}-${review.clientName}-readonly`} style={styles.reviewItemBox}>
                        <View style={styles.reviewItemHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.reviewAuthor, { color: palette.text }]}>{review.clientName}</Text>
                            <Text style={[styles.reviewStarsText, { color: palette.accent }]}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                          </View>
                          <TouchableOpacity style={styles.reviewDeleteButtonSmall} onPress={() => handleDeleteReviewComment(review.propertyId, review.clientName)}>
                            <Text style={styles.reviewDeleteButtonSmallText}>Excluir</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.reviewComment, { color: palette.muted }]}>{review.comment || 'Sem comentário.'}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.reviewComment, { color: palette.muted }]}>Nenhuma avaliação para este filtro.</Text>
                )}
              </View>
            ) : null}
          </View>
          );
        }}
      />
      <Modal visible={selectedPhotoList.length > 0} transparent animationType="fade" onRequestClose={closePhotoViewer}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme === 'dark' ? 'rgba(7,17,31,0.92)' : 'rgba(248,250,252,0.92)' }]}>
          <View style={[styles.modalCard, { backgroundColor: theme === 'dark' ? '#12253C' : '#FFFFFF', borderColor: theme === 'dark' ? '#253A53' : '#D1D5DB', borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalClose} onPress={closePhotoViewer}>
                <Text style={[styles.modalCloseText, { color: theme === 'dark' ? '#5EEAD4' : '#2563EB' }]}>Fechar</Text>
              </TouchableOpacity>
              <Text style={[styles.modalCounter, { color: theme === 'dark' ? '#E5EEF8' : '#111827' }]}>{selectedPhotoIndex + 1} / {selectedPhotoList.length}</Text>
            </View>
            <View style={styles.modalImageFrame}>
              <Image
                source={{ uri: selectedPhotoList[selectedPhotoIndex] }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.navButton, selectedPhotoIndex === 0 && styles.navButtonDisabled, { backgroundColor: theme === 'dark' ? '#1D4ED8' : '#2563EB' }]}
                onPress={() => setSelectedPhotoIndex((prev) => Math.max(0, prev - 1))}
                disabled={selectedPhotoIndex === 0}
              >
                <Text style={styles.navButtonText}>← Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, selectedPhotoIndex === selectedPhotoList.length - 1 && styles.navButtonDisabled, { backgroundColor: theme === 'dark' ? '#1D4ED8' : '#2563EB' }]}
                onPress={() => setSelectedPhotoIndex((prev) => Math.min(selectedPhotoList.length - 1, prev + 1))}
                disabled={selectedPhotoIndex === selectedPhotoList.length - 1}
              >
                <Text style={styles.navButtonText}>Próxima →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F', padding: 18 },
  heading: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  description: { color: '#C7D2E0', marginTop: 4, marginBottom: 12 },
  formBox: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginBottom: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  searchInput: { flex: 1, backgroundColor: '#0F1C2B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF' },
  filterButton: { marginLeft: 8, backgroundColor: '#1D4ED8', width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  filterChipActive: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: '#0F1C2B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', marginBottom: 8 },
  galleryButton: { backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 10, marginBottom: 8 },
  galleryButtonText: { color: '#FFF', textAlign: 'center', fontWeight: '700' },
  photoPreviewBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  photoPreviewItem: { width: '48%', backgroundColor: '#0F1C2B', borderRadius: 12, padding: 6 },
  photoPreviewImage: { width: '100%', height: 72, borderRadius: 10 },
  photoControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 6 },
  photoMoveButton: { paddingHorizontal: 6, paddingVertical: 2 },
  photoMoveText: { color: '#5EEAD4', fontWeight: '700' },
  photoMoveTextDisabled: { color: '#64748B' },
  removePhotoButton: { alignSelf: 'flex-start' },
  removePhotoText: { color: '#FCA5A5', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  primaryButton: { backgroundColor: '#F9A8D4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  primaryButtonText: { color: '#4A044E', fontWeight: '700', textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#F9A8D4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  secondaryButtonText: { color: '#F5D0FE', textAlign: 'center', fontWeight: '700' },
  list: { paddingBottom: 24 },
  photoRow: { marginTop: 8, paddingVertical: 2 },
  photoRowContent: { alignItems: 'center', paddingHorizontal: 8 },
  photoThumb: { width: 108, height: 68, borderRadius: 12, marginHorizontal: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(7,17,31,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '92%', backgroundColor: '#12253C', borderRadius: 18, padding: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalClose: { alignSelf: 'flex-end' },
  modalCloseText: { color: '#5EEAD4', fontWeight: '700' },
  modalCounter: { color: '#E5EEF8', fontWeight: '700' },
  galleryScrollContent: { alignItems: 'center' },
  modalImageFrame: { width: '100%', height: 340, justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '96%', height: '100%', borderRadius: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  navButton: { flex: 1, backgroundColor: '#1D4ED8', borderRadius: 10, paddingVertical: 8, marginHorizontal: 4, alignItems: 'center' },
  navButtonDisabled: { backgroundColor: '#334155' },
  navButtonText: { color: '#FFF', fontWeight: '700' },
  card: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginBottom: 10, borderColor: '#253A53', borderWidth: 1, flexDirection: 'column' },
  cardSelected: { borderColor: '#5EEAD4', shadowColor: '#5EEAD4', shadowOpacity: 0.35, shadowRadius: 8 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardText: { color: '#C7D2E0', marginTop: 2 },
  summaryBox: { borderRadius: 16, borderWidth: 1, padding: 10, marginBottom: 10 },
  summaryTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  summaryLabel: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  summaryValue: { fontSize: 12, fontWeight: '700' },
  favoriteButton: { marginTop: 6, alignSelf: 'flex-start' },
  favoriteButtonText: { fontSize: 12, fontWeight: '700' },
  cardActions: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 8 },
  clientReviewBox: { marginTop: 10, borderWidth: 1, borderColor: '#253A53', borderRadius: 14, padding: 10, backgroundColor: 'rgba(15,23,42,0.45)' },
  reviewTitle: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  reviewSummary: { color: '#C7D2E0', fontSize: 12, marginTop: 2 },
  reviewListBox: { marginTop: 8, gap: 8 },
  reviewItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reviewDeleteButtonSmall: { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8 },
  reviewDeleteButtonSmallText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  ratingFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  ratingFilterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  ratingFilterChipActive: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  ratingFilterText: { fontSize: 11, fontWeight: '700' },
  reviewItemBox: { borderWidth: 1, borderColor: '#253A53', borderRadius: 12, padding: 8, backgroundColor: 'rgba(15,23,42,0.35)' },
  reviewAuthor: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  reviewStarsText: { color: '#5EEAD4', fontSize: 12, marginTop: 2 },
  reviewComment: { color: '#C7D2E0', fontSize: 11, marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  starIcon: { fontSize: 24, color: '#FBBF24' },
  reviewInput: { marginTop: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, minHeight: 56, textAlignVertical: 'top' },
  reviewActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  reviewButton: { flex: 1, borderRadius: 10, paddingVertical: 8, backgroundColor: '#2563EB', alignItems: 'center' },
  reviewButtonText: { color: '#FFF', fontWeight: '700' },
  reviewDeleteButton: { flex: 1, borderRadius: 10, paddingVertical: 8, backgroundColor: '#DC2626', alignItems: 'center' },
  reviewDeleteButtonText: { color: '#FFF', fontWeight: '700' },
  brokerLink: { color: '#5EEAD4', fontWeight: '700', marginTop: 4 },
  smallButton: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, minWidth: 96, alignItems: 'center' },
  smallButtonText: { color: '#FFF', fontWeight: '700' },
  secondaryReviewButton: { backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, minWidth: 118, alignItems: 'center' },
  secondaryReviewButtonText: { color: '#FFF', fontWeight: '700' },
  deleteButton: { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, minWidth: 96, alignItems: 'center' },
  deleteButtonText: { color: '#FFF', fontWeight: '700' },
});

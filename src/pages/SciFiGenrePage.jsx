import React from 'react';
import GenrePage from '../components/GenrePage';
export default function SciFiGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={24} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}

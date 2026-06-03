import React from 'react';
import GenrePage from '../components/GenrePage';
export default function ComedyGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={4} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}

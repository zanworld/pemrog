import React from 'react';
import GenrePage from '../components/GenrePage';
export default function MysteryGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={7} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}

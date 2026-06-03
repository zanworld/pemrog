import React from 'react';
import GenrePage from '../components/GenrePage';
export default function AdventureGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={2} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}

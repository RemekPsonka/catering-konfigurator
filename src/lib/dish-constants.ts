export const UNIT_TYPE_LABELS: Record<string, string> = {
  PERSON: 'Na osobę',
  PIECE: 'Za sztukę',
  KG: 'Za kg',
  SET: 'Za zestaw',
};

export const UNIT_TYPE_PRICE_LABELS: Record<string, string> = {
  PERSON: 'Cena/osobę',
  PIECE: 'Cena/sztukę',
  KG: 'Cena/kg',
  SET: 'Cena/zestaw',
};

export const UNIT_TYPE_PRICE_FIELDS: Record<string, string> = {
  PERSON: 'price_per_person',
  PIECE: 'price_per_piece',
  KG: 'price_per_kg',
  SET: 'price_per_set',
};

export const DIET_TAGS = [
  { value: 'wegetarianskie', label: 'Wegetariańskie' },
  { value: 'weganskie', label: 'Wegańskie' },
  { value: 'bezglutenowe', label: 'Bezglutenowe' },
  { value: 'keto', label: 'KETO' },
  { value: 'bez_laktozy', label: 'Bez laktozy' },
];

export const EVENT_TAGS = [
  { value: 'komunia', label: 'Komunia' },
  { value: 'wesele', label: 'Wesele' },
  { value: 'firmowe', label: 'Firmowe' },
  { value: 'bankiet', label: 'Bankiet' },
  { value: 'grill', label: 'Grill' },
  { value: 'swiateczne', label: 'Świąteczne' },
];

export const SEASON_TAGS = [
  { value: 'wiosna', label: 'Wiosna' },
  { value: 'lato', label: 'Lato' },
  { value: 'jesien', label: 'Jesień' },
  { value: 'zima', label: 'Zima' },
  { value: 'caly_rok', label: 'Cały rok' },
];

export const SERVING_STYLES = [
  { value: 'na_zimno', label: 'Na zimno' },
  { value: 'na_cieplo', label: 'Na ciepło' },
  { value: 'finger_food', label: 'Finger food' },
  { value: 'bufet', label: 'Bufet' },
  { value: 'serwowane', label: 'Serwowane' },
];

export const ALLERGENS = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'laktoza', label: 'Laktoza' },
  { value: 'jaja', label: 'Jaja' },
  { value: 'orzechy', label: 'Orzechy' },
  { value: 'soja', label: 'Soja' },
  { value: 'seler', label: 'Seler' },
  { value: 'ryby', label: 'Ryby' },
  { value: 'skorupiaki', label: 'Skorupiaki' },
  { value: 'gorczyca', label: 'Gorczyca' },
  { value: 'sezam', label: 'Sezam' },
  { value: 'siarka', label: 'Siarka' },
  { value: 'lubin', label: 'Łubin' },
  { value: 'mieczaki', label: 'Mięczaki' },
  { value: 'orzeszki', label: 'Orzeszki' },
];

export const ITEMS_PER_PAGE = 20;

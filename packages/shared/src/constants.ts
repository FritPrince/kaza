/** Free generations granted at signup (freemium model, §9). */
export const FREE_GENERATIONS_AT_SIGNUP = 3;

/** Perceived generation time budget in seconds (§7.5). */
export const MAX_GENERATION_TIME_SECONDS = 45;

/** Max photo upload dimension — photos are compressed to ~1080p before upload (§7.5). */
export const MAX_UPLOAD_DIMENSION_PX = 1920;

/** Interior styles proposed by the taste quiz and the relooking flow (§A2). */
export const INTERIOR_STYLES = [
  'modern',
  'minimalist',
  'bohemian',
  'afro-contemporary',
  'scandinavian',
  'industrial',
  'classic',
  'rustic',
] as const;
export type InteriorStyle = (typeof INTERIOR_STYLES)[number];

/** Room types supported by the relooking flow (§B). */
export const ROOM_TYPES = [
  'living-room',
  'bedroom',
  'kitchen',
  'bathroom',
  'dining-room',
  'office',
  'kids-room',
  'exterior',
  'other',
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

/** Construction standing levels used by cost tables (§C5). */
export const CONSTRUCTION_STANDINGS = ['economy', 'standard', 'premium'] as const;
export type ConstructionStanding = (typeof CONSTRUCTION_STANDINGS)[number];

/** Currencies supported at launch. XOF (FCFA) first for West Africa. */
export const SUPPORTED_CURRENCIES = ['XOF', 'EUR', 'USD'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/** Languages: French at launch, English in phase 2 (§7.5). */
export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type DateLikeInput =
  | string
  | Date
  | {
      date?: DateLikeInput | null;
    }
  | null
  | undefined;

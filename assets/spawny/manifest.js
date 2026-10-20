// One real waving pose is reused until individual expression assets are added.
// Replace an expression's src only after its real file has been added.
const base = "assets/spawny/spawny.png";
export const expressions = [
  { id: "happy", label: "Feliz", src: base, status: "Pose base" },
  {
    id: "excited",
    label: "Emocionado",
    src: base,
    status: "Variante preparada",
  },
  { id: "waving", label: "Saludando", src: base, status: "Pose base" },
  {
    id: "surprised",
    label: "Sorprendido",
    src: base,
    status: "Variante preparada",
  },
  { id: "sad", label: "Triste", src: base, status: "Variante preparada" },
  {
    id: "celebrating",
    label: "Celebrando",
    src: base,
    status: "Variante preparada",
  },
  { id: "playing", label: "Jugando", src: base, status: "Variante preparada" },
];
export const spawny = (
  expression = "waving",
  className = "",
  alt = "Spawny, nuestra mascota, te saluda",
) =>
  `<img class="spawny ${className}" src="${expressions.find((x) => x.id === expression)?.src || base}" alt="${alt}" width="480" height="600" loading="lazy">`;

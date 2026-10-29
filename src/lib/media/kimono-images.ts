export const kimonoImageBase = "/kimono_images_optimized";
type DesignLibrary = { key: string; name: string; nameEl: string; subtitle: string; subtitleEl: string; files: readonly string[] };
const numbered = (stem: string, count: number, mainExtension = "png") => [`${stem}_main.${mainExtension}`, ...Array.from({ length: count }, (_, index) => `${stem}_${index + 1}.jpg`)];

export const kimonoDesignLibraries: readonly DesignLibrary[] = [
  { key: "artemis", name: "Artemis", nameEl: "Άρτεμις", subtitle: "A graphic tribute to the goddess of the wild.", subtitleEl: "Ένας γραφικός φόρος τιμής στη θεά της άγριας φύσης.", files: ["kimono_design_artemis_main.png"] },
  { key: "birds", name: "Birds", nameEl: "Πουλιά", subtitle: "A lively flight drawn across the silhouette.", subtitleEl: "Ένα ζωηρό πέταγμα απλωμένο πάνω στη σιλουέτα.", files: numbered("kimono_design_birds", 10) },
  { key: "circles-bluebelt", name: "Circles Bluebelt", nameEl: "Κύκλοι με Μπλε Ζώνη", subtitle: "Pure geometry anchored by a blue belt.", subtitleEl: "Καθαρή γεωμετρία με σημείο αναφοράς τη μπλε ζώνη.", files: ["kimono_design_circles_bluebelt_main.png"] },
  { key: "circles-lightbelt", name: "Circles Lightbelt", nameEl: "Κύκλοι με Ανοιχτή Ζώνη", subtitle: "Circular rhythm finished with a light belt.", subtitleEl: "Κυκλικός ρυθμός που ολοκληρώνεται με ανοιχτόχρωμη ζώνη.", files: numbered("kimono_design_circles_lightbelt", 1) },
  { key: "drops", name: "Drops", nameEl: "Σταγόνες", subtitle: "Fluid marks suspended in motion.", subtitleEl: "Ρευστά ίχνη που αιωρούνται σε κίνηση.", files: numbered("kimono_design_drops", 11) },
  { key: "eyes", name: "Eyes", nameEl: "Μάτια", subtitle: "A watchful motif with a playful gaze.", subtitleEl: "Ένα παρατηρητικό μοτίβο με παιχνιδιάρικο βλέμμα.", files: numbered("kimono_design_eyes", 3) },
  { key: "figs", name: "Figs", nameEl: "Σύκα", subtitle: "Mediterranean fruit rendered as a bold repeat.", subtitleEl: "Μεσογειακό φρούτο σε μια τολμηρή επανάληψη.", files: numbered("kimono_design_figs", 8) },
  { key: "lily-pond", name: "Lily Pond", nameEl: "Λίμνη με Νούφαρα", subtitle: "A serene water garden in full colour.", subtitleEl: "Ένας γαλήνιος υδάτινος κήπος γεμάτος χρώμα.", files: numbered("kimono_design_lily_pond", 18) },
  { key: "liquid-geo", name: "Liquid Geo", nameEl: "Ρευστή Γεωμετρία", subtitle: "Structured shapes softened into flowing lines.", subtitleEl: "Δομημένα σχήματα που μαλακώνουν σε ρευστές γραμμές.", files: numbered("kimono_design_liquid_geo", 10) },
  { key: "neon-shapes", name: "Neon Shapes", nameEl: "Νέον Σχήματα", subtitle: "Electric colour cut into expressive forms.", subtitleEl: "Ηλεκτρικό χρώμα κομμένο σε εκφραστικές φόρμες.", files: numbered("kimono_design_neon_shapes", 12) },
  { key: "nordic-flowers", name: "Nordic Flowers", nameEl: "Σκανδιναβικά Λουλούδια", subtitle: "Folk florals composed with Nordic clarity.", subtitleEl: "Λαϊκά άνθη συνθεμένα με σκανδιναβική καθαρότητα.", files: numbered("kimono_design_nordic flowers", 8) },
  { key: "pomegranate", name: "Pomegranate", nameEl: "Ρόδι", subtitle: "A symbol of abundance in a vivid repeat.", subtitleEl: "Ένα σύμβολο αφθονίας σε ζωηρή επανάληψη.", files: ["kimono_design_pomegranate.jpg", "kimono_design_pomegranate_1.jpg", "kimono_design_pomegranate_2.jpg"] },
  { key: "rhobus", name: "Rhobus", nameEl: "Ρόμβος", subtitle: "A measured diamond pattern with graphic depth.", subtitleEl: "Ένα μετρημένο μοτίβο ρόμβων με γραφικό βάθος.", files: numbered("kimono_design_rhobus", 2, "jpg") },
  { key: "seabed", name: "Seabed", nameEl: "Βυθός", subtitle: "Organic forms gathered from beneath the surface.", subtitleEl: "Οργανικές φόρμες συγκεντρωμένες κάτω από την επιφάνεια.", files: numbered("kimono_design_seabed", 7) },
  { key: "stripes", name: "Stripes", nameEl: "Ρίγες", subtitle: "Confident lines that lengthen the silhouette.", subtitleEl: "Δυναμικές γραμμές που επιμηκύνουν τη σιλουέτα.", files: numbered("kimono_design_stripes", 9) },
] as const;

const editorialFiles = ["kimono_design_grouped_1.jpg", "kimono_design_grouped_2.jpg"] as const;
const allFiles = [...kimonoDesignLibraries.flatMap(({ files }) => files), ...editorialFiles];
export const kimonoImageCount = allFiles.length;
const pathExtension = (file: string) => file.slice(file.lastIndexOf(".")).toLowerCase();
const optimizedFile = (file: string) => pathExtension(file) === ".png" ? file : `${file.slice(0, -pathExtension(file).length)}.webp`;
const publicPath = (file: string) => `${kimonoImageBase}/${optimizedFile(file).split("/").map(encodeURIComponent).join("/")}`;

export function kimonoImage(number: number) {
  const normalized = ((Math.trunc(number) - 1) % kimonoImageCount + kimonoImageCount) % kimonoImageCount;
  return publicPath(allFiles[normalized]);
}
export function kimonoDesignImage(designIndex: number, imageIndex = 0) {
  const design = kimonoDesignLibraries[((Math.trunc(designIndex) % kimonoDesignLibraries.length) + kimonoDesignLibraries.length) % kimonoDesignLibraries.length];
  const normalizedImage = ((Math.trunc(imageIndex) % design.files.length) + design.files.length) % design.files.length;
  return publicPath(design.files[normalizedImage]);
}
export function kimonoDesignGallery(designIndex: number) {
  const design = kimonoDesignLibraries[((Math.trunc(designIndex) % kimonoDesignLibraries.length) + kimonoDesignLibraries.length) % kimonoDesignLibraries.length];
  return design.files.map(publicPath);
}
export function kimonoDesignModelGallery(designIndex: number) {
  const design = kimonoDesignLibraries[((Math.trunc(designIndex) % kimonoDesignLibraries.length) + kimonoDesignLibraries.length) % kimonoDesignLibraries.length];
  return design.files.slice(1).map(publicPath);
}
export function kimonoDesignHasModelImages(designIndex: number) {
  return kimonoDesignModelGallery(designIndex).length > 0;
}
export function kimonoDesignModelImage(designIndex: number, modelIndex = 0) {
  const modelImages = kimonoDesignModelGallery(designIndex);
  if (!modelImages.length) return null;
  const normalizedImage = ((Math.trunc(modelIndex) % modelImages.length) + modelImages.length) % modelImages.length;
  return modelImages[normalizedImage];
}
export function isOptimizedKimonoImage(value: string | null | undefined): value is string {
  if (typeof value !== "string" || !value.startsWith(`${kimonoImageBase}/`)) return false;
  const decoded = decodeURIComponent(value.slice(kimonoImageBase.length + 1));
  return allFiles.some(file => optimizedFile(file) === decoded);
}

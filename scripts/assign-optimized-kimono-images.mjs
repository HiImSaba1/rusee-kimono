import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const numbered = (stem, count, mainExtension = "png") => [`${stem}_main.${mainExtension}`, ...Array.from({ length: count }, (_, index) => `${stem}_${index + 1}.jpg`)];
const designs = [
  ["Artemis", "Άρτεμις", "A graphic tribute to the goddess of the wild.", "Ένας γραφικός φόρος τιμής στη θεά της άγριας φύσης.", ["kimono_design_artemis_main.png"]],
  ["Birds", "Πουλιά", "A lively flight drawn across the silhouette.", "Ένα ζωηρό πέταγμα απλωμένο πάνω στη σιλουέτα.", numbered("kimono_design_birds", 10)],
  ["Circles Bluebelt", "Κύκλοι με Μπλε Ζώνη", "Pure geometry anchored by a blue belt.", "Καθαρή γεωμετρία με σημείο αναφοράς τη μπλε ζώνη.", ["kimono_design_circles_bluebelt_main.png"]],
  ["Circles Lightbelt", "Κύκλοι με Ανοιχτή Ζώνη", "Circular rhythm finished with a light belt.", "Κυκλικός ρυθμός που ολοκληρώνεται με ανοιχτόχρωμη ζώνη.", numbered("kimono_design_circles_lightbelt", 1)],
  ["Drops", "Σταγόνες", "Fluid marks suspended in motion.", "Ρευστά ίχνη που αιωρούνται σε κίνηση.", numbered("kimono_design_drops", 11)],
  ["Eyes", "Μάτια", "A watchful motif with a playful gaze.", "Ένα παρατηρητικό μοτίβο με παιχνιδιάρικο βλέμμα.", numbered("kimono_design_eyes", 3)],
  ["Figs", "Σύκα", "Mediterranean fruit rendered as a bold repeat.", "Μεσογειακό φρούτο σε μια τολμηρή επανάληψη.", numbered("kimono_design_figs", 8)],
  ["Lily Pond", "Λίμνη με Νούφαρα", "A serene water garden in full colour.", "Ένας γαλήνιος υδάτινος κήπος γεμάτος χρώμα.", numbered("kimono_design_lily_pond", 18)],
  ["Liquid Geo", "Ρευστή Γεωμετρία", "Structured shapes softened into flowing lines.", "Δομημένα σχήματα που μαλακώνουν σε ρευστές γραμμές.", numbered("kimono_design_liquid_geo", 10)],
  ["Neon Shapes", "Νέον Σχήματα", "Electric colour cut into expressive forms.", "Ηλεκτρικό χρώμα κομμένο σε εκφραστικές φόρμες.", numbered("kimono_design_neon_shapes", 12)],
  ["Nordic Flowers", "Σκανδιναβικά Λουλούδια", "Folk florals composed with Nordic clarity.", "Λαϊκά άνθη συνθεμένα με σκανδιναβική καθαρότητα.", numbered("kimono_design_nordic flowers", 8)],
  ["Pomegranate", "Ρόδι", "A symbol of abundance in a vivid repeat.", "Ένα σύμβολο αφθονίας σε ζωηρή επανάληψη.", ["kimono_design_pomegranate.jpg", "kimono_design_pomegranate_1.jpg", "kimono_design_pomegranate_2.jpg"]],
  ["Rhobus", "Ρόμβος", "A measured diamond pattern with graphic depth.", "Ένα μετρημένο μοτίβο ρόμβων με γραφικό βάθος.", numbered("kimono_design_rhobus", 2, "jpg")],
  ["Seabed", "Βυθός", "Organic forms gathered from beneath the surface.", "Οργανικές φόρμες συγκεντρωμένες κάτω από την επιφάνεια.", numbered("kimono_design_seabed", 7)],
  ["Stripes", "Ρίγες", "Confident lines that lengthen the silhouette.", "Δυναμικές γραμμές που επιμηκύνουν τη σιλουέτα.", numbered("kimono_design_stripes", 9)],
];
const optimizedName = name => path.extname(name).toLowerCase() === ".png" ? name : `${path.parse(name).name}.webp`;
const publicPath = name => `/kimono_images_optimized/${optimizedName(name).split("/").map(encodeURIComponent).join("/")}`;
const namesOnly = process.argv.includes("--names-only");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!namesOnly) {
    const available = new Set(await readdir(path.join(process.cwd(), "public", "kimono_images_optimized")));
    for (const [, , , , files] of designs) for (const file of files) if (!available.has(optimizedName(file))) throw new Error(`Required optimized image is missing: ${optimizedName(file)}`);
  }
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT id,product_id FROM designs ORDER BY product_id, sort_order, id FOR UPDATE");
    if (rows.length !== designs.length) throw new Error(`Expected ${designs.length} catalogue designs but found ${rows.length}; no changes were committed.`);
    for (const [index, row] of rows.entries()) {
      const [name, nameEl, subtitle, subtitleEl, files] = designs[index];
      const detailsEn = `${subtitle} The print scale and placement are composed specifically for the ${name} kimono.`;
      const detailsEl = `${subtitleEl} Η κλίμακα και η τοποθέτηση του μοτίβου έχουν σχεδιαστεί ειδικά για το κιμονό ${nameEl}.`;
      await connection.execute("UPDATE designs SET name=?,name_el=?,story=?,description_en=?,description_el=?,details_en=?,details_el=? WHERE id=?", [name, nameEl, subtitle, subtitle, subtitleEl, detailsEn, detailsEl, row.id]);
      if (!namesOnly) {
        const [images] = await connection.execute("SELECT id FROM product_images WHERE design_id=? ORDER BY COALESCE(size_id,0),sort_order,id FOR UPDATE", [row.id]);
        for (const [imageIndex, image] of images.entries()) {
          const viewIndex = imageIndex % files.length;
          await connection.execute(
            "UPDATE product_images SET src=?,alt=?,alt_en=?,alt_el=?,sort_order=? WHERE id=?",
            [publicPath(files[viewIndex]), `${name} kimono — view ${viewIndex + 1}`, `${name} kimono — view ${viewIndex + 1}`, `Κιμονό ${nameEl} — όψη ${viewIndex + 1}`, viewIndex, image.id],
          );
        }
        for (let imageIndex = images.length; imageIndex < files.length; imageIndex += 1) {
          await connection.execute(
            "INSERT INTO product_images (product_id,design_id,colour_id,size_id,src,alt,alt_en,alt_el,sort_order) VALUES (?,?,NULL,NULL,?,?,?,?,?)",
            [row.product_id, row.id, publicPath(files[imageIndex]), `${name} kimono — view ${imageIndex + 1}`, `${name} kimono — view ${imageIndex + 1}`, `Κιμονό ${nameEl} — όψη ${imageIndex + 1}`, imageIndex],
          );
        }
      }
    }
    await connection.commit();
    console.log(namesOnly ? "PASS - 15 bilingual design identities and subheadings now match the named kimono image collections." : "PASS - 15 bilingual design identities and complete optimized image libraries are synchronized.");
    console.log("Existing media rows were reused and missing media references were inserted. No media rows were deleted.");
    console.log("Stable slugs, SKUs, prices, stock, orders, payments and audit history were not changed.");
  } catch (error) { await connection.rollback(); throw error; } finally { await connection.end(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

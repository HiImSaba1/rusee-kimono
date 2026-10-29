import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function upsertId(sql, values) {
  const [result] = await connection.execute(sql, values);
  return Number(result.insertId);
}

try {
  await connection.beginTransaction();

  const productId = await upsertId(
    `INSERT INTO products (slug, title, subtitle, description, material, care, status, tax_rate_bps)
     VALUES (?, ?, ?, ?, ?, ?, 'active', 2400)
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), title=VALUES(title), subtitle=VALUES(subtitle), description=VALUES(description), material=VALUES(material), care=VALUES(care), status='active'`,
    [
      "signature-kimono",
      "The Signature Kimono",
      "One silhouette. Many moods.",
      "A fluid, unstructured layer designed to move between quiet mornings, summer streets and evenings away.",
      "Lightweight woven fabric with a soft hand and elegant drape.",
      "Cool gentle wash. Dry in shade. Steam or iron on low heat.",
    ],
  );

  const designDefinitions = [
    ["nocturne", "Nocturne", "Deep florals composed like shadows at the edge of evening."],
    ["garden", "Secret Garden", "Botanical rhythm, softened colour and a sense of slow summer."],
    ["mineral", "Mineral", "A restrained abstract print drawn from stone, water and weather."],
  ];
  const colourDefinitions = [
    ["ink", "Ink", "#171714"],
    ["clay", "Clay", "#A76049"],
    ["sage", "Sage", "#8C927B"],
  ];
  const sizeDefinitions = [["S", "Small"], ["M", "Medium"], ["L", "Large"]];

  const designIds = [];
  for (const [index, [slug, name, story]] of designDefinitions.entries()) {
    designIds.push(await upsertId(
      `INSERT INTO designs (product_id, slug, name, story, sort_order, active)
       VALUES (?, ?, ?, ?, ?, true)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), name=VALUES(name), story=VALUES(story), sort_order=VALUES(sort_order), active=true`,
      [productId, slug, name, story, index],
    ));
  }

  const colourIds = [];
  for (const [index, [slug, name, hex]] of colourDefinitions.entries()) {
    colourIds.push(await upsertId(
      `INSERT INTO colours (slug, name, hex, sort_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), name=VALUES(name), hex=VALUES(hex), sort_order=VALUES(sort_order)`,
      [slug, name, hex, index],
    ));
  }

  const sizeIds = [];
  for (const [index, [code, label]] of sizeDefinitions.entries()) {
    sizeIds.push(await upsertId(
      `INSERT INTO sizes (code, label, sort_order)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), label=VALUES(label), sort_order=VALUES(sort_order)`,
      [code, label, index],
    ));
  }

  for (let designIndex = 0; designIndex < designIds.length; designIndex += 1) {
    for (let colourIndex = 0; colourIndex < colourIds.length; colourIndex += 1) {
      for (let sizeIndex = 0; sizeIndex < sizeIds.length; sizeIndex += 1) {
        const sku = `KIM-001-${designDefinitions[designIndex][0].slice(0, 3).toUpperCase()}-${colourDefinitions[colourIndex][0].slice(0, 3).toUpperCase()}-${sizeDefinitions[sizeIndex][0]}`;
        const variantId = await upsertId(
          `INSERT INTO product_variants (product_id, design_id, colour_id, size_id, sku, price_minor, currency, active)
           VALUES (?, ?, ?, ?, ?, 18900, 'EUR', true)
           ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), sku=VALUES(sku), price_minor=VALUES(price_minor), active=true`,
          [productId, designIds[designIndex], colourIds[colourIndex], sizeIds[sizeIndex], sku],
        );
        await connection.execute(
          `INSERT INTO inventory (variant_id, on_hand, reserved)
           VALUES (?, 6, 0)
           ON DUPLICATE KEY UPDATE on_hand=VALUES(on_hand)`,
          [variantId],
        );
      }
    }
  }

  const images = [
    ["/kimono_images/kimono_design_artemis_main.png", "Artemis kimono", 0, designIds[0]],
    ["/kimono_images/kimono_design_birds_main.png", "Birds kimono", 1, designIds[1]],
    ["/kimono_images/kimono_design_circles_bluebelt_main.png", "Circles Bluebelt kimono", 2, designIds[2]],
    ["/kimono_images/kimono_design_artemis_main.png", "Artemis kimono detail", 3, designIds[0]],
    ["/kimono_images/kimono_design_birds_1.jpg", "Birds kimono detail", 4, designIds[1]],
    ["/kimono_images/kimono_design_circles_bluebelt_main.png", "Circles Bluebelt kimono detail", 5, designIds[2]],
  ];
  await connection.execute("DELETE FROM product_images WHERE product_id = ?", [productId]);
  for (const [src, alt, sortOrder, designId] of images) {
    await connection.execute(
      "INSERT INTO product_images (product_id, design_id, src, alt, sort_order) VALUES (?, ?, ?, ?, ?)",
      [productId, designId, src, alt, sortOrder],
    );
  }

  await connection.commit();
  console.log("Seeded one product, 3 designs, 3 colours, 3 sizes, 27 variants, and 6 editorial images.");
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

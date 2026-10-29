import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getAdminDesign } from "@/features/admin/queries";
import { createProductImage, deleteProductImage, updateProductImage } from "../../media/actions";
import { updateDesign } from "../actions";
import { isOptimizedKimonoImage, kimonoDesignImage } from "@/lib/media/kimono-images";

const field = "mt-2 block w-full border-b border-ink/25 bg-transparent px-1 py-2 outline-none focus:border-ink";
const button = "border border-ink/30 px-4 py-3 text-[0.6rem] uppercase tracking-[0.13em] hover:bg-ink hover:text-paper";

export default async function AdminDesignPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  const id = Number(designId);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [admin, data] = await Promise.all([requireAdmin(), getAdminDesign(id)]);
  if (!data.design) notFound();
  const design = data.design;
  const canEdit = admin.role === "owner" || admin.role === "manager";
  const imageIndex = Math.max(0, Number(design.sort_order ?? 0));
  const variants = data.variants as Array<Record<string, unknown>>;
  const images = data.images as Array<Record<string, unknown>>;
  const uniqueSizes = variants.filter((row, index, rows) => rows.findIndex((candidate) => Number(candidate.size_id) === Number(row.size_id)) === index);
  const preview = (index: number) => {
    const stored = String(images[index]?.src ?? "");
    return isOptimizedKimonoImage(stored) ? stored : kimonoDesignImage(imageIndex, index);
  };
  const previewAlt = (index: number) => String(images[index]?.alt_en ?? images[index]?.alt ?? "");

  return <main className="px-[var(--gutter)] py-12">
    <Link href="/admin/products" className="text-xs uppercase tracking-[.13em]">← Designs</Link>
    <div className="mt-8 grid gap-10 xl:grid-cols-[.8fr_1.2fr]">
      <div className="grid h-fit grid-cols-2 gap-3"><Preview src={preview(0)} alt={previewAlt(0)} wide priority/><Preview src={preview(1)} alt={previewAlt(1)}/><Preview src={preview(2)} alt={previewAlt(2)}/></div>
      <section><p className="eyebrow">Design editor · {String(design.slug)}</p><h1 className="mt-3 font-display text-[clamp(4rem,7vw,7rem)] leading-[.85]">{String(design.name_el ?? design.name)}</h1>
        <form action={updateDesign} className="mt-10 grid gap-6 md:grid-cols-2"><input type="hidden" name="id" value={id}/><Field disabled={!canEdit} name="nameEl" label="Όνομα · Greek" value={design.name_el}/><Field disabled={!canEdit} name="name" label="Name · English" value={design.name}/><label className="md:col-span-2">Short story<textarea disabled={!canEdit} className={`${field} min-h-24`} name="story" defaultValue={String(design.story ?? "")}/></label><Area disabled={!canEdit} name="descriptionEl" label="Περιγραφή · Greek" value={design.description_el}/><Area disabled={!canEdit} name="descriptionEn" label="Description · English" value={design.description_en}/><Area disabled={!canEdit} name="detailsEl" label="Λεπτομέρειες σχεδίου · Greek" value={design.details_el}/><Area disabled={!canEdit} name="detailsEn" label="Design details · English" value={design.details_en}/><label>Fixed design colour<select disabled={!canEdit} className={field} name="fixedColourId" defaultValue={String(design.fixed_colour_id ?? "")}>{data.colours.map((colour) => <option key={colour.id} value={colour.id}>{colour.name}</option>)}</select></label><Field disabled={!canEdit} name="sortOrder" label="Sort order" type="number" value={design.sort_order}/><label className="self-end pb-2"><input disabled={!canEdit} type="checkbox" name="active" defaultChecked={Boolean(design.active)}/> Active storefront design</label>{canEdit && <button className="border border-ink bg-ink px-6 py-4 text-xs uppercase tracking-[.14em] text-paper">Save design</button>}</form>
        <div className="mt-12 border-t border-ink/15 pt-7"><h2 className="font-display text-4xl">Size SKUs</h2><div className="mt-5 space-y-2">{variants.map((variant, index) => <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-4 border-t border-ink/10 py-3 text-sm"><span className="font-mono text-xs">{String(variant.sku)}</span><span>{String(variant.label)}</span><span>{Number(variant.on_hand ?? 0) - Number(variant.reserved ?? 0)} available</span></div>)}</div></div>
      </section>
    </div>
    <section className="mt-16 border-t border-ink/20 pt-10"><p className="eyebrow">Design and size photography</p><h2 className="mt-3 font-display text-[clamp(3rem,6vw,6rem)] leading-none">Media assignments.</h2><p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/60">Choose a size for its exact gallery. “All sizes” images may complete a partially assigned gallery, while a size with no exact photography keeps its own provisional WebP set so size changes remain visually distinct. Add images in display order.</p>
      {canEdit && <form action={createProductImage} className="mt-8 grid gap-4 bg-sage/25 p-6 md:grid-cols-2 lg:grid-cols-4"><input type="hidden" name="productId" value={String(design.product_id)}/><input type="hidden" name="designId" value={id}/><input type="hidden" name="colourId" value=""/><MediaField name="src" label="Local path" placeholder="/images/catalogue/design-size-01.webp"/><MediaField name="altEl" label="Alt text · Greek"/><MediaField name="altEn" label="Alt text · English"/><SizeChoice name="sizeId" rows={uniqueSizes}/><MediaField name="sortOrder" label="Display order" type="number" defaultValue="0"/><button className={`${button} self-end`}>Add image</button></form>}
      <div className="mt-10 grid gap-6 xl:grid-cols-2">{images.map((image) => <article key={Number(image.id)} className="grid gap-5 border-t border-ink/15 pt-5 sm:grid-cols-[9rem_1fr]"><div className="relative aspect-[3/4] overflow-hidden bg-paper-deep"><Image src={String(image.src)} alt={String(image.alt_en ?? image.alt)} fill sizes="144px" className="object-cover"/></div><form action={updateProductImage} className="grid gap-3 md:grid-cols-2"><input type="hidden" name="imageId" value={String(image.id)}/><input type="hidden" name="productId" value={String(image.product_id)}/><input type="hidden" name="designId" value={id}/><input type="hidden" name="colourId" value=""/><MediaField disabled={!canEdit} name="src" label="Local path" defaultValue={String(image.src)}/><SizeChoice disabled={!canEdit} name="sizeId" value={image.size_id} rows={uniqueSizes}/><MediaField disabled={!canEdit} name="altEl" label="Alt · Greek" defaultValue={String(image.alt_el ?? image.alt)}/><MediaField disabled={!canEdit} name="altEn" label="Alt · English" defaultValue={String(image.alt_en ?? image.alt)}/><MediaField disabled={!canEdit} name="sortOrder" label="Display order" type="number" defaultValue={String(image.sort_order)}/>{canEdit && <div className="flex items-end gap-2"><button className={button}>Save</button>{admin.role === "owner" && <button formAction={deleteProductImage} className="border border-red-900/30 px-4 py-3 text-[0.6rem] uppercase tracking-[.13em] text-red-900">Remove</button>}</div>}</form></article>)}</div>
    </section>
  </main>;
}

function Preview({ src, alt, wide = false, priority = false }: { src: string; alt: string; wide?: boolean; priority?: boolean }) { return <div className={`relative ${wide ? "col-span-2 aspect-[16/11]" : "aspect-square"}`}><Image src={src} alt={alt} fill priority={priority} sizes={wide ? "50vw" : "25vw"} className="object-cover"/></div>; }
function Field({ name, label, value, type = "text", disabled }: { name: string; label: string; value: unknown; type?: string; disabled: boolean }) { return <label>{label}<input required disabled={disabled} className={field} name={name} type={type} defaultValue={String(value ?? "")}/></label>; }
function Area({ name, label, value, disabled }: { name: string; label: string; value: unknown; disabled: boolean }) { return <label>{label}<textarea required disabled={disabled} className={`${field} min-h-32`} name={name} defaultValue={String(value ?? "")}/></label>; }
function MediaField(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { const { label, ...input } = props; return <label className="text-xs uppercase tracking-[.1em]">{label}<input required className={`${field} text-sm normal-case tracking-normal`} {...input}/></label>; }
function SizeChoice({ rows, value, ...props }: { rows: Array<Record<string, unknown>>; value?: unknown } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "defaultValue" | "value">) { return <label className="text-xs uppercase tracking-[.1em]">Size<select className={`${field} text-sm normal-case tracking-normal`} defaultValue={String(value ?? "")} {...props}><option value="">All sizes</option>{rows.map((row) => <option key={Number(row.size_id)} value={Number(row.size_id)}>{String(row.label)}</option>)}</select></label>; }

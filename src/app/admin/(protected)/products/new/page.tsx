import Link from "next/link";
import { requireAdminRole } from "@/features/admin-auth/session";
import { getAdminCatalogue } from "@/features/admin/queries";
import { createColour, createDesign, createSize, createVariant } from "../actions";

const field = "mt-2 block w-full border-b border-ink/30 bg-transparent px-1 py-2 outline-none focus:border-ink";
const button = "border border-ink/30 px-5 py-3 text-[0.62rem] uppercase tracking-[0.13em] hover:bg-ink hover:text-paper";

export default async function NewCataloguePage() {
  await requireAdminRole(["owner", "manager"]);
  const catalogue = await getAdminCatalogue();
  const product = catalogue.products[0];
  if (!product) return <main className="px-[var(--gutter)] py-14">Create a product before adding options.</main>;
  return <main className="px-[var(--gutter)] py-12"><p className="eyebrow">Catalogue creation</p><div className="mt-3 flex items-end justify-between gap-5"><h1 className="font-display text-[clamp(4rem,8vw,8rem)] leading-[0.82] tracking-[-0.06em]">Add options.</h1><Link href="/admin/products" className="text-xs uppercase tracking-[0.13em] underline underline-offset-4">Back to editor</Link></div>
    <div className="mt-14 grid gap-12 lg:grid-cols-3"><CreateCard title="New design"><form action={createDesign} className="grid gap-5"><input type="hidden" name="productId" value={product.id}/><Field name="slug" label="Slug" placeholder="midnight-bloom"/><Field name="name" label="Name"/><Field name="story" label="Story"/><Field name="sortOrder" label="Sort order" type="number" defaultValue="0"/><button className={button}>Create design</button></form></CreateCard>
    <CreateCard title="New colour"><form action={createColour} className="grid gap-5"><Field name="slug" label="Slug" placeholder="deep-ink"/><Field name="name" label="Name"/><Field name="hex" label="Hex colour" placeholder="#171717" pattern="#[0-9A-Fa-f]{6}"/><Field name="sortOrder" label="Sort order" type="number" defaultValue="0"/><button className={button}>Create colour</button></form></CreateCard>
    <CreateCard title="New size"><form action={createSize} className="grid gap-5"><Field name="code" label="Code" placeholder="OS"/><Field name="label" label="Label" placeholder="One size"/><Field name="sortOrder" label="Sort order" type="number" defaultValue="0"/><button className={button}>Create size</button></form></CreateCard></div>
    <section className="mt-16 border-t border-ink/20 pt-10"><p className="eyebrow">Sellable combination</p><h2 className="mt-2 font-display text-5xl">New variant</h2><form action={createVariant} className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4"><input type="hidden" name="productId" value={product.id}/><Select name="designId" label="Design" options={catalogue.designs.map((x) => [x.id, x.name])}/><Select name="colourId" label="Colour" options={catalogue.colours.map((x) => [x.id, x.name])}/><Select name="sizeId" label="Size" options={catalogue.sizes.map((x) => [x.id, `${x.code} — ${x.label}`])}/><Field name="sku" label="SKU" placeholder="RUS-MID-INK-OS"/><Field name="price" label="Price (EUR)" type="number" step="0.01" defaultValue="289.00"/><Field name="onHand" label="Initial on-hand" type="number" defaultValue="0"/><button className={`${button} self-end`}>Create variant</button></form></section>
  </main>;
}
function CreateCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-t border-ink/20 pt-6"><h2 className="mb-7 font-display text-4xl">{title}</h2>{children}</section>; }
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { const { label, ...input } = props; return <label className="text-sm">{label}<input required className={field} {...input}/></label>; }
function Select({ name, label, options }: { name: string; label: string; options: Array<[number, string]> }) { return <label className="text-sm">{label}<select required className={field} name={name}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>; }

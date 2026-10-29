import type { Locale } from "./config";

export const dictionaries = {
  en: {
    menu: "Menu", close: "Close", bag: "Bag", language: "Change language",
    nav: { "/": "Home", "/shop": "Shop", "/about": "About", "/faq": "FAQ", "/contact": "Contact" } as Record<string, string>,
    statement: "A single silhouette, made for many lives.", country: "Greece", shipping: "Worldwide shipping",
  },
  el: {
    menu: "Μενού", close: "Κλείσιμο", bag: "Τσάντα", language: "Αλλαγή γλώσσας",
    nav: { "/": "Αρχική", "/shop": "Κατάστημα", "/about": "Σχετικά", "/faq": "Ερωτήσεις", "/contact": "Επικοινωνία" } as Record<string, string>,
    statement: "Μία σιλουέτα, φτιαγμένη για πολλές ζωές.", country: "Ελλάδα", shipping: "Αποστολές παγκοσμίως",
  },
} satisfies Record<Locale, object>;
export type Dictionary = (typeof dictionaries)[Locale];

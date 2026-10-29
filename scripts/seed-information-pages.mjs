import mysql from "mysql2/promise";
const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required.");
const pages=[
  ["shipping","Εξυπηρέτηση / Αποστολή","Service / Shipping","Αποστολές & courier","Shipping & courier"],
  ["payment-methods","Εξυπηρέτηση / Πληρωμές","Service / Payments","Τρόποι πληρωμής","Payment methods"],
  ["returns","Νομικά / Μετά την αγορά","Legal / Aftercare","Πολιτική επιστροφών","Returns policy"],
  ["cookies","Νομικά / Cookies","Legal / Cookies","Πολιτική cookies","Cookies policy"],
  ["privacy-policy","Νομικά / Απόρρητο","Legal / Privacy","Πολιτική απορρήτου","Privacy policy"],
  ["terms","Νομικά / Κατάστημα","Legal / Store","Όροι & προϋποθέσεις","Terms & conditions"],
  ["care-guide","Το ένδυμα / Φροντίδα","The garment / Care","Φροντίδα & εφαρμογή","Care & fit"],
];
const database=await mysql.createConnection(url);
try{for(const [slug,eyebrowEl,eyebrowEn,titleEl,titleEn] of pages){await database.execute("INSERT IGNORE INTO store_information_pages (slug,status,eyebrow_el,eyebrow_en,title_el,title_en,intro_el,intro_en,sections) VALUES (?,'draft',?,?,?,?,?,?,?)",[slug,eyebrowEl,eyebrowEn,titleEl,titleEn,"Συμπληρώστε και ελέγξτε το εγκεκριμένο ελληνικό εισαγωγικό κείμενο πριν από τη δημοσίευση.","Complete and review the approved English introduction before publishing.",JSON.stringify({el:[],en:[]})]);}console.log("Information page drafts are available in Admin. Existing public copy remains active until a complete bilingual page is published.");}finally{await database.end();}

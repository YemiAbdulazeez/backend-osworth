const STAMP = "2008-09-01 00:00:00.000";
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

/** One distinct cover image per seeded news article */
const NEWS_IMAGES = [
  unsplash("photo-1576091160399-112ba8d25d1d"), // pharmacy / healthcare access
  unsplash("photo-1587854692152-cbe660dbde88"), // lab / manufacturing heritage
  unsplash("photo-1556228720-195a672e8a03"), // personal care / skincare
  unsplash("photo-1579684385127-1ef15d508118"), // logistics / distribution
  unsplash("photo-1576091160550-2173dba999ef"), // team / commitment
  unsplash("photo-1631815588090-d4bfec5b1ccb"), // orders / digital
  unsplash("photo-1527613426441-4da17471b66d"), // careers / healthcare workers
] as const;

export function nid(group: string, n: number): string {
  return `00000000-0000-4000-${group}-${String(n).padStart(12, "0")}`;
}

export const SETTINGS = {
  key: "global",
  company_name: "Osworth Nigeria Limited",
  hotline: "+234 XXX XXX XXXX",
  email: null,
  address: null,
  logo_url: "/osworth-logo.png",
  social_facebook: null,
  social_instagram: null,
  social_linkedin: null,
  social_x: null,
  newsletter_text: "Get updates on our products, healthcare initiatives and company news.",
  footer_text: "© Osworth Nigeria Limited",
  may_and_baker_url: null,
  seo_title: "Osworth Nigeria Limited — Quality Healthcare Within Reach",
  seo_description:
    "Quality pharmaceutical, personal care and healthcare products from Osworth Nigeria Limited, a wholly owned subsidiary of May & Baker Nigeria Plc.",
  ecommerce_enabled: 0,
  updated_at: STAMP,
};

export const CATEGORIES = [
  ["Oral Pharmaceuticals", "oral-pharmaceuticals", "Tablets and syrups for everyday therapeutic needs.", "Pill", 1],
  ["Antifungal", "antifungal", "Formulations for fungal infections of the skin and nails.", "Sparkles", 2],
  ["Antibiotics / Antibacterials", "antibiotics-antibacterials", "Antibacterial therapies for susceptible infections.", "ShieldCheck", 3],
  ["Cardiometabolic", "cardiometabolic", "Products supporting metabolic and cardiovascular care.", "HeartPulse", 4],
  ["Vitamins", "vitamins", "Vitamin and supplement formulations.", "Sparkles", 5],
  ["Injectables", "injectables", "Injectable pharmaceutical presentations.", "Syringe", 6],
  ["Topical Pharmaceuticals", "topical-pharmaceuticals", "Creams and gels for dermatological care.", "Stethoscope", 7],
  ["Topical Analgesics", "topical-analgesics", "Topical formulations for musculoskeletal pain.", "HeartPulse", 8],
  ["Personal Care", "personal-care", "Personal care and first-aid formulations.", "Sparkles", 9],
  ["Personal Care / Cosmeceuticals", "personal-care-cosmeceuticals", "Cosmeceutical skin care formulations.", "Sparkles", 10],
  ["Antiseptic / Disinfectant", "antiseptic-disinfectant", "Antiseptic and disinfectant solutions.", "ShieldCheck", 11],
].map((row, index) => ({
  id: nid("a000", index + 21),
  name: row[0],
  slug: row[1],
  description: row[2],
  image_url: null,
  icon: row[3],
  status: "published",
  sort_order: row[4],
  created_at: STAMP,
}));

type ProductSeed = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  active_ingredient: string | null;
  pack_size: string | null;
  short_description: string | null;
  full_description: string | null;
  featured: number;
  sort_order: number;
};

function product(partial: Omit<ProductSeed, "id"> & { n: number }): ProductSeed {
  return {
    id: nid("a000", partial.n),
    name: partial.name,
    slug: partial.slug,
    category: partial.category,
    subcategory: partial.subcategory,
    active_ingredient: partial.active_ingredient,
    pack_size: partial.pack_size,
    short_description: partial.short_description,
    full_description: partial.full_description,
    featured: partial.featured,
    sort_order: partial.sort_order,
  };
}

export const PRODUCTS: ProductSeed[] = [
  product({ n: 1, name: "TYDISIL TABLET 250MG", slug: "tydisil-tablet-250mg", category: "Antifungal", subcategory: "Tablets", active_ingredient: "Terbinafine Hydrochloride", pack_size: "2 x 7 tablets", short_description: "Oral antifungal tablet for fungal infections of the skin and nails.", full_description: "TYDISIL Tablet 250mg (Terbinafine Hydrochloride) is an antifungal medication indicated for the treatment of fungal infections of the skin and nails caused by specified dermatophytes.", featured: 1, sort_order: 1 }),
  product({ n: 2, name: "OSWORTH CIPROFLOXACIN 500MG TABLET", slug: "osworth-ciprofloxacin-500mg-tablet", category: "Antibiotics / Antibacterials", subcategory: "Tablets", active_ingredient: "Ciprofloxacin", pack_size: "10 tablets", short_description: "Broad-spectrum fluoroquinolone antibiotic tablet.", full_description: "OSWORTH Ciprofloxacin 500mg Tablet is a broad-spectrum fluoroquinolone antibiotic used for the treatment of susceptible bacterial infections.", featured: 1, sort_order: 2 }),
  product({ n: 3, name: "OSWORTH METFORMIN 500MG TABLET", slug: "osworth-metformin-500mg-tablet", category: "Cardiometabolic", subcategory: "Tablets", active_ingredient: "Metformin", pack_size: "84 tablets", short_description: "Oral antidiabetic tablet for type 2 diabetes management.", full_description: "OSWORTH Metformin 500mg Tablet is an oral antidiabetic medication used in the management of type 2 diabetes mellitus.", featured: 1, sort_order: 3 }),
  product({ n: 5, name: "OSWORTH DICLOFENAC 75MG/3ML AMPOULE", slug: "osworth-diclofenac-75mg-3ml-ampoule", category: "Injectables", subcategory: null, active_ingredient: "Diclofenac", pack_size: "10 x 10 ampoules", short_description: "NSAID ampoule for short-term management of acute pain.", full_description: "OSWORTH Diclofenac 75mg/3ml Ampoule is an NSAID indicated for the short-term management of acute pain and inflammation.", featured: 0, sort_order: 4 }),
  product({ n: 6, name: "OSWORTH ARTEMETHER 80MG AMPOULE", slug: "osworth-artemether-80mg-ampoule", category: "Injectables", subcategory: "Antimalarials", active_ingredient: "Artemether", pack_size: "10 x 6 ampoules", short_description: "Antimalarial ampoule for acute or severe malaria.", full_description: "OSWORTH Artemether 80mg Ampoule is an antimalarial medication indicated for the treatment of acute or severe malaria when oral antimalarial therapy is not feasible.", featured: 0, sort_order: 5 }),
  product({ n: 7, name: "OSWORTH GENTAMICIN INJECTION 80MG/2ML AMPOULE", slug: "osworth-gentamicin-injection-80mg-2ml-ampoule", category: "Injectables", subcategory: "Antibiotics", active_ingredient: "Gentamicin", pack_size: "10 x 10 ampoules", short_description: "Aminoglycoside antibiotic injection.", full_description: "OSWORTH Gentamicin Injection 80mg/2ml Ampoule is an aminoglycoside antibiotic indicated for infections caused by susceptible bacteria.", featured: 0, sort_order: 6 }),
  product({ n: 8, name: "TYDINEAL CREAM", slug: "tydineal-cream", category: "Topical Pharmaceuticals", subcategory: null, active_ingredient: "Ketoconazole 10mg + Neomycin 5000IU + Clobetasol 0.25mg", pack_size: "20g", short_description: "Triple-action topical cream.", full_description: "Triple-action topical formulation containing antifungal, antibacterial and anti-inflammatory components.", featured: 0, sort_order: 7 }),
  product({ n: 9, name: "TYDISIL CREAM", slug: "tydisil-cream", category: "Topical Pharmaceuticals", subcategory: null, active_ingredient: "Terbinafine 1%", pack_size: "20g", short_description: "Topical antifungal cream.", full_description: "Topical antifungal formulation used for common fungal skin infections.", featured: 0, sort_order: 8 }),
  product({ n: 10, name: "TYDIBACT PLUS CREAM", slug: "tydibact-plus-cream", category: "Topical Pharmaceuticals", subcategory: null, active_ingredient: "Clotrimazole 1% + Neomycin 0.5% + Betamethasone 0.05%", pack_size: "30g", short_description: "Triple-action topical cream.", full_description: "Triple-action topical formulation combining antifungal, antibiotic and anti-inflammatory components.", featured: 0, sort_order: 9 }),
  product({ n: 11, name: "TYDICLEAR CREAM", slug: "tydiclear-cream", category: "Topical Pharmaceuticals", subcategory: null, active_ingredient: "Clobetasol Propionate 0.05%", pack_size: "30g", short_description: "Topical corticosteroid cream.", full_description: "Topical corticosteroid formulated for inflammatory skin conditions.", featured: 0, sort_order: 10 }),
  product({ n: 12, name: "BOROCARE NEEM CREAM", slug: "borocare-neem-cream", category: "Personal Care", subcategory: "First Aid", active_ingredient: "Neem, Aloe vera, Sesame and other botanical ingredients", pack_size: "30g", short_description: "Natural-ingredient first-aid skin cream.", full_description: "A natural-ingredient formulation containing Neem, Aloe vera, Sesame and other botanical ingredients, positioned for first-aid skin care and wound-healing support.", featured: 1, sort_order: 11 }),
  product({ n: 13, name: "ANOFAST GEL", slug: "anofast-gel", category: "Topical Analgesics", subcategory: null, active_ingredient: "Aceclofenac, Linseed Oil, Methyl Salicylate, Capsaicin", pack_size: "30g", short_description: "Topical analgesic gel for musculoskeletal pain.", full_description: "Topical analgesic gel formulated for musculoskeletal pain and inflammation.", featured: 0, sort_order: 12 }),
  product({ n: 14, name: "KLARACT CREAM", slug: "klaract-cream", category: "Personal Care / Cosmeceuticals", subcategory: null, active_ingredient: "Polyherbal formulation", pack_size: "30g", short_description: "Cosmeceutical cream for skin hydration.", full_description: "Polyherbal formulation positioned around skin hydration and supporting the appearance of stretch marks and skin blemishes.", featured: 0, sort_order: 13 }),
  product({ n: 4, name: "OSWORTH VITAMIN C SYRUP", slug: "osworth-vitamin-c-syrup", category: "Vitamins", subcategory: "Syrups", active_ingredient: "Vitamin C 100mg/5ml", pack_size: "100ml", short_description: "Vitamin C syrup supporting immune function and vitality.", full_description: "OSWORTH Vitamin C Syrup 100mg/5ml is a vitamin C supplement formulated to support immune function and overall health and vitality.", featured: 1, sort_order: 14 }),
  product({ n: 15, name: "M&B ISOPROPYL ALCOHOL", slug: "mb-isopropyl-alcohol", category: "Antiseptic / Disinfectant", subcategory: null, active_ingredient: "Isopropyl Alcohol", pack_size: "200ml", short_description: "Isopropyl alcohol disinfectant solution.", full_description: "Isopropyl alcohol solution suitable for disinfecting skin surfaces prior to injections or minor procedures and suitable hard surfaces.", featured: 0, sort_order: 15 }),
];

export const HERO = [
  ["Quality Healthcare. Within Reach.", "Osworth Nigeria Limited", "Quality pharmaceutical, personal care and healthcare products designed to support healthier lives.", "Explore Our Products", "/products"],
  ["Healthcare Solutions Built Around People", "Safe. Effective. Affordable.", "We are committed to making safe, effective and affordable healthcare products available to the people we serve.", "View Our Range", "/products"],
  ["Trusted Healthcare Products for Nigeria and Beyond", "Nigerian roots. African ambition.", "We serve customers across Nigeria and aim to extend our value creation to other African markets.", "About Osworth", "/about"],
  ["Part of the May & Baker Nigeria Family", "A wholly owned subsidiary", "We leverage the heritage, reputation and pharmaceutical expertise of May & Baker Nigeria Plc.", "Discover May & Baker", "/may-and-baker"],
].map((row, index) => ({
  id: nid("a400", index + 1),
  title: row[0],
  subtitle: row[1],
  description: row[2],
  image_url: null,
  cta_label: row[3],
  cta_url: row[4],
  active: 1,
  sort_order: index + 1,
  created_at: STAMP,
}));

export const DISTRIBUTORS = [
  ["Lagos Healthcare Supplies Ltd", "Lagos", "South West", "12 Adeola Odeku Street, Victoria Island, Lagos", "+234 801 000 1001", "lagos@osworth-partners.ng", "Adaobi Okeke"],
  ["Abuja Pharma Network", "FCT", "North Central", "Plot 45, Adetokunbo Ademola Crescent, Wuse II, Abuja", "+234 802 000 1002", "abuja@osworth-partners.ng", "Ibrahim Musa"],
  ["Port Harcourt Medical Distributors", "Rivers", "South South", "18 Aba Road, Port Harcourt, Rivers State", "+234 803 000 1003", "ph@osworth-partners.ng", "Grace Eze"],
  ["Kano Wellness Partners", "Kano", "North West", "7 Zoo Road, Kano", "+234 804 000 1004", "kano@osworth-partners.ng", "Amina Bello"],
  ["Ibadan Care Distributors", "Oyo", "South West", "22 Ring Road, Ibadan, Oyo State", "+234 805 000 1005", "ibadan@osworth-partners.ng", "Tunde Adebayo"],
  ["Enugu Health Logistics", "Enugu", "South East", "5 Ogui Road, Enugu", "+234 806 000 1006", "enugu@osworth-partners.ng", "Chinedu Obi"],
  ["Benin City Pharma Hub", "Edo", "South South", "9 Airport Road, Benin City", "+234 807 000 1007", "benin@osworth-partners.ng", "Osas Idemudia"],
  ["Kaduna Medical Stores", "Kaduna", "North West", "14 Ahmadu Bello Way, Kaduna", "+234 808 000 1008", "kaduna@osworth-partners.ng", "Fatima Yusuf"],
].map((row, index) => ({
  id: nid("a500", index + 1),
  name: row[0],
  state: row[1],
  region: row[2],
  address: row[3],
  phone: row[4],
  email: row[5],
  contact_person: row[6],
  status: "published",
  created_at: STAMP,
}));

export const PAGES = [
  ["home", "spotlight", "Healthcare Products Designed for Everyday Needs", "Featured range", "A selection from our pharmaceutical, personal care and wellness portfolio.", null, "View all products", "/products", 1],
  ["home", "categories", "Explore by Category", "Our portfolio", "From oral pharmaceuticals to personal care, browse the Osworth range.", null, null, null, 2],
  ["about", "hero", "Improving Lives Through Quality Healthcare", "About Osworth", "An indigenous Nigerian healthcare company and a wholly owned subsidiary of May & Baker Nigeria Plc.", null, null, null, 1],
  ["may-and-baker", "hero", "Part of the May & Baker Nigeria Family", "Our parent company", "Osworth Nigeria Limited is a wholly owned subsidiary of May & Baker Nigeria Plc, Nigeria's premier manufacturing pharmaceutical company.", null, "Learn More About May & Baker", "", 1],
  ["contact", "hero", "We would like to hear from you", "Contact Us", "Reach Osworth for product enquiries, distributor information or general questions.", null, null, null, 1],
].map((row, index) => ({
  id: nid("a200", index + 1),
  page_key: row[0],
  section_key: row[1],
  title: row[2],
  subtitle: row[3],
  description: row[4],
  image_url: row[5],
  cta_label: row[6],
  cta_url: row[7],
  visible: 1,
  sort_order: row[8],
  created_at: STAMP,
}));

export const NEWS = [
  ["quality-healthcare-within-reach", "Quality Healthcare Within Reach Across Nigeria", "Osworth continues to expand access to affordable pharmaceutical and personal care products for communities nationwide.", "Osworth Nigeria Limited continues to expand access to affordable pharmaceutical and personal care products for communities across Nigeria. From bustling urban pharmacies to partner networks serving towns and regions in multiple states, our focus remains consistent: quality healthcare that people can actually reach, not merely read about in a brochure. We measure success in stocked shelves, informed pharmacists, and families who can trust what they buy when illness or daily wellness needs arise.\n\nOur teams work every day with distributors, healthcare professionals, hospital procurement units and retail partners to keep essential medicines and wellness products available where demand is highest. As a wholly owned subsidiary of May & Baker Nigeria Plc, we draw on established manufacturing expertise, rigorous quality systems and a pharmaceutical heritage that spans decades. That foundation allows us to pair affordability with reliability, so customers do not have to choose between cost and confidence at the counter.\n\nIn practice, healthcare within reach means clearer product information on packs and in our digital catalogue, responsive follow-up when you submit an order request through this website, and a portfolio that spans oral pharmaceuticals, injectables, topical treatments, vitamins, supplements and personal care. We listen to pharmacists and clinicians about which formulations matter in their communities, and we align supply planning and marketing support with those realities rather than pushing ranges that sit unused in warehouses.\n\nGeography in Nigeria presents genuine logistics challenges, from last-mile delivery to seasonal demand shifts. We invest in distributor relationships, training, catalogue updates and open communication so that stock movement and product visibility improve over time. When a partner or institution submits an enquiry, an Osworth representative confirms availability, discusses pricing and outlines fulfilment steps. There is no online payment on this platform; the human follow-up is deliberate, so accuracy and local context stay at the centre of every transaction.\n\nPublic health priorities evolve, and our portfolio planning tries to stay ahead of predictable demand for essential medicines while remaining honest about what any single company can supply. We collaborate with healthcare professionals to understand prescribing patterns, seasonal illness trends and the role of personal care in prevention. That insight informs which items we highlight in communications, which SKUs we prioritize for distributor replenishment and how we describe products on this website so pharmacists can counsel patients with confidence.\n\nWe also recognize that trust is built in small moments: a representative returning a call, a carton arriving intact, a leaflet that explains storage clearly. Osworth marketing and sales teams are trained to represent the May & Baker subsidiary brand with professionalism and restraint — no exaggerated claims, no pressure tactics, and always a path to human support when someone needs more detail than a product page can provide.\n\nWe remain committed to making safe, effective and affordable healthcare products available to the people we serve today, and to extending that value creation across Africa as our network and portfolio grow. Every product range we introduce is assessed against the same question: does this help someone live healthier, with less friction between need and solution? That question guides our field teams, our customer care culture and the way we show up for partners nationwide.\n\nThank you for reading this update. Browse our catalogue on the Products page, explore distributor contacts on the Contact page, and submit an order request whenever you are ready to discuss availability in your state. Together with May & Baker Nigeria Plc, we are building a healthcare company that Nigerians can rely on — one community, one pharmacy and one fulfilled request at a time.", "2026-03-12", "Company"],
  ["may-and-baker-heritage", "Leveraging the May & Baker Pharmaceutical Heritage", "As a wholly owned subsidiary of May & Baker Nigeria Plc, Osworth draws on decades of manufacturing expertise.", "As a wholly owned subsidiary of May & Baker Nigeria Plc, Osworth Nigeria Limited leverages the heritage, reputation, manufacturing expertise and pharmaceutical experience of its parent company. That relationship is not a footnote on our letterhead; it is the structural reason partners and healthcare professionals can expect consistency from batch to batch and from one state distribution channel to another.\n\nMay & Baker Nigeria Plc has long been associated with serious pharmaceutical manufacturing in Nigeria — facilities, quality control disciplines and people who understand both regulation and real-world patient needs. Osworth inherits that culture while focusing on markets, brands and customer segments where agile marketing, personal care innovation and nationwide reach create additional value. We combine parent-company strength with a subsidiary mindset that stays close to pharmacies, hospitals and retail aisles.\n\nFor partners, the heritage translates into confidence. Products are backed by systems, trained personnel and a brand with deep roots in Nigerian pharmaceutical manufacturing. Documentation, storage expectations and promotional materials reflect standards that have been tested over years, not weeks. For patients and consumers, the same heritage supports our promise of healthcare within reach: formulations they can trust, presented honestly, and supported by representatives who know the range.\n\nOur portfolio strategy respects that lineage. Pharmaceutical lines benefit from formulation know-how and supply chain maturity. Personal care and wellness extensions are developed with the same attention to quality raw materials, packaging integrity and clear usage guidance. When we launch or refresh a range, we ask how it honours the May & Baker name while solving a practical problem for Nigerian households and clinicians.\n\nCollaboration between parent and subsidiary also strengthens talent development. Technical, regulatory and commercial knowledge flows in both directions, so Osworth staff grow careers inside a wider healthcare ecosystem rather than in isolation. That matters when recruiting experienced professionals and when onboarding new graduates who want purpose-led work in pharmaceuticals and consumer health.\n\nQuality assurance is another area where heritage shows up in everyday work. Batch traceability, complaint handling procedures and recall readiness are not abstract policies on a shelf; they are practices our teams rehearse and distributors are briefed to support. When questions arise at pharmacy level, escalation paths exist so concerns reach the right technical colleagues quickly. That structure protects patients and protects the reputations both companies have built over generations.\n\nEthical promotion matters as well. Osworth field teams are expected to present evidence-aligned product information, respect institutional formularies and never substitute marketing conversation for clinical judgment. Our digital channels mirror that standard: news articles, product descriptions and FAQs explain what we offer without pretending to diagnose or treat online visitors. Healthcare within reach includes reachable, truthful information.\n\nLooking ahead, we will continue to communicate how May & Baker expertise shapes Osworth operations — from manufacturing partnerships to quality assurance and ethical marketing. If you are a distributor, institution or healthcare buyer evaluating suppliers, we invite you to speak with our team, review product information on this website and submit order requests for the items you need. No payment is taken online; a representative will follow up with next steps. Our heritage is Nigerian; our ambition is healthier lives across the nation and, in time, across the continent.", "2026-02-04", "Partnership"],
  ["personal-care-portfolio-update", "Growing Our Personal Care and Wellness Portfolio", "From first-aid skin care to cosmeceuticals, our range supports everyday health and wellbeing.", "From first-aid skin care to cosmeceuticals, the Osworth personal care and wellness range is designed to support everyday health and wellbeing. These products sit alongside our pharmaceutical portfolio so customers can find practical solutions for both clinical needs and daily care routines in one trusted catalogue.\n\nWe continue to broaden formulations that meet real customer needs — whether for dermatological care, hygiene, sun protection, minor wound management or daily wellness habits — while maintaining our focus on quality and affordability. Each addition to the range is assessed for relevance, clarity of use, packaging suitability for Nigerian retail environments and fit with the communities we serve through pharmacies and partner stores.\n\nPersonal care is not separate from our healthcare mission; it is part of how people experience health between clinic visits. Clear labels, realistic claims and education for counter staff help consumers choose appropriately. We work with distributors to ensure new SKUs appear in planograms, training notes and seasonal campaigns where they add genuine value rather than clutter.\n\nRetail partners and distributors play a central role in making personal care products visible and available. Through this website, customers can browse the catalogue, read product descriptions, add items to an order request and receive follow-up from an Osworth representative. Prices are not displayed online, and no payment is collected on the platform — the same order-request model we use for pharmaceutical lines, designed for accuracy and relationship-based fulfilment.\n\nBehind the scenes, product managers coordinate with May & Baker Nigeria Plc manufacturing strengths and approved suppliers so that quality standards remain aligned with group expectations. Stability, shelf life and storage guidance are communicated to partners to protect product integrity from factory to home bathroom shelf.\n\nConsumer education is a shared responsibility. We provide point-of-sale friendly summaries where appropriate and encourage pharmacists to discuss contraindications and sensible use, especially for cosmeceutical items that sit between cosmetic and therapeutic expectations. Seasonal campaigns may highlight sun care during hotter months or skin hydration during harmattan-influenced dryness, always tied to products that are actually available through our distributor network rather than aspirational listings.\n\nSustainability and responsible sourcing increasingly influence buyer decisions. While our primary promise remains quality and access, we review packaging formats and supplier practices where improvements reduce waste without compromising safety seals or tamper evidence. Partners who feedback on pack sizes, pump formats or multipack options help us refine ranges that fit Nigerian households and clinic budgets alike.\n\nWe publish portfolio updates here on the news page when major personal care launches or reformulations are ready for market, so you can plan merchandising and staff briefings ahead of peak seasons.\n\nIf you are refreshing your personal care aisle or expanding institutional supplies for staff wellness programmes, we encourage you to explore the Products page and note items of interest. Submit a consolidated order request with contact details, and our team will respond regarding availability, commercial terms and delivery arrangements in your state. We are grateful for partners who help us put everyday wellness within reach — product by product, shelf by shelf, community by community.", "2026-01-18", "Products"],
  ["distributor-network-support", "Supporting Distributors Across Nigerian States", "Our teams work closely with partners in marketing, sales and distribution to keep products available where they are needed.", "Our marketing, sales and distribution teams work closely with partners across Nigerian states to keep Osworth products available where they are needed. A strong distributor network is essential to our model of healthcare within reach, because manufacturing excellence only matters if the right pack reaches the right pharmacy or hospital at the right time.\n\nStrong distributor relationships help pharmacies, hospitals, clinics and retail outlets serve their communities with reliable supply and clear product information. We treat distributors as extensions of our commercial family: they hear market feedback first, they see stock gaps before headquarters does, and they often train counter staff who answer patient questions. Supporting them well is supporting end customers well.\n\nOrder requests submitted through this website are followed up by representatives who can confirm availability, discuss pricing and explain next steps — without online payment on this platform. That workflow complements distributor-led fulfilment rather than replacing it. Many partners prefer human confirmation for bulk institutional orders or mixed pharmaceutical and personal care baskets, and we designed our digital experience accordingly.\n\nWe continue to invest in clearer communication, faster response times and better visibility of product ranges so partners can serve customers with confidence. Training materials, catalogue updates, seasonal availability notices and direct access to Osworth contacts all contribute to that goal. When a new formulation launches or an existing line receives refreshed packaging, distributors receive coordinated information so messaging stays consistent nationwide.\n\nGeographic diversity across Nigeria means no single playbook fits every state. Our teams listen to regional managers about transport constraints, credit practices and competitive dynamics, then adjust support where appropriate within group policy. The objective remains steady: reduce stock-outs of essential items, improve forecast accuracy and strengthen trust between Osworth, distributors and the healthcare professionals who rely on both.\n\nPerformance reviews with key distributors focus on service levels, not vanity metrics alone. We discuss fill rates, communication timeliness and joint visits to priority pharmacies where education can improve appropriate product use. When this website generates order requests in a territory, those leads are shared with the relevant partner where commercial agreements allow, so digital interest converts into supplied shelves rather than duplicate outreach.\n\nCompliance with applicable pharmaceutical marketing and distribution regulations is non-negotiable. Distributors receive guidance on storage conditions, especially for temperature-sensitive lines, and on record keeping that supports audits. Osworth representatives are available for joint customer meetings when institutions request formal product briefings before adding items to procurement lists.\n\nOur long-term aim is a distributor network where every state has knowledgeable partners who can explain Osworth ranges as confidently as they manage invoices and deliveries — because healthcare within reach is ultimately a local accomplishment supported by national standards.\n\nFor distributor contacts in your state, visit the Contact page and use the distributor directory, or send a message through our contact form. If you are exploring a new distribution partnership, introduce your company, coverage areas and channels — our business development colleagues will respond. Thank you to every partner who helps Osworth deliver safe, effective and affordable products from May & Baker heritage to the people who need them daily.", "2025-12-09", "Distribution"],
  ["healthcare-within-reach-commitment", "Our Commitment to Healthcare Within Reach", "Safe, effective and affordable products remain at the heart of how Osworth serves customers and communities.", "Safe, effective and affordable healthcare products remain at the heart of how Osworth Nigeria Limited serves customers and communities. Our mission is to improve quality of life by providing healthcare solutions people can trust and access — not only in major cities, but wherever our distributor network and institutional partners operate.\n\nFrom pharmaceutical formulations to personal care and wellness, every range is guided by quality standards and a clear focus on accessibility. We work with partners nationwide so that healthcare solutions stay within reach for the people who need them, whether through community pharmacies, hospital formularies, occupational health programmes or modern retail channels that consumers visit every week.\n\nThis commitment also shapes how we operate online. The Osworth website is an information and order-request platform: browse products, submit a request with your contact details, and a representative will follow up. No prices are displayed and no payment is taken online. We chose that model deliberately so pricing and stock conversations reflect local realities, contractual terms and current availability rather than static ecommerce assumptions.\n\nAffordability does not mean compromising safety. As a wholly owned subsidiary of May & Baker Nigeria Plc, we align with manufacturing and quality expectations that protect patients and consumers. Promotional language is reviewed for accuracy. Product information on this site is informational, not a substitute for professional medical advice — we repeat that clearly because responsible marketing is part of healthcare within reach.\n\nInternally, our values — customer delight, value creation, customer satisfaction and business management excellence — translate into measurable behaviours: answering enquiries promptly, resolving supply issues transparently and treating distributor feedback as strategic input. Employees across sales, marketing, distribution and support share responsibility for the promise our brand makes in the market.\n\nCommunity impact extends beyond individual transactions. Where institutions run outreach clinics or pharmacy associations host health days, Osworth may support with product education materials approved through our medical governance process — never replacing professional diagnosis, but helping people understand how over-the-counter and personal care items fit into broader care plans. We measure long-term success in relationships that endure across product cycles and leadership changes.\n\nTransparency also means being clear about what this website does not do. It does not dispense medical advice, display live inventory for every SKU in every state or process card payments. Those boundaries protect consumers and align with how regulated and semi-regulated products are typically sold in Nigeria. When you need clinical guidance, we always point you back to qualified healthcare professionals; when you need supply, we point you to order requests and representative follow-up.\n\nMay & Baker Nigeria Plc heritage reinforces that discipline: brands with longevity survive by earning trust repeatedly, not by chasing short-term conversion tricks on a website.\n\nWe invite you to hold us accountable to that promise. Read news updates here, explore careers if you want to join a purpose-led team, and use the Contact page whenever you need a human conversation about products or partnerships. Healthcare within reach is a daily practice, not a slogan — and Osworth is committed to living it in every state we serve.", "2025-11-02", "Company"],
  ["order-request-how-it-works", "How Order Requests Work on the Osworth Website", "Browse products, build a cart and submit a request — an Osworth representative will contact you with next steps.", "The Osworth Nigeria Limited website is designed for product discovery and order requests — not online checkout. Customers can browse the catalogue, add products to a cart and submit contact details so our team can follow up with availability, pricing and fulfilment guidance tailored to their location and channel.\n\nThere is no online payment and no requirement to create a customer account. Staff logins are reserved for the CMS dashboard used by Osworth colleagues to manage content, products and enquiries. When you submit an order request, you receive confirmation that your enquiry has been received, and a representative will contact you about next steps. This keeps sensitive commercial details off automated checkout flows and preserves the relationship-based model our pharmacy and institutional clients prefer.\n\nThis approach keeps the experience simple for pharmacies, hospitals, distributors and retail buyers who value accurate human follow-up. It also lets us share up-to-date information that may vary by state, stock position and product category. Pharmaceutical lines, injectables and regulated items especially benefit from confirmation before commitment, rather than instant payment for items that may require additional documentation or lead time.\n\nTo get started, explore the Products page and use categories or search to find what you need. Add quantities to your cart, then proceed to the order request form at checkout. Provide a reachable phone number, email address and any notes about delivery location or urgency. Our team routes enquiries internally to the appropriate sales or customer care colleague, who will respond as quickly as operational hours allow.\n\nYou will not see product prices listed on the public site. Commercial terms are communicated after review of your request, consistent with our B2B and partner-focused positioning. Payment, if applicable, is arranged through agreed offline channels — not through this website — which protects both parties and aligns with how many Nigerian healthcare supply relationships already function.\n\nPrivacy and data handling deserve a brief mention. Contact details you submit with an order request are used to fulfil your enquiry and improve service; they are not sold as a mailing list commodity. Our team may reference your request history internally so repeat pharmacy or hospital buyers receive faster assistance, always within applicable data protection expectations and company policy.\n\nAfter your first request, keep your phone available — representatives often confirm quantities, suggest alternatives if an item is temporarily constrained and coordinate with distributors serving your state. You may also be directed to an authorized distributor contact listed on the Contact page when that path is faster for localized delivery. Either way, the goal is the same: move from intent to supplied product without friction or misleading online checkout promises.\n\nFor general questions unrelated to a specific basket, use the Contact page or the published hotline in the site header. For distributor lookups by state, use the directory on the Contact page. We built this platform to respect your time while keeping Osworth representatives at the centre of every order journey — transparent, professional and free of online payment on this site.", "2025-10-14", "Orders"],
  ["building-careers-in-healthcare", "Building Careers in Healthcare with Osworth", "From sales and marketing to customer care, Osworth offers opportunities to grow with a purpose-led healthcare company.", "Osworth Nigeria Limited is supported by experienced professionals across value creation, customer satisfaction, marketing, sales, distribution and business management. We are always interested in people who share our commitment to quality healthcare within reach and who want to grow with a subsidiary rooted in May & Baker Nigeria Plc pharmaceutical excellence.\n\nCareers at Osworth span field and office roles that keep products moving, partners informed and customers supported. Sales and medical representation teams build relationships with pharmacies, hospitals and distributors. Marketing colleagues translate complex product stories into clear materials for diverse audiences. Supply and logistics staff coordinate with partners so stock reaches shelves. Customer care and inside sales respond to enquiries triggered by this website's order-request flow — every role connects directly to healthier communities.\n\nWe look for integrity, curiosity and collaboration. Healthcare marketing and distribution in Nigeria demand cultural intelligence, resilience and respect for regulatory boundaries. You will work alongside people who take product quality seriously and who treat distributor feedback as essential market intelligence. Training opportunities arise through parent-company expertise and on-the-job mentoring across states.\n\nOpen roles are listed on our Careers page and can be updated from the staff dashboard when hiring managers publish new vacancies. Requirements vary by function — commercial roles may emphasize relationship building and territory management; support roles may emphasize communication and CRM discipline; technical or regulatory paths may align with quality and product affairs. Read each listing carefully and apply with a CV that shows relevant achievement, not generic ambition alone.\n\nIf you do not see a matching vacancy today, you can still express interest through the Contact form. Include your area of expertise, preferred location and brief motivation. Our HR colleagues maintain talent pools for future openings and may reach out when a suitable role emerges. We appreciate candidates who understand that Osworth does not sell via online checkout on this site — demonstrating familiarity with our order-request model signals genuine research.\n\nBenefits and growth paths vary by role and tenure, but common themes include structured onboarding, exposure to May & Baker Nigeria Plc best practices and opportunities to work across functions when business needs align with your development goals. Field roles may travel within assigned territories; headquarters and regional office colleagues collaborate through regular reviews that emphasize both results and ethical conduct in the market.\n\nDiversity of background strengthens our commercial teams. We welcome applicants from pharmacy, life sciences, business administration, communications and logistics disciplines, provided they share our patient-centred mindset. Internships and graduate programmes may be announced on the Careers page when available; check back after major news updates or follow company announcements here for hiring drives tied to portfolio expansion.\n\nJoin us in delivering safe, effective and affordable healthcare products — and in growing a company that combines Nigerian pharmaceutical heritage with modern customer experience. Visit the Careers page for current openings, follow company news for culture updates, and take the next step when a role matches your skills. Healthcare careers are demanding; at Osworth, they are also purposeful.", "2025-09-20", "Careers"],
].map((row, index) => ({
  id: nid("a600", index + 1),
  slug: row[0],
  title: row[1],
  excerpt: row[2],
  body: row[3],
  published_on: row[4],
  category: row[5],
  image_url: NEWS_IMAGES[index % NEWS_IMAGES.length],
  status: "published",
}));

export const FAQS = [
  ["Can I buy products and pay online on this website?", "No. This website is an order-request platform. Browse products, add them to your cart and submit a request. An Osworth representative will contact you with the next steps. No online payment is taken.", "Orders"],
  ["Do I need an account to place an order request?", "No. Customers do not need to log in. Staff accounts are only for the CMS dashboard.", "Orders"],
  ["Where can I find distributor contacts?", "Visit the Contact page and use the distributor directory. Records are maintained by Osworth and can be filtered by state.", "Distributors"],
  ["Is product information medical advice?", "No. Product information is for general informational purposes. Please consult a qualified healthcare professional for appropriate medical advice and treatment.", "Products"],
  ["How is Osworth related to May & Baker Nigeria Plc?", "Osworth Nigeria Limited is a wholly owned subsidiary of May & Baker Nigeria Plc and leverages the heritage, reputation and pharmaceutical expertise of its parent company.", "Company"],
  ["How do I contact Osworth?", "Use the Contact form, the published hotline in the header, or email details managed from CMS settings once published.", "Support"],
].map((row, index) => ({
  id: nid("a700", index + 1),
  question: row[0],
  answer: row[1],
  category: row[2],
  status: "published",
  sort_order: index + 1,
  created_at: STAMP,
}));

export const CAREERS = [
  ["Sales Representative", "Lagos / Multi-state", "Full-time", "Support customer relationships and product availability across assigned territories in partnership with our distribution network."],
  ["Marketing Officer", "Lagos", "Full-time", "Help communicate Osworth’s pharmaceutical and personal care portfolio to healthcare professionals and retail partners."],
  ["Customer Care Associate", "Lagos", "Full-time", "Respond to product enquiries and order requests with clarity, professionalism and care."],
].map((row, index) => ({
  id: nid("a100", index + 1),
  title: row[0],
  location: row[1],
  type: row[2],
  summary: row[3],
  status: "published",
  sort_order: index + 1,
  created_at: STAMP,
}));

export const SUPER_ADMIN_ID = nid("a300", 1);
export { STAMP };

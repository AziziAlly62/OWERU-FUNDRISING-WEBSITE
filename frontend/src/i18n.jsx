import { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    brand: 'OWERU Foundation',
    tagline: 'Faith expressed through practical care',
    home: 'Home',
    about: 'About',
    requests: 'Requests',
    apply: 'Apply',
    ledger: 'Ledger',
    reports: 'Reports & Stories',
    safeguarding: 'Safeguarding',
    privacy: 'Privacy',
    complaints: 'Complaints',
    fundItem: 'Fund an Item',
    target: 'Target',
    raised: 'Raised',
    remaining: 'Remaining',
    deadline: 'Funding deadline',
    daysLeft: 'days left',
    fullyFunded: 'Fully Funded',
    inProgress: 'In Progress',
    viewDetails: 'View Details',
    fundNow: 'Fund Now',
    copyLink: 'Copy & Share',
    linkCopied: 'Link copied',
    shareWhatsApp: 'Share on WhatsApp',
    shareFacebook: 'Share on Facebook',
    shareX: 'Share on X',
    shareTelegram: 'Share on Telegram',
    shareImage: 'Download share image',
    mission: 'We equip communities to care for one another, with every gift tied to a verified need.',
    learnMore: 'Learn more',
    whyPlatform: 'Why fund through OWERU?',
    noCash: 'No cash transfers',
    noCashDesc: 'OWERU purchases equipment directly from approved suppliers. Funds never pass through applicants.',
    verified: 'Endorsed & verified',
    verifiedDesc: 'Every request is endorsed by a recognised church or organisation before review.',
    traceable: 'Fully traceable',
    traceableDesc: 'Fund an item from request to delivery, with public receipts and equipment registers.',
    allOrNothing: 'Fully funded or not collected',
    allOrNothingDesc: 'Each item has a 60-day funding window. If its full target is not reached, the donation is not collected.',
    footerAbout: 'Rooted in Christian service, OWERU connects people of goodwill with verified needs and practical support.',
    safetyPromise: 'Our promise',
    quickLinks: 'Quick Links',
    contact: 'Contact',
    login: 'Login',
  },
  sw: {
    brand: 'OWERU Foundation',
    tagline: 'Imani inayoonekana kwa upendo na huduma',
    home: 'Nyumbani',
    about: 'Kuhusu sisi',
    requests: 'Maombi',
    apply: 'Tuma Ombi',
    ledger: 'Ledger',
    reports: 'Ripoti na Hadithi',
    safeguarding: 'Usalama',
    privacy: 'Faragha',
    complaints: 'Malalamiko',
    fundItem: 'Fadhili Kifaa',
    target: 'Lengo',
    raised: 'Kilichokusanywa',
    remaining: 'Kilichosalia',
    deadline: 'Tarehe ya mwisho',
    daysLeft: 'siku zimebaki',
    fullyFunded: 'Imefadhiliwa Kabisa',
    inProgress: 'Inaendelea',
    viewDetails: 'Tazama Maelezo',
    fundNow: 'Fadhili Sasa',
    copyLink: 'Nakili na Kusambaza',
    linkCopied: 'Kiungo kimenakiliwa',
    shareWhatsApp: 'Sambaza WhatsApp',
    shareFacebook: 'Sambaza Facebook',
    shareX: 'Sambaza X',
    shareTelegram: 'Sambaza Telegram',
    shareImage: 'Pakua picha ya kusambaza',
    mission: 'Tunaviwezesha jamii kuhudumiana; kila mchango huelekezwa kwenye hitaji lililothibitishwa.',
    learnMore: 'Jifunze zaidi',
    whyPlatform: 'Kwa nini ufadhili kupitia OWERU?',
    noCash: 'Hakuna mgao wa fedha taslimu',
    noCashDesc: 'OWERU hununua vifaa moja kwa moja kutoka kwa wauzaji walioidhinishwa. Fedha haziwekwi mikononi mwa waombaji.',
    verified: 'Ombi hukaguliwa kwanza',
    verifiedDesc: 'Kila ombi huungwa mkono na kanisa au shirika linalotambulika kabla ya kuchapishwa.',
    traceable: 'Mchango unaweza kufuatiliwa',
    traceableDesc: 'Fuata kifaa kutoka ombi hadi uwasilishaji kupitia taarifa na risiti zinazowekwa wazi.',
    allOrNothing: 'Lengo likifikiwa ndipo malipo hukusanywa',
    allOrNothingDesc: 'Kila kifaa kina siku 60 za kufikia lengo lake lote. Lengo lisipofikiwa, mchango haukusanywi.',
    footerAbout: 'Kwa msingi wa huduma ya Kikristo, OWERU huunganisha watu wenye nia njema na mahitaji yaliyothibitishwa pamoja na msaada wa vitendo.',
    safetyPromise: 'Ahadi yetu',
    quickLinks: 'Viungo vya Haraka',
    contact: 'Wasiliana Nasi',
    login: 'Ingia',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangRaw] = useState(() => {
    try { return localStorage.getItem('oweru_lang') || 'en' } catch { return 'en' }
  })
  const setLang = (l) => {
    setLangRaw(l)
    try { localStorage.setItem('oweru_lang', l) } catch {}
  }
  const t = (key) => translations[lang][key] || translations.en[key] || key
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

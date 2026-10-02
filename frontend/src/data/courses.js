// Kozi za OWERU Foundation. Data hii iko ndani ya frontend kwa sasa;
// inaweza kubadilishwa kwa API wakati backend utakapopata table ya courses.

export const COURSES = [
  {
    slug: 'computer-basics-it',
    icon: 'book',
    weeks: 8,
    level: { en: 'Beginner', sw: 'Anayeanza' },
    title: { en: 'Computer Basics & IT', sw: 'Misingi ya Kompyuta na TEHAMA' },
    blurb: {
      en: 'Learn everyday computer use, operating systems and the office software that saves you hours every week.',
      sw: 'Jifunze matumizi ya msingi ya kompyuta, mifumo ya uendeshaji, na programu muhimu za ofisini.',
    },
    modules: {
      en: [
        'Hardware, hardware care and safe power handling',
        'Operating systems: files, folders and settings',
        'Word processing for letters and reports',
        'Spreadsheets: tables, formulas and charts',
        'Email, internet safety and strong passwords',
      ],
      sw: [
        'Vifaa, utunzaji wake na matumizi salama ya umeme',
        'Mifumo ya uendeshaji: mafaili, folda na mipangilio',
        'Uandishi wa barua na ripoti kwa kompyuta',
        'Majedwali: meza, hesabu na charti',
        'Barua pepe, usalama wa mtandao na nenosiri lenye nguvu',
      ],
    },
    outcome: {
      en: 'You will be able to run a small office or community registration desk confidently and without help.',
      sw: 'Utaweza kusimami ofisi ndogo au kijiweka cha kurekodiwa jamii bila msaada wa mtu mwingine.',
    },
  },
  {
    slug: 'web-development',
    icon: 'layers',
    weeks: 12,
    level: { en: 'Beginner to intermediate', sw: 'Anayeanza hadi wa kati' },
    title: { en: 'Web Development', sw: 'Ujenzi wa Tovuti' },
    blurb: {
      en: 'Build modern websites with HTML, CSS and JavaScript, then publish them using a widely used CMS.',
      sw: 'Jenga ujuzi wa kutengeneza tovuti za kisasa kwa kutumia HTML, CSS, JavaScript na CMS maarufu.',
    },
    modules: {
      en: [
        'How the internet and hosting actually work',
        'HTML structure and accessible page layout',
        'CSS styling, responsive design and mobile layouts',
        'JavaScript basics: variables, functions and events',
        'Publishing with a CMS and basic search engine setup',
      ],
      sw: [
        'Jinsi mtandao na seva za kuandaa zinavyofanya kazi',
        'Muundo wa HTML na mpangilio unaofaa wote',
        'Mtindo wa CSS, muonekano wa kujipimua na simu',
        'Misingi ya JavaScript: vigezo, kazi na matukio',
        'Kuchapisha kwa CMS na kusanidi utafutaji kwa Google',
      ],
    },
    outcome: {
      en: 'You will leave with a live website of your own, not just notes.',
      sw: 'Utatoka na tovuti yako hai inayofanya kazi, si maelezo tu.',
    },
  },
  {
    slug: 'graphic-design',
    icon: 'image',
    weeks: 10,
    level: { en: 'Beginner', sw: 'Anayeanza' },
    title: { en: 'Graphic Design', sw: 'Ubunifu wa Kidijitali' },
    blurb: {
      en: 'Digital design techniques for logos, flyers and consistent branding that makes your work look professional.',
      sw: 'Mbinu za ubunifu wa kidijitali, kutengeneza nembo, vipeperushi na muonekano wa chapa (Branding).',
    },
    modules: {
      en: [
        'Colour, contrast and readable typography',
        'Logo thinking: simple marks that scale down',
        'Flyers, posters and social media graphics',
        'Brand consistency across print and screen',
        'Preparing files correctly for print and for WhatsApp',
      ],
      sw: [
        'Rangi, mwangaza na herufi zinazosomeka',
        'Kufikiri nembo: alama rahisi zinazokua',
        'Vipeperushi, bango na picha za mitandao',
        'Ulandilishaji wa branding kuchapishwa na kwenye skrini',
        'Kupanga mafaili vizuri kwa uchapishaji na WhatsApp',
      ],
    },
    outcome: {
      en: 'You will produce a small brand kit you can reuse for your church, business or group.',
      sw: 'Utatengeneza kifurushi cha branding kinachoweza kutumika tena kwa kanisa, biashara au kundi.',
    },
  },
  {
    slug: 'digital-marketing',
    icon: 'chart',
    weeks: 8,
    level: { en: 'Beginner', sw: 'Anayeanza' },
    title: { en: 'Digital Marketing', sw: 'Uuzaji Mtandaoni' },
    blurb: {
      en: 'Sell products and services online through social media, Google search and simple paid campaigns.',
      sw: 'Kuza bidhaa na huduma mtandaoni kupitia mitandao ya kijamii, utafutaji wa Google na matangazo.',
    },
    modules: {
      en: [
        'Knowing your customer before you advertise',
        'Social media content that people actually finish',
        'Google search: keywords and local listings',
        'Small paid campaigns that fit a real budget',
        'Measuring results and deciding what to stop',
      ],
      sw: [
        'Kujua mteja wako kabla ya kwenyeka',
        'Maudhui ya mitandao ya kijamii ambayo watu wanayimaliza',
        'Utafutaji wa Google: maneno muhimu na orodha za eneo',
        'Kampeni ndogo za malipo inayolingana na bajeti halisi',
        'Kupima matokeo na kuamua kinachositisha',
      ],
    },
    outcome: {
      en: 'You will have run one real campaign and read its results.',
      sw: 'Utafanya kampeni moja halisi na kusoma matokeo yake.',
    },
  },
  {
    slug: 'entrepreneurship',
    icon: 'users',
    weeks: 10,
    level: { en: 'All levels', sw: 'Kwa kila ngazi' },
    title: { en: 'Entrepreneurship', sw: 'Ujasiri wa Biashara' },
    blurb: {
      en: 'How to start and run a project or business for lasting results, from the first idea to the first sale.',
      sw: 'Jifunze jinsi ya kuanzisha na kusimamia mradi au biashara kwa mafanikio endelevu.',
    },
    modules: {
      en: [
        'Finding a real need instead of a nice idea',
        'Simple costing and pricing that covers your costs',
        'Record keeping: what to write down and why',
        'Finding customers and telling them about you',
        'Growing carefully and knowing when to stop',
      ],
      sw: [
        'Kutafuta hitaji halisi badala ya wazo nzuri tu',
        'Kuhesabi bei na vipengele vinavyofunika gharama',
        'Kushika kumbukumbu: kuchandika nini na kwa nini',
        'Kutafuta wateja na kuwajulisha kuhusu biashara',
        'Kukua kwa uangalifu na kujua wakati wa kusimama',
      ],
    },
    outcome: {
      en: 'You will leave with a costed business idea and the records to run it.',
      sw: 'Utatoka na wazo la biashara lenye hesabu na kumbukumbu za kuendesha.',
    },
  },
  {
    slug: 'language-communication',
    icon: 'globe',
    weeks: 6,
    level: { en: 'All levels', sw: 'Kwa kila ngazi' },
    title: { en: 'Language & Communication', sw: 'Lugha na Mawasiliano' },
    blurb: {
      en: 'Improve how clearly you express yourself in professional and community settings.',
      sw: 'Boresha uwezo wa kuwasiliana kwa ufasaha katika mazingira ya kitaalamu na kijamii.',
    },
    modules: {
      en: [
        'Speaking clearly so people listen the first time',
        'Writing emails and letters that get answered',
        'Listening and asking questions that help',
        'Presenting your work to a group without fear',
        'Conflict and difficult conversations handled calmly',
      ],
      sw: [
        'Kusema kwa uwazi ili watu wasikie mara ya kwanza',
        'Kuandika barua pepe na mbarua zinazopokelewa majibu',
        'Kusikiliza na kuuliza maswali yanayosaidia',
        'Kuwasilisha kazi yako mbele ya kundi bila hofu',
        'Kushughulika na migogoro kwa utulivu',
      ],
    },
    outcome: {
      en: 'You will handle meetings, reports and public speaking more calmly.',
      sw: 'Utashughulika kwa utulivu zaidi na mikutano, ripoti na kusema hadhara.',
    },
  },
]

export function courseBySlug(slug) {
  return COURSES.find((c) => c.slug === slug)
}

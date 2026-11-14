/* Noolam — content & photography catalogue.
   All photographs are free-licence images hotlinked from Unsplash (Unsplash License)
   and Pexels (Pexels License). Swap for the client's own shoot before launch. */

const U = (id, w = 1200, h) =>
  `https://images.unsplash.com/${id.startsWith('flagged/') ? id : 'photo-' + id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=72`;
const P = (id, w = 1200, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${h ? `&h=${h}&fit=crop` : ''}`;

window.NOOLAM = {
  hero: [
    { src: U('1518893063132-36e46dbe2428', 2000), alt: 'Close-up of deep red silk in soft folds', pos: '50% 50%' },
    { src: U('1740391767939-ba18f6ee9764', 2000), alt: 'A silk shop front lined with colourful fabrics', pos: '50% 45%' },
    { src: U('1600685890506-593fdf55949b', 2000), alt: 'A bride in red silk and gold jewellery', pos: '50% 30%' },
  ],

  ribbon: ['Pure Zari', 'Handwoven', 'Temple Borders', 'Bridal Silk', 'Korvai Joins', 'Mulberry Yarn', 'Kanchipuram Looms', 'Heirloom Pallus'],

  moods: [
    { name: 'Temple Morning', note: 'Kumkum red, antique zari', src: U('1768341395956-fed92f537228', 700), alt: 'Woman in a red silk saree with traditional gold jewellery' },
    { name: 'Rani Pink', note: 'Pink & marigold, soft gold', src: U('1617627143750-d86bc21e42bb', 700), alt: 'Woman in a pink and orange saree between two trees' },
    { name: 'Peacock Hour', note: 'Violet silk, garden light', src: P(38371877, 700), alt: 'Woman in a purple saree posing in a garden' },
    { name: 'Marigold', note: 'Turmeric yellow, peacock blue', src: U('1706943262454-84ee74854346', 700), alt: 'Woman in a yellow and blue saree' },
    { name: 'Festival Green', note: 'Parrot green, temple gold', src: U('1679006831648-7c9ea12e5807', 700), alt: 'Woman in a green saree with jewellery' },
    { name: 'Old Madras', note: 'Ivory body, kumkum border', src: U('1678705730064-a7ecbab4b3fb', 700), alt: 'Woman in a white and red saree' },
  ],

  jewels: {
    choker:  { name: 'Temple Lakshmi Choker', price: 18400, src: U('1685970731194-e27b477e87ba', 300) },
    beads:   { name: 'Kemp Bead Malai', price: 9600, src: U('1601121141461-9d6647bca1ed', 300) },
    set:     { name: 'Mango Mala & Jhumka Set', price: 22800, src: U('1722410180687-b05b50922362', 300) },
    bangles: { name: 'Gold-tone Kada Pair', price: 6400, src: U('1616756141603-6d37d5cde2a2', 300) },
    chains:  { name: 'Layered Kasu Chains', price: 12900, src: U('1640183297213-863406155597', 300) },
    beads2:  { name: 'Violet Bead Haaram', price: 8800, src: U('1601121141418-c1caa10a2a0b', 300) },
  },

  looks: [
    { id: 'l1', name: 'Blue Mango Bazaar', saree: 'Peacock Blue Korvai Silk', price: 46500, src: U('1610189013429-a703f4b245cf', 900), alt: 'Woman in a blue and yellow silk saree', blouse: 'Mustard Brocade Blouse', jewels: ['set', 'bangles'] },
    { id: 'l2', name: 'Kumkum & Ivory', saree: 'Ivory Tissue with Kumkum Border', price: 38900, src: U('1619516388835-2b60acc4049e', 900), alt: 'Woman in a red and white saree near trees', blouse: 'Red Elbow-sleeve Blouse', jewels: ['choker', 'chains'] },
    { id: 'l3', name: 'Sindoor Wall', saree: 'Sindoor Red Pattu', price: 52400, src: U('1609748341932-f0206c09412b', 900), alt: 'Woman in a red and yellow saree beside a red wall', blouse: 'Haldi Silk Blouse', jewels: ['choker', 'bangles'] },
    { id: 'l4', name: 'Midnight Rani', saree: 'Midnight Blue & Rani Pink Silk', price: 49800, src: U('1609748513078-9ff6232781c5', 900), alt: 'Woman in a blue and red saree', blouse: 'Rani Pink Zari Blouse', jewels: ['beads', 'chains'] },
    { id: 'l5', name: 'Purple Gopuram', saree: 'Aubergine Gopuram-border Silk', price: 57200, src: U('1641699862936-be9f49b1c38d', 900), alt: 'Woman in a purple and gold saree', blouse: 'Antique Gold Blouse', jewels: ['beads2', 'set'] },
    { id: 'l6', name: 'Marigold Reach', saree: 'Marigold Butta Soft Silk', price: 31600, src: U('1769275061202-cf3ef67d7279', 900), alt: 'Woman in a colourful saree reaching for yellow flowers', blouse: 'Leaf Green Blouse', jewels: ['beads', 'bangles'] },
  ],

  picks: [
    { name: 'Palace Check', color: '#1d4ed8', ink: '#ffe066', src: U('1610189012906-4c0aa9b9781e', 700), alt: 'Woman in a blue and yellow checked saree', price: 41200, weave: 'Kattam checks, Kanchi silk' },
    { name: 'Kanchi Rani', color: '#d61f3c', ink: '#ffd1dc', src: U('1646979200020-941e1deb2670', 700), alt: 'Woman in a red silk saree', price: 54800, weave: 'Contrast korvai border' },
    { name: 'Bengal Garden', color: '#e9b10c', ink: '#5a1408', src: U('1769275061721-bb6439d24ebc', 700), alt: 'Young woman in a patterned saree outdoors', price: 28600, weave: 'Floral butta, soft silk' },
    { name: 'Magenta Shot', color: '#b5179e', ink: '#ffe3f6', src: U('1692992193981-d3d92fabd9cb', 700), alt: 'Woman in a colourful silk saree', price: 36400, weave: 'Two-tone shot weave' },
    { name: 'Benares Gold', color: '#c8901a', ink: '#3b0a0a', src: U('1610047614256-023d7c028d0b', 700), alt: 'Woman in a red and gold saree on a wooden armchair', price: 62900, weave: 'Kadhua brocade, gold zari' },
    { name: 'Koorai Check', color: '#13803f', ink: '#fff0b3', src: U('flagged/photo-1551854716-8b811be39e7e', 700), alt: 'Woman in a green, gold and red saree smiling', price: 47500, weave: 'Wedding koorai checks' },
  ],

  rackCats: ['Kanchi Silk', 'Soft Silk', 'Checks & Korvai', 'Zari & Brocade', 'Tissue & Ivory'],
  rack: [
    { name: 'Peacock Teal Pattu', cat: 'Kanchi Silk', price: 44800, src: U('1676696706907-0e04665b80bd', 500), border: '#c79a2c' },
    { name: 'Lotus Pink Soft Silk', cat: 'Soft Silk', price: 26400, src: U('1617055407123-3d7130c1f940', 500), border: '#d4af37' },
    { name: 'Kumkum Red Pattu', cat: 'Kanchi Silk', price: 51200, src: U('1612744192242-35cd7a7d35e6', 500), border: '#1d6b3a' },
    { name: 'Madras Kattam', cat: 'Checks & Korvai', price: 33900, src: U('1588140686379-1b76a52103dc', 500), border: '#a3172f' },
    { name: 'Ivory Tissue', cat: 'Tissue & Ivory', price: 29800, src: U('1619043518800-7f14be467dca', 500), border: '#c79a2c' },
    { name: 'Rose Dusk Soft Silk', cat: 'Soft Silk', price: 24600, src: U('1620763050148-af058ab2fff0', 500), border: '#7a1030' },
    { name: 'Embroidered Panel Silk', cat: 'Zari & Brocade', price: 58600, src: U('1787220272461-2c53528c9349', 500), border: '#c79a2c' },
    { name: 'Cream Satin Pattu', cat: 'Tissue & Ivory', price: 31500, src: U('1606259457945-67dc66271ee6', 500), border: '#a3172f' },
    { name: 'Gold Lace Brocade', cat: 'Zari & Brocade', price: 64900, src: U('1787554497632-1727c23e58cb', 500), border: '#5a1408' },
    { name: 'Sienna Korvai', cat: 'Checks & Korvai', price: 39700, src: U('1610030469839-f909584b43f1', 500), border: '#d4af37', pos: '50% 62%' },
    { name: 'Sari-Sutra Rose', cat: 'Kanchi Silk', price: 42300, src: U('1727430228383-aa1fb59db8bf', 500), border: '#c79a2c', pos: '50% 60%' },
    { name: 'Rust & Gold Heirloom', cat: 'Zari & Brocade', price: 71500, src: U('1610030469983-98e550d6193c', 500), border: '#1d6b3a', pos: '50% 62%' },
  ],

  muse: {
    center: { src: P(36194199, 1400), alt: 'Woman in an elegant saree by a sunlit window' },
    left: [
      { src: P(36194198, 600), alt: 'Woman in a colourful saree in a lush garden' },
      { src: U('1610189026205-27510cfc52f8', 600), alt: 'Three women in purple and pink saris' },
    ],
    right: [
      { src: P(36194197, 600), alt: 'Woman in a green saree by a vintage wardrobe' },
      { src: U('1792659804038-6da9d8385a60', 600), alt: 'Woman in a red sari and veil on temple steps' },
      { src: U('1790092038252-87c70ee332ec', 600), alt: 'Woman in a black and gold sari holding a lantern' },
    ],
    notes: [
      { k: 'Ten silks.', v: 'Ten muses. One drape each, worn the way they wear it.' },
      { k: 'Every thread', v: 'an offering — dyed, twisted and warped by hand.' },
      { k: 'Woven by hand.', v: 'Each pallu takes a weaver pair between ten and twenty days.' },
    ],
  },

  bridal: [
    { name: 'Sindoor Pattu Vaasal', price: 128000, src: U('1610173827043-9db50e0d8ef9', 700), alt: 'Bride in red with intricate gold jewellery and henna' },
    { name: 'Muhurtham Gold', price: 146500, src: U('1610047614301-13c63f00c032', 700), alt: 'Woman in a red and gold saree' },
    { name: 'Rani Haldi Bridal', price: 98400, src: P(36497431, 700), alt: 'Woman in a pink sari with bridal jewellery' },
    { name: 'Kalyanam Red', price: 134900, src: U('1684868268327-7e5590bcfbd6', 700), alt: 'Woman in a red and gold bridal outfit' },
    { name: 'Thali Morning', price: 112000, src: P(10336674, 700), alt: 'Smiling bride in a saree and gold jewellery' },
    { name: 'Kemp & Kumkum', price: 121300, src: U('1654764746225-e63f5e90facd', 700), alt: 'Woman in a red and gold bridal outfit' },
    { name: 'Mallipoo Evening', price: 89600, src: U('1631549424057-403e75d68e2f', 700), alt: 'Woman in red with a flower in her hair' },
    { name: 'Vel Border Bridal', price: 139800, src: U('1677691257001-8bfd91e288ff', 700), alt: 'Woman in a red and gold bridal outfit' },
    { name: 'Second-Day Rose', price: 76200, src: U('1677691257363-eebd2abeafec', 700), alt: 'Woman in a red bridal outfit' },
  ],

  reels: [
    { title: 'Old-city lanes', cap: 'Kumkum cotton-silk, worn to market', dur: '0:18', src: P(8157122, 900), alt: 'Woman in a traditional saree outdoors in Kolkata' },
    { title: 'Lamp room, Kanchipuram', cap: 'Midnight silk under brass lamps', dur: '0:24', src: U('1790091913697-88baf34b09ca', 900), alt: 'Woman with a bindi in a dark sari and jewellery' },
    { title: 'Red at dusk', cap: 'Sindoor pattu at the last light', dur: '0:31', src: P(8157118, 900), alt: 'Woman in a red saree at sunset' },
    { title: 'Courtyard light', cap: 'Soft silk, four o’clock shadows', dur: '0:15', src: P(8157119, 900), alt: 'Woman in a traditional saree posing outdoors' },
    { title: 'Before the ceremony', cap: 'Temple border, ready for the vows', dur: '0:22', src: P(10336676, 900), alt: 'Woman in a traditional saree with intricate jewellery' },
    { title: 'Quiet hour', cap: 'Red korvai, a still afternoon', dur: '0:19', src: P(8157120, 900), alt: 'Pensive woman in red traditional attire' },
    { title: 'Monsoon green', cap: 'Parrot green on a rainy day', dur: '0:27', src: P(36194194, 900), alt: 'Woman in a traditional sari seated indoors' },
  ],

  weave: [
    { name: 'Peacock Teal', price: 14800, src: U('1676696706907-0e04665b80bd', 700), color: '#127a7a' },
    { name: 'Kumkum Red', price: 16200, src: U('1612744192242-35cd7a7d35e6', 700), color: '#b3122e' },
    { name: 'Lotus Pink', price: 12900, src: U('1617055407123-3d7130c1f940', 700), color: '#e46aa0' },
    { name: 'Madras Kattam', price: 13700, src: U('1588140686379-1b76a52103dc', 700), color: '#c43a3a' },
    { name: 'Ivory Tissue', price: 11800, src: U('1619043518800-7f14be467dca', 700), color: '#efe6d6' },
    { name: 'Embroidered Panel', price: 18900, src: U('1787220272461-2c53528c9349', 700), color: '#7c4dbd' },
    { name: 'Rose Dusk', price: 12400, src: U('1620763050148-af058ab2fff0', 700), color: '#d98a9e' },
    { name: 'Gold Lace', price: 19600, src: U('1787554497632-1727c23e58cb', 700), color: '#c79a2c' },
  ],

  atelier: [
    { src: U('1640292343595-889db1c8262e', 1100), alt: 'A weaver working at a handloom' },
    { src: P(9164687, 800), alt: 'Portrait of a woman in vibrant traditional attire and jewellery' },
  ],

  notes: [
    { q: 'I came in for one saree for my sister’s muhurtham and left with three. They let me sit with the pallus for an hour without once rushing me.', who: 'Sample patron · Chennai' },
    { q: 'The blouse was stitched in eleven days and fit at the first trial. The zari border on the Kumkum Red is even better in daylight.', who: 'Sample patron · Bengaluru' },
    { q: 'Ordered from abroad over a video call. They held each saree up to the window so I could see the real colour.', who: 'Sample patron · Singapore' },
  ],

  faq: [
    { q: 'Is every saree handwoven in Kanchipuram?', a: 'Our Kanchi Silk, Checks & Korvai and Bridal edits are woven on pit looms by partner weaver families. Soft Silk pieces are woven on handlooms in nearby clusters and labelled as such on each tag.' },
    { q: 'How can I tell pure zari from tested zari?', a: 'Each piece lists its zari type. Pure zari uses silver thread electroplated with gold; tested zari uses copper. Ask in store and we will show you the burn and scrape test on a swatch.' },
    { q: 'Do you stitch blouses?', a: 'Yes. Book a measurement slot in store or send your measurements online. Standard stitching takes 10–14 days; bridal blouses with aari work take three to four weeks.' },
    { q: 'Can I see a saree on a video call before ordering?', a: 'Book a 20-minute video appointment and a stylist will show you the drape, the border and the pallu in natural light.' },
    { q: 'How do I care for a silk saree?', a: 'Dry clean only, store wrapped in muslin, and refold along new lines every few months so the zari does not crack along the creases.' },
  ],
};

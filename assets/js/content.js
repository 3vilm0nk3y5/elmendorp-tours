/*
  Everything you are likely to change lives in this file: the films, the words, the ten places and the contact details.

  The page opens with three full-screen chapters. Scrolling down moves from one to the next.
  Each chapter plays one looping video: "wide" on laptops and landscape screens, "tall" on phones held upright.
  To use your own footage, drop an MP4 into assets/media/ and point the path here (H.264, 1920x1080 / 1080x1920).
  "beats" are headlines that change while a chapter's video plays: "at" is the second in the video where it switches.
*/
window.SITE = {
  name: 'Elmendorp Tours & Travel',
  whatsapp: '',            // international format without "+", e.g. '254712345678'. Leave empty to hide the WhatsApp buttons.
  email: '',               // e.g. 'bookings@example.com'. Shown in the booking section and used when there is no WhatsApp number.
  phone: '',               // e.g. '+254 712 345 678'. Shown in the booking section.
  base: 'Nairobi, Kenya',  // where trips start from

  chapters: [
    {
      id: 'safari',
      label: 'Safari',
      eyebrow: 'Maasai Mara · Game drives',
      coord: '1°30′S 35°08′E',
      where: 'Narok County',
      cta: 'See safaris',
      accent: '#f2b134',
      video: {
        wide: 'assets/media/safari-wide.mp4',
        tall: 'assets/media/safari-tall.mp4',
        posterWide: 'assets/media/safari-wide.jpg',
        posterTall: 'assets/media/safari-tall.jpg'
      },
      beats: [
        { at: 0, title: ['Travel', 'in style'], text: 'Game drives in a Toyota Land Cruiser with a pop-up roof, so every seat gets a clear view of the plains.' },
        { at: 5.6, title: ['Or by', 'party bus'], text: 'The nganya is a Nairobi matatu with hand-painted murals, LED lights and a sound system made for the long road.' }
      ]
    },
    {
      id: 'maasai',
      label: 'Maasai',
      eyebrow: 'Maasai village · Culture',
      coord: '1°26′S 35°12′E',
      where: 'Talek, Narok County',
      cta: 'See culture trips',
      accent: '#d23a22',
      video: {
        wide: 'assets/media/maasai-wide.mp4',
        tall: 'assets/media/maasai-tall.mp4',
        posterWide: 'assets/media/maasai-wide.jpg',
        posterTall: 'assets/media/maasai-tall.jpg'
      },
      beats: [
        { at: 0, title: ['Meet the', 'Maasai'], text: 'Spend an afternoon in a manyatta, see how the beadwork is made and watch the adumu, the warriors’ jumping dance.' }
      ]
    },
    {
      id: 'coast',
      label: 'Coast',
      eyebrow: 'Malindi & Mombasa · Coast',
      coord: '3°13′S 40°07′E',
      where: 'Kilifi County',
      cta: 'See coast trips',
      accent: '#2fd0c8',
      video: {
        wide: 'assets/media/coast-wide.mp4',
        tall: 'assets/media/coast-tall.mp4',
        posterWide: 'assets/media/coast-wide.jpg',
        posterTall: 'assets/media/coast-tall.jpg'
      },
      beats: [
        { at: 0, title: ['End at', 'the ocean'], text: 'Glass-bottom boats over Malindi’s reef, a dhow at sunset, then the old town and Fort Jesus in Mombasa.' },
        { at: 3.4, title: ['And much', 'more'], text: 'Amboseli, Lake Naivasha, Diani, Lamu and Nairobi day trips. Scroll on for every tour we run.' }
      ]
    }
  ],

  // The ten places in the tour list, in order. Each tile shows the picture, the name, one line and the length.
  // A tap on a tile opens the booking form with that place filled in. Pictures are in assets/img/places/ (4:3).
  places: [
    { id: 'mara', title: 'Maasai Mara', length: '3 days', img: 'assets/img/places/mara.jpg',
      text: 'Big cats, the river crossings and a dawn balloon flight.' },
    { id: 'amboseli', title: 'Amboseli', length: '2–3 days', img: 'assets/img/places/amboseli.jpg',
      text: 'Elephant herds under the snows of Kilimanjaro.' },
    { id: 'nakuru', title: 'Nakuru & Naivasha', length: '2 days', img: 'assets/img/places/nakuru.jpg',
      text: "Flamingos, rhinos, a hippo boat ride and cycling Hell's Gate." },
    { id: 'tsavo', title: 'Tsavo East & West', length: '3 days', img: 'assets/img/places/tsavo.jpg',
      text: 'Red-dust elephants, lava flows and Mzima Springs.' },
    { id: 'nairobi', title: 'Nairobi', length: '1 day', img: 'assets/img/places/nairobi.jpg',
      text: 'Giraffes, baby elephants and a national park beside the city.' },
    { id: 'manyatta', title: 'Maasai village', length: 'Half day', img: 'assets/img/places/manyatta.jpg',
      text: 'Beadwork, stories and the jumping dance in a manyatta.' },
    { id: 'mtkenya', title: 'Mount Kenya', length: '4 days', img: 'assets/img/places/mtkenya.jpg',
      text: 'A trek to Point Lenana, 4,985 m above the sea.' },
    { id: 'diani', title: 'Diani & Wasini', length: '3 days', img: 'assets/img/places/diani.jpg',
      text: 'White sand, dolphins and snorkelling at Kisite.' },
    { id: 'malindi', title: 'Malindi & Watamu', length: '3 days', img: 'assets/img/places/malindi.jpg',
      text: 'The reef, sea turtles and a lagoon of every blue.' },
    { id: 'lamu', title: 'Lamu & Mombasa', length: '2–3 days', img: 'assets/img/places/lamu.jpg',
      text: 'Swahili old towns, Fort Jesus and a dhow at sunset.' }
  ],

  // Extra choices at the end of the booking form's trip list
  rides: ['Ride hire: Land Cruiser or party bus', 'Airport or train transfer']
};

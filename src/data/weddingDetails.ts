export interface SponsorPair {
  lady: string;
  gentleman: string;
}

export interface EntouragePair {
  brideSide: string;
  groomSide: string;
}

export const WEDDING_DETAILS = {
  title: "You are invited to the wedding of",
  names: "Jhon Chineth & Sam Ashly",
  dateText: "Saturday, July 18, 2026",
  timeText: "3:00 PM START",
  locationText: "CATHEDRAL CHURCH",
  receptionText: "TAVERN HOTEL, EMERALD HALL",
  countdownDate: "2026-07-18T15:00:00", // Full date time for countdown target
  
  palette: {
    blue: {
      hex: "#C5D9EC",
      name: "Powder Blue"
    },
    pink: {
      hex: "#FFD1DB",
      name: "Baby Pink"
    }
  },

  dressCode: {
    rule: "Strictly no wearing white dress",
    attire: "Any Formal Attire"
  },

  parents: {
    bride: ["MELANIE TUGAY", "ANTERO TUGAY"],
    groom: ["ANNIE NACUSPAG", "RUSTICO NACUSPAG"]
  },

  maidOfHonor: "CHRISTINE JEAN NACUSPAG",
  bestMan: "BOSS BRIX TUGAY",

  sponsors: [
    { lady: "JUDGE. MAUREEN CHUA", gentleman: "HON. EARL CHUA" },
    { lady: "DR. GRACE ADELETTE CASIÑO", gentleman: "ENGR. HARRY RUSSEL COTANDA" },
    { lady: "MERLIN ELUDO", gentleman: "HON. ALEXIS BORJA TUGAY" },
    { lady: "JULIET LONGOS", gentleman: "HON. MARC ADELSON LONGOS" },
    { lady: "ESMERALDA SENDIONG", gentleman: "REYNALDO SENDIONG" },
    { lady: "MARY ROSE IBARRA", gentleman: "HON. RICHARD JAPAY" },
    { lady: "NECITAS ALDONZA MALACURA", gentleman: "ENGR. EMANNUEL SUNGA" },
    { lady: "MILDRED MACHECA", gentleman: "PEMS CHARLOU MACHECA" },
    { lady: "CORAZON PACO", gentleman: "HON. EDITO PACO" },
    { lady: "ANASTACIA YISMONTE", gentleman: "HON. JAY LONGOS" },
    { lady: "SHARON TRESIANA", gentleman: "HON. JONATHAN TRESIANA" },
    { lady: "HON. LAILANIE JAPAY", gentleman: "RANDEL JAPAY" },
    { lady: "CHARISMA LONGOS", gentleman: "MICHAEL LONGOS" },
    { lady: "CHERRYFEL MALATA", gentleman: "JULIUS MALATA" },
    { lady: "ALVIE VELEZ", gentleman: "ALLAN VELEZ" },
    { lady: "LUZMAR ESCUYOS", gentleman: "WENDELL PEDRERA" },
    { lady: "MA. GLENDA GUMA", gentleman: "PEDRO GUMA" },
    { lady: "CARIDAD BAYNOSA", gentleman: "RAMIL BAYNOSA" },
    { lady: "ANNALISSA PEGORO", gentleman: "JOVITO PEGORO" },
    { lady: "SHAHANI MALACURA", gentleman: "RENE MALACURA" },
    { lady: "MARYBEL TUGAY", gentleman: "ANDREW TUGAY" },
    { lady: "LUCITA MENIL", gentleman: "PHILBERT MENIL" },
    { lady: "MARY ANN JAZON", gentleman: "JESSIE JAZON" },
    { lady: "MALOU MENIL", gentleman: "GORDON ROGADOR" },
    { lady: "MARIVIC PENIRO", gentleman: "RUTGER MENIL" },
    { lady: "YOLLIE LEROG", gentleman: "JAMES LEROG" },
    { lady: "JERILYN LIGAD", gentleman: "JESIE LIGAD" },
    { lady: "LINA NITA PETALLO", gentleman: "RITO PETALLO" },
    { lady: "LIEZL FITZPATRICK", gentleman: "JOSE TUGAY" },
    { lady: "JENILYN TUGAY", gentleman: "PROCEN TUGAY" },
    { lady: "JEAN MENIL", gentleman: "DENNIS BAKER" },
    { lady: "GLENDA LAEDA MENIL", gentleman: "JEREMY BAKER" },
    { lady: "CRISTY MABINI", gentleman: "ROLDAN CAGMAT" },
    { lady: "JINKY CAGMAT", gentleman: "MAYNARD CAGMAT" },
    { lady: "MARGIE GUILLEMER", gentleman: "EMELITO CONSIGNA" },
    { lady: "CECILE DUMAGAN", gentleman: "NILO LINAGA" },
    { lady: "MARY ANN NACUSPAG", gentleman: "JOSE NACUSPAG SR." },
    { lady: "DAISY GILLO", gentleman: "HENRITO CONSIGNA" },
    { lady: "AMELIA FLORES", gentleman: "ESLIE FLORES" },
    { lady: "LEIZEL VIRTUDAZO", gentleman: "LEO MORA" },
    { lady: "LEA MANASAN", gentleman: "FRATERNO CATURLA" },
    { lady: "MERCY BAGUINAON", gentleman: "DOMINGO CONJURADO" },
    { lady: "MARITES TUGAY", gentleman: "RINO TUGAY" },
    { lady: "SUFENIA CHUA", gentleman: "PETER PAUL EVARDONE" }
  ] as SponsorPair[],

  bridesmaidsGroomsmen: [
    { brideSide: "ALTHEA JEAN NACUSPAG", groomSide: "RAID KNLY TUGAY" },
    { brideSide: "RHEALYN CAGMAT", groomSide: "RUBEN AL TUGAY" },
    { brideSide: "KEZAHIA NICOLE BAYNOSA", groomSide: "IVAN GERALDINO" },
    { brideSide: "MYLA ELLA BAYNOSA", groomSide: "JAZNIL JAZON" },
    { brideSide: "CHLOE JAMAINE TUGAY", groomSide: "JHON FRANCIS EMFIMO" },
    { brideSide: "CARESS ALPHA MAE PEGORO", groomSide: "REYMARK JAMISOLA" },
    { brideSide: "SICILY UYGIOCO", groomSide: "HONEY JOEY LIPAO" },
    { brideSide: "PRETTY PAM TUGAY", groomSide: "ROY HANS ALBURO" },
    { brideSide: "NESSY LEIGH RENE MALACURA", groomSide: "MISSY CAMELLE BAYNOSA" },
    { brideSide: "CARMELLE MENIL", groomSide: "JHON KYLE PEGORO" },
    { brideSide: "SHENA MENIL", groomSide: "JOVITO PAULO TUGAY" },
    { brideSide: "SHIELA MAE SEBIAL", groomSide: "ROLDAN ADAMS CAGMAT" },
    { brideSide: "MARIEL JAPAY", groomSide: "JOHN PAUL CANTILLAS" },
    { brideSide: "REGINE PETALLO", groomSide: "JOEY LAURENCE BELLENARIO" },
    { brideSide: "ABIGAIL ALNAE BORJA", groomSide: "DANN JAYLORD TUGAY" },
    { brideSide: "MARRIETONIE CASAS", groomSide: "RICH JOHN CASAS" },
    { brideSide: "JUDYBELLE GUILLEMER", groomSide: "MARC ANTHONY GUILLEMER" },
    { brideSide: "ELAINE DALAPO", groomSide: "JEROME MORGA" }
  ] as EntouragePair[],

  specialSponsors: {
    cord: ["MARRIETONIE CASAS", "RICH JOHN CASAS"],
    veil: ["JUDYBELLE GUILLEMER", "MARC ANTHONY GUILLEMER"],
    candle: ["DYNAH MARIE GUILLEMER", "JOSHUA SECILLANO"]
  },

  bearers: {
    ring: "JERELAND NACUSPAG",
    coin: "NASH KENZO CASAS",
    bible: "JOHN CHRISTOFF NACUSPAG",
    littleBride: "ANAYAH LOIS ESPEJON",
    littleGroom: "LUCAS GIGAYON"
  },

  flowerGirls: [
    "ZIA KATE NERVAR",
    "CASSY JAPAY",
    "SOFIA JAPAY",
    "FREYA GUILLEMER",
    "ISLA AMARI CURADA",
    "HANNAH FATE CAGMAT"
  ],

  signBearers: {
    bride: ["ANDRIUS MENIL", "XIME ADAM MENIL", "JAN GORDON MENIL"],
    groom: ["KHENTTON ZANE BRAMWEL"]
  },

  // Premium direct imgur links (using direct file serving i.imgur.com/*.jpg)
  photos: [
    "https://i.imgur.com/vtIRanw.jpg",
    "https://i.imgur.com/7fXLxBb.jpg",
    "https://i.imgur.com/qHMBAqT.jpg",
    "https://i.imgur.com/LNW0UDY.jpg",
    "https://i.imgur.com/hM0sYbX.jpg",
    "https://i.imgur.com/qjnPL3v.jpg",
    "https://i.imgur.com/YIOX6BG.jpg",
    "https://i.imgur.com/rcnAicj.jpg",
    "https://i.imgur.com/cLhcw4b.jpg",
    "https://i.imgur.com/s7INdhJ.jpg",
    "https://i.imgur.com/AS9GD9y.jpg",
    "https://i.imgur.com/CGWAUc7.jpg",
    "https://i.imgur.com/WlqQNrb.jpg",
    "https://i.imgur.com/GY5plbD.jpg",
    "https://i.imgur.com/7VtSXLd.jpg",
    "https://i.imgur.com/l4noPOs.jpg",
    "https://i.imgur.com/KYR5fUb.jpg",
    "https://i.imgur.com/Kl2iIwN.jpg"
  ]
};

/**
 * Audi Dream Garage & Models showcase for Phathu & Lihle.
 * Both are passionate Audi enthusiasts!
 */

export interface AudiModel {
  id: string;
  name: string;
  badge: string;
  category: 'Supercar' | 'Sportback & Wagon' | 'Performance SUV' | 'Electric GT' | 'Pocket Rocket';
  tagline: string;
  horsepower: string;
  accel: string; // 0-100 km/h
  topSpeed: string;
  engine: string;
  drivetrain: string;
  soundDescription: string;
  heroImage: string;
  galleryImages: string[];
  videoUrl?: string; // YouTube embed
  romanticRoadTrip: string;
}

export const AUDI_MODELS: AudiModel[] = [
  {
    id: 'audi-rs6-avant',
    name: 'Audi RS6 Avant Performance',
    badge: 'RS6',
    category: 'Sportback & Wagon',
    tagline: 'The ultimate dream estate — devastating speed with unrivaled elegance.',
    horsepower: '621 hp',
    accel: '3.4s',
    topSpeed: '305 km/h',
    engine: '4.0L Twin-Turbo V8',
    drivetrain: 'quattro with Sport Differential',
    soundDescription: 'Deep throaty V8 twin-turbo rumble with crackles on downshifts',
    heroImage: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop',
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/PjE5uL53258',
    romanticRoadTrip: 'Saxs & Snowpie driving the Mpumalanga Panorama Route & God’s Window with the windows down and music blasting.',
  },
  {
    id: 'audi-rs7-sportback',
    name: 'Audi RS7 Sportback Performance',
    badge: 'RS7',
    category: 'Sportback & Wagon',
    tagline: 'Sculpted muscular lines meeting pure grand touring majesty.',
    horsepower: '621 hp',
    accel: '3.3s',
    topSpeed: '305 km/h',
    engine: '4.0L Bi-Turbo TFSI V8',
    drivetrain: 'quattro permanent all-wheel drive',
    soundDescription: 'Aggressive baritone V8 exhaust note roaring down the highway',
    heroImage: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1200&auto=format&fit=crop',
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/a3b1g1k3R98',
    romanticRoadTrip: 'Late night highway cruises around Sandton under city lights after a romantic candlelit dinner.',
  },
  {
    id: 'audi-r8-v10',
    name: 'Audi R8 V10 Performance',
    badge: 'R8 V10',
    category: 'Supercar',
    tagline: 'Naturally aspirated 10-cylinder symphony. Pure motorsport DNA for the road.',
    horsepower: '602 hp',
    accel: '3.1s',
    topSpeed: '331 km/h',
    engine: '5.2L Naturally Aspirated FSI V10',
    drivetrain: 'quattro all-wheel drive',
    soundDescription: 'High-revving 8,700 RPM V10 scream that gives you chills every single time',
    heroImage: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/5D3vL9lKk7I',
    romanticRoadTrip: 'Cruising Chapman’s Peak Drive in Cape Town at sunset with the ocean beside us.',
  },
  {
    id: 'audi-rs-etron-gt',
    name: 'Audi RS e-tron GT',
    badge: 'RS e-tron',
    category: 'Electric GT',
    tagline: 'Instant electric torque wrapped in breathtaking aerodynamic sculpture.',
    horsepower: '637 hp (Boost)',
    accel: '3.1s',
    topSpeed: '250 km/h',
    engine: 'Dual Permanent-Magnet Electric Motors (93.4 kWh battery)',
    drivetrain: 'Electric quattro all-wheel drive',
    soundDescription: 'Futuristic synthetic e-sound synthesizer with instant G-force acceleration',
    heroImage: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200&auto=format&fit=crop',
    ],
    romanticRoadTrip: 'Whisper-quiet stargazing drive out in the countryside with the panoramic glass roof.',
  },
  {
    id: 'audi-rsq8',
    name: 'Audi RS Q8',
    badge: 'RSQ8',
    category: 'Performance SUV',
    tagline: 'The Nürburgring-conquering super SUV with unmatched presence and luxury.',
    horsepower: '591 hp',
    accel: '3.7s',
    topSpeed: '305 km/h',
    engine: '4.0L Bi-Turbo Mild-Hybrid V8',
    drivetrain: 'quattro with Active Roll Stabilization',
    soundDescription: 'Thunderous bass exhaust with immense low-end torque pull',
    heroImage: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop',
    ],
    romanticRoadTrip: 'Luxury weekend escape to a secluded safari lodge in Kruger with all luggage packed in style.',
  },
  {
    id: 'audi-rs3-sportback',
    name: 'Audi RS3 Sportback',
    badge: 'RS3',
    category: 'Pocket Rocket',
    tagline: 'The iconic 1-2-4-5-3 firing order 5-cylinder with RS Torque Splitter drift mode.',
    horsepower: '401 hp',
    accel: '3.6s',
    topSpeed: '290 km/h',
    engine: '2.5L Turbocharged Inline-5',
    drivetrain: 'quattro with RS Torque Splitter',
    soundDescription: 'Legendary raspy 5-cylinder warble with rapid dual-clutch pop shifts',
    heroImage: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200&auto=format&fit=crop',
    ],
    romanticRoadTrip: 'Fun, nimble weekend mountain pass runs along Drakensberg roads.',
  },
  {
    id: 'audi-ttrs',
    name: 'Audi TT RS Coupe',
    badge: 'TT RS',
    category: 'Pocket Rocket',
    tagline: 'Agile, wide, and aggressive sports car with iconic five-cylinder power.',
    horsepower: '394 hp',
    accel: '3.6s',
    topSpeed: '280 km/h',
    engine: '2.5L TFSI Turbo Inline-5',
    drivetrain: 'quattro all-wheel drive',
    soundDescription: 'Distinctive 5-cylinder Group B rally heritage acoustic roar',
    heroImage: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200&auto=format&fit=crop',
    ],
    romanticRoadTrip: 'Scenic sunset drives with the active rear spoiler deployed.',
  },
];

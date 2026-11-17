export const CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
] as const;

export const CITY_NONE = 'none';

const CITY_ALIASES: Record<string, (typeof CITIES)[number]> = {
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  hyderabad: 'Hyderabad',
  madras: 'Chennai',
  chennai: 'Chennai',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  pune: 'Pune',
  ahmedabad: 'Ahmedabad',
  jaipur: 'Jaipur',
  cochin: 'Kochi',
  kochi: 'Kochi',
};

export type CityName = (typeof CITIES)[number];
export type CityValue = CityName | typeof CITY_NONE;

export function matchCity(value: string | null): CityValue {
  if (!value) return CITY_NONE;
  const exact = CITY_ALIASES[value.trim().toLowerCase()];
  if (exact) return exact;

  const aliases = Object.keys(CITY_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const pattern = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(value)) return CITY_ALIASES[alias];
  }
  return CITY_NONE;
}

export type ExtractedStudent = {
  studentName: string | null;
  address: string | null;
  course: string | null;
  section: string | null;
  grade: string | null;
  city: CityValue;
};

export const STUDENT_FIELDS = [
  'studentName',
  'address',
  'course',
  'section',
  'grade',
] as const;

export const STUDENT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [...STUDENT_FIELDS, 'city'],
  properties: {
    studentName: {
      type: ['string', 'null'],
      description: "Student's full name as printed on the document.",
    },
    address: {
      type: ['string', 'null'],
      description: 'Postal or home address as printed on the document.',
    },
    course: {
      type: ['string', 'null'],
      description: 'Course, program, or subject name.',
    },
    section: {
      type: ['string', 'null'],
      description: 'Section, division, or batch.',
    },
    grade: {
      type: ['string', 'null'],
      description: 'Grade, class, year, or letter grade shown on the document.',
    },
    city: {
      type: ['string', 'null'],
      description:
        'City printed on the document. Prefer Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, or Kochi. Use null when no city is printed.',
    },
  },
};

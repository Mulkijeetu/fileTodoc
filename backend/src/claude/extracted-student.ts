export type ExtractedStudent = {
  studentName: string | null;
  address: string | null;
  course: string | null;
  section: string | null;
  grade: string | null;
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
  required: [...STUDENT_FIELDS],
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
  },
};

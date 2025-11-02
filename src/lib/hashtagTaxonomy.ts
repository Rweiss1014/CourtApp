export type HashtagCategory = {
  name: string;
  tags: string[];
};

export const DEFAULT_TAXONOMY: HashtagCategory[] = [
  {
    name: 'Abuse & Coercion',
    tags: ['PhysicalAbuse', 'Harassment', 'Threats', 'FinancialControl', 'DigitalAbuse', 'Stalking'],
  },
  {
    name: 'Co-Parenting',
    tags: ['MissedVisitation', 'LateDropoff', 'SchoolContactBlocked', 'MedicalNonCooperation'],
  },
  {
    name: 'Medical',
    tags: ['MedicalNeglect', 'RecordRefusal', 'MedsWithheld', 'ProviderConflict'],
  },
  {
    name: 'Communication',
    tags: ['NoResponse', 'RefusalToCoordinate', 'AbusiveLanguage'],
  },
  {
    name: 'Safety',
    tags: ['PropertyDamage', 'PoliceReport', 'RestrainingOrder'],
  },
  {
    name: 'Evidence Type',
    tags: ['Texts', 'Email', 'Voicemail', 'Photo', 'MedicalRecord', 'SchoolNote'],
  },
];

export function getAllTags(taxonomy: HashtagCategory[]): string[] {
  return taxonomy.flatMap(cat => cat.tags);
}

export function getTagGlossary(taxonomy: HashtagCategory[]): Record<string, string> {
  const glossary: Record<string, string> = {};
  taxonomy.forEach(category => {
    category.tags.forEach(tag => {
      glossary[tag] = category.name;
    });
  });
  return glossary;
}

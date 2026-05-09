import { Employee } from './orgChartData';
import { generateDevelopmentData } from './developmentData';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += ch;
    }
    values.push(current.trim());

    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] ?? '';
      return obj;
    }, {} as Record<string, string>);
  });
}

const CAP_COLS = [
  '[CAPABILITY] Analytical Thinking',
  '[CAPABILITY] Collaboration',
  '[CAPABILITY] Decision Making',
  '[CAPABILITY] Developing Others',
  '[CAPABILITY] Influencing',
  '[CAPABILITY] Integrity',
  '[CAPABILITY] Leadership',
  '[CAPABILITY] Planning',
  '[CAPABILITY] Relationship Building',
  '[CAPABILITY] Strategic Thinking',
];

const CAP_NAMES = [
  'Analytical Thinking', 'Collaboration', 'Decision Making', 'Developing Others',
  'Influencing', 'Integrity', 'Leadership', 'Planning', 'Relationship Building', 'Strategic Thinking',
];

export async function loadEmployeesFromCSV(path = '/data/TDP-Vismap-112-Merged.csv'): Promise<Employee[]> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load CSV: ${response.statusText}`);

  const rows = parseCSV(await response.text());

  // Rank employees by Score descending (rank 1 = highest score)
  const sortedByScore = [...rows].sort(
    (a, b) => (parseFloat(b['Score']) || 0) - (parseFloat(a['Score']) || 0)
  );
  const rankMap = new Map<string, number>();
  sortedByScore.forEach((row, i) => rankMap.set(row['Employee ID'], i + 1));

  return rows.map(row => {
    const id = row['Employee ID'];
    const numId = parseInt(id);
    const score = parseFloat(row['Score']) || 0;
    const readiness = row['Readiness'] ? parseFloat(row['Readiness']) : undefined;

    const competencyDetails = CAP_COLS.map((col, i) => ({
      name: CAP_NAMES[i],
      score: parseInt(row[col]) || 0,
    }));
    const hasCapData = competencyDetails.some(d => d.score > 0);

    const managerId = row['Manager ID']?.trim() || undefined;

    const employee: Employee = {
      id,
      displayId: `EMP${String(numId).padStart(3, '0')}`,
      rank: rankMap.get(id) ?? 0,
      name: row['Name'],
      position: row['Position'],
      jobTitle: row['Department'],
      competencyScore: score,
      successors: 0,
      managerId,
      imageUrl: row['Photo URL'] || undefined,
      performanceRating: 3,
      readinessScore: readiness,
      criticalPosition: row['Critical Position'] === 'Yes',
      gender: (row['Gender'] as Employee['gender']) || undefined,
      city: row['City'] || undefined,
      maritalStatus: (row['Marital Status'] as Employee['maritalStatus']) || undefined,
      performance: row['[Performance] Score'] ? parseFloat(row['[Performance] Score']) : undefined,
      iq: row['IQ'] ? parseInt(row['IQ']) : undefined,
      capabilityScore: row['Capability'] ? parseFloat(row['Capability']) : undefined,
      commitmentScore: row['Commitment'] ? parseFloat(row['Commitment']) : undefined,
      contributionScore: row['Contribution'] ? parseFloat(row['Contribution']) : undefined,
      competencyDetails: hasCapData ? competencyDetails : undefined,
    };

    // Generate IDP recommendations (use readiness score, fall back to competency score)
    const devData = generateDevelopmentData(id, readiness ?? score);
    if (!hasCapData) employee.competencyDetails = devData.competencyDetails;
    employee.idpRecommendations = devData.idpRecommendations;

    return employee;
  });
}

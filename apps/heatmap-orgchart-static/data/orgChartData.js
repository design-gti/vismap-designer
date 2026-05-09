// Ported from src/app/data/orgChartData.ts (no dependencies)
import { generateDevelopmentData } from "./developmentData.js";

export const employees = [
  {
    id: "1",
    name: "Dian Susanti",
    position: "CEO",
    jobTitle: "Executive",
    competencyScore: 98,
    successors: 0,
    performanceRating: 3,
    readinessScore: 95,
    criticalPosition: true,
    gender: "Female",
    city: "Jakarta",
    maritalStatus: "Single",
    performance: 93,
    iq: 116,
    imageUrl: "https://lh3.googleusercontent.com/d/1shLBgT6fuyMjmChgNhEB2OzZPSB1VRoI=s220?authuser=0",
    ...generateDevelopmentData("1", 95),
  },
  {
    id: "2",
    name: "Dimas Eka",
    position: "Chief Product Officer",
    jobTitle: "Product",
    competencyScore: 96,
    successors: 0,
    performanceRating: 3,
    managerId: "1",
    readinessScore: 85,
    criticalPosition: false,
    gender: "Male",
    city: "Semarang",
    maritalStatus: "Single",
    performance: 87,
    iq: 124,
    imageUrl: "https://lh3.googleusercontent.com/d/1Bf-zMgdBC7GlhsBnhNAwC54hxXKxHtzR=s220?authuser=0",
    ...generateDevelopmentData("2", 85),
  },
  {
    id: "3",
    name: "Firmansyah",
    position: "Chief Technology Officer",
    jobTitle: "Technology",
    competencyScore: 95,
    successors: 0,
    performanceRating: 3,
    managerId: "1",
    readinessScore: 78,
    criticalPosition: false,
    gender: "Male",
    city: "Makassar",
    maritalStatus: "Married",
    performance: 86,
    iq: 107,
    imageUrl: "https://lh3.googleusercontent.com/d/1744YkyaAWXXYYVE7nv34bjLQEmnWlua3=s220?authuser=0",
    ...generateDevelopmentData("3", 78),
    activeIDP: {
      startDate: "2024-08-15",
      programs: [
        {
          competency: "Strategic Planning",
          program: "Strategic Leadership Bootcamp",
          mentor: "Dian Susanti",
          startDate: "2024-08-15",
          endDate: "2024-11-15",
          duration: "3 Months",
          status: "in progress",
          progress: 65,
          activities: [
            { name: "Strategic Thinking Workshop", completed: true, completedDate: "2024-09-01" },
            { name: "Business Case Development", completed: true, completedDate: "2024-09-20" },
            { name: "Leadership Simulation Exercise", completed: false },
            { name: "Final Strategic Plan Presentation", completed: false },
          ],
        },
      ],
    },
  },
  // Note: full dataset contains 50 employees. Add more later if needed.
];

export function buildOrgChart(employeeList = employees) {
  const map = new Map();
  employeeList.forEach((emp) => map.set(emp.id, { ...emp, reports: [] }));
  const roots = [];
  employeeList.forEach((emp) => {
    const node = map.get(emp.id);
    if (!emp.managerId) roots.push(node);
    else {
      const manager = map.get(emp.managerId);
      if (manager) manager.reports.push(node);
    }
  });
  return roots;
}


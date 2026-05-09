import { useState } from "react";
import { type Employee } from "../data/orgChartData";
import { Search, Plus, Filter, MoreVertical, ChevronDown, ChevronUp, TrendingUp, ChevronsUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { type HeatmapConfig } from "./HeatmapSettings";
import { dataManager } from "../data/dataManager";

interface VisibleColumns {
  gender: boolean;
  city: boolean;
  maritalStatus: boolean;
  performance: boolean;
  iq: boolean;
}

interface TableViewProps {
  employees: Employee[];
  activeTab: string;
  onEmployeeClick: (employee: Employee) => void;
  visibleColumns: VisibleColumns;
  setVisibleColumns: React.Dispatch<React.SetStateAction<VisibleColumns>>;
  showHeatmap: boolean;
  heatmapStyle: 'gradient' | 'border' | 'glow';
  heatmapConfig: HeatmapConfig;
}

type SortField = 'name' | 'position' | 'competencyScore' | 'jobTitle' | 'readinessScore' | 'criticalPosition' | 'gender' | 'city' | 'maritalStatus' | 'performance' | 'iq';
type SortDirection = 'asc' | 'desc';

export default function TableView({ employees, activeTab, onEmployeeClick, visibleColumns, setVisibleColumns, showHeatmap, heatmapStyle, heatmapConfig }: TableViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);

  const toggleColumn = (column: keyof VisibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // NO FILTER - Show all employees (tabs only affect heatmap, not data filtering)
  const getFilteredEmployees = () => {
    let filtered = employees;

    // Apply search filter only
    if (searchQuery) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedEmployees = () => {
    const filtered = getFilteredEmployees();
    
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle undefined values
      if (aValue === undefined) aValue = 0;
      if (bValue === undefined) bValue = 0;

      // String comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedEmployees = getSortedEmployees();

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 inline ml-1 text-[#adb5bd]" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1 text-[#016699]" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1 text-[#016699]" />
    );
  };

  // Heatmap Logic - Get color for employee row based on activeTab
  const getRowHeatmapColor = (employee: Employee): string | null => {
    if (!showHeatmap) return null;
    
    // Default Tab (activeTab = 'all', heatmapMode = 'performance'):
    // Use Competency Score with needDevelop config (5-level)
    if (activeTab === 'all') {
      const score = employee.competencyScore;
      const ranges = heatmapConfig.needDevelop;
      
      for (const range of ranges) {
        if (score >= range.min && score <= range.max) {
          return range.color;
        }
      }
      return ranges[0].color; // Fallback to lowest range
    }
    
    // Need Develop Tab (heatmapMode = 'need-develop'):
    // Use Competency Score with needDevelop config (5-level)
    // Don't show for vacant positions
    else if (activeTab === 'need-develop') {
      // Skip vacant positions
      if (employee.name === '(Vacant)') {
        return null;
      }
      
      const score = employee.competencyScore;
      const ranges = heatmapConfig.needDevelop;
      
      for (const range of ranges) {
        if (score >= range.min && score <= range.max) {
          return range.color;
        }
      }
      return ranges[0].color; // Fallback to lowest range
    }
    
    // Need Successors v2 Tab (heatmapMode = 'need-successors-copy'):
    // Complex logic based on subordinates' readiness scores
    // Only applies to managers (employees with at least 1 subordinate)
    else if (activeTab === 'need-successors-copy') {
      // Check if employee has subordinates (direct reports)
      const directReports = employees.filter(e => e.managerId === employee.id);
      const hasSubordinates = directReports.length > 0;
      
      // Only show heatmap for managers
      if (!hasSubordinates) {
        return null;
      }
      
      // Get thresholds from heatmap config
      const readinessRanges = heatmapConfig.readinessScore;
      const sortedRanges = [...readinessRanges].sort((a, b) => a.min - b.min);
      const redRange = sortedRanges[0]; // Lowest range
      const greenRange = sortedRanges[sortedRanges.length - 1]; // Highest range (READY)
      
      // Calculate readiness score for each subordinate
      const subordinatesWithReadiness = directReports.map(report => {
        // Use readiness score from data if available
        if (report.readinessScore !== undefined && report.readinessScore !== null) {
          return report.readinessScore;
        }
        
        // Fallback calculation based on competency score
        const currentScore = report.competencyScore;
        if (currentScore >= 91) {
          return Math.round(currentScore * 0.92);
        } else if (currentScore >= 76) {
          return Math.round(currentScore * 0.88);
        } else if (currentScore >= 66) {
          return Math.round(currentScore * 0.80);
        } else {
          return Math.round(currentScore * 0.72);
        }
      });
      
      // Classify subordinates based on threshold
      const greenCount = subordinatesWithReadiness.filter(score => 
        score >= greenRange.min && score <= greenRange.max
      ).length;
      const redCount = subordinatesWithReadiness.filter(score => 
        score >= redRange.min && score <= redRange.max
      ).length;
      const totalCount = subordinatesWithReadiness.length;
      const greenPercentage = (greenCount / totalCount) * 100;
      
      // Logic untuk menentukan warna manager (same as OrgNode):
      // 1. Manager HIJAU jika: >= 50% bawahan READY (hijau) ATAU minimal 2 bawahan READY
      if (greenPercentage >= 50 || greenCount >= 2) {
        return '#88E113'; // Green
      }
      
      // 4. Manager MERAH jika: tidak ada bawahan READY DAN minimal ada 1 bawahan merah
      if (greenCount === 0 && redCount > 0) {
        return '#FE0D00'; // Red
      }
      
      // 3 & 5. Manager ORANGE untuk kondisi lainnya
      return '#F59E02'; // Orange
    }
    
    return null;
  };

  // Get row styles based on heatmap style
  const getRowStyles = (employee: Employee): { className: string; style: React.CSSProperties } => {
    const heatmapColor = getRowHeatmapColor(employee);
    
    if (!heatmapColor) {
      return {
        className: "cursor-pointer hover:bg-gray-50 border-t border-[#dee2e6]",
        style: {}
      };
    }
    
    // Gradient Overlay Style
    if (heatmapStyle === 'gradient') {
      return {
        className: "cursor-pointer hover:brightness-95 border-t border-[#dee2e6] transition-all",
        style: {
          background: `linear-gradient(to right, ${heatmapColor}40, ${heatmapColor}10)`,
        }
      };
    }
    
    // Discrete Border Style
    else if (heatmapStyle === 'border') {
      return {
        className: "cursor-pointer hover:bg-gray-50 border-t border-[#dee2e6] transition-all",
        style: {
          borderLeft: `4px solid ${heatmapColor}`,
        }
      };
    }
    
    // Glow Effect Style
    else if (heatmapStyle === 'glow') {
      return {
        className: "cursor-pointer hover:brightness-95 border-t border-[#dee2e6] transition-all",
        style: {
          backgroundColor: `${heatmapColor}20`,
          boxShadow: `inset 0 0 20px ${heatmapColor}30`,
        }
      };
    }
    
    return {
      className: "cursor-pointer hover:bg-gray-50 border-t border-[#dee2e6]",
      style: {}
    };
  };

  return (
    <div className="size-full flex flex-col">
      {/* Table Container with Shadow */}
      <div className="bg-white rounded-[8px] shadow-[2px_2px_15px_0px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col flex-1">
        {/* Toolbar */}
        <div className="bg-white border-b border-[#dee2e6] px-[16px] py-[8px] flex items-center justify-between">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#dee2e6] rounded-[16px] px-[12px] py-[8px] pr-[36px] w-[299px] font-['Open_Sans',_sans-serif] text-[12px] text-[#adb5bd] focus:outline-none focus:border-[#016699]"
              style={{ fontVariationSettings: "'wdth' 100" }}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#58595B]" />
          </div>

          {/* Right Actions */}
          <div className="flex gap-[8px] items-center">
            <button 
              onClick={() => setIsVariableDialogOpen(true)}
              className="flex gap-[8px] items-center px-[12px] py-[8px] rounded-[28px] hover:bg-gray-50"
            >
              <Plus className="w-5 h-5 text-[#016699]" />
              <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#016699]">Variable</span>
            </button>
            <button className="flex gap-[8px] items-center px-[12px] py-[8px] rounded-[28px] hover:bg-gray-50">
              <Filter className="w-5 h-5 text-[#016699]" />
              <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#016699]">Filter</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                {/* Row Number Column */}
                <th className="bg-white h-[35px] w-[54px] sticky top-0 z-10"></th>
                
                {/* Employee Name */}
                <th 
                  className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                    <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                      Employee Name <SortIcon field="name" />
                    </span>
                  </div>
                </th>

                {/* Position */}
                <th 
                  className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('position')}
                >
                  <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                    <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                      Posisi <SortIcon field="position" />
                    </span>
                  </div>
                </th>

                {/* Department */}
                <th 
                  className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('jobTitle')}
                >
                  <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                    <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                      Departmen <SortIcon field="jobTitle" />
                    </span>
                  </div>
                </th>

                {/* Competency Score */}
                <th 
                  className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('competencyScore')}
                >
                  <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                    <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                      Competency Score <SortIcon field="competencyScore" />
                    </span>
                  </div>
                </th>

                {/* Readiness Score */}
                <th 
                  className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('readinessScore')}
                >
                  <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                    <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                      Readiness Score <SortIcon field="readinessScore" />
                    </span>
                  </div>
                </th>

                {/* Critical Position */}
                <th 
                  className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('criticalPosition')}
                >
                  <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                    <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                      Critical Position <SortIcon field="criticalPosition" />
                    </span>
                  </div>
                </th>

                {/* Gender */}
                {visibleColumns.gender && (
                  <th 
                    className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('gender')}
                  >
                    <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                      <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                        Gender <SortIcon field="gender" />
                      </span>
                    </div>
                  </th>
                )}

                {/* City */}
                {visibleColumns.city && (
                  <th 
                    className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('city')}
                  >
                    <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                      <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                        City <SortIcon field="city" />
                      </span>
                    </div>
                  </th>
                )}

                {/* Marital Status */}
                {visibleColumns.maritalStatus && (
                  <th 
                    className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('maritalStatus')}
                  >
                    <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                      <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                        Marital Status <SortIcon field="maritalStatus" />
                      </span>
                    </div>
                  </th>
                )}

                {/* Performance */}
                {visibleColumns.performance && (
                  <th 
                    className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('performance')}
                  >
                    <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                      <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                        Performance <SortIcon field="performance" />
                      </span>
                    </div>
                  </th>
                )}

                {/* IQ */}
                {visibleColumns.iq && (
                  <th 
                    className="bg-white sticky top-0 z-10 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('iq')}
                  >
                    <div className="px-[12px] py-[8px] flex gap-[12px] items-center justify-start">
                      <span className="font-['Avenir',_sans-serif] font-black text-[14px] text-[#495057]">
                        IQ <SortIcon field="iq" />
                      </span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7 + Object.values(visibleColumns).filter(Boolean).length} className="text-center text-[#adb5bd] py-8">
                    <span className="font-['Open_Sans',_sans-serif] text-[12px]">No employees found</span>
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((employee, index) => {
                  const rowStyles = getRowStyles(employee);
                  return (
                    <tr
                      key={employee.id}
                      className={rowStyles.className}
                      onClick={() => onEmployeeClick(employee)}
                      style={rowStyles.style}
                    >
                      {/* Row Number */}
                      <td className="h-[48px] w-[54px]">
                        <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                          <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            {index + 1}
                          </span>
                        </div>
                      </td>

                      {/* Employee Name */}
                      <td className="h-[48px] w-[220px]">
                        <div className="px-[12px] py-[8px] flex gap-[10px] items-center">
                          {/* Avatar */}
                          <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 bg-[#dee2e6]">
                            {employee.imageUrl ? (
                              <img
                                src={employee.imageUrl}
                                alt={employee.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#6c757d] text-[12px] font-bold">
                                {employee.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          {/* Name + Display ID */}
                          <div className="flex flex-col min-w-0">
                            <span className="font-['Avenir',_sans-serif] font-black text-[12px] text-[#016699] truncate">
                              {employee.name}
                            </span>
                            {employee.displayId && (
                              <span className="font-['Open_Sans',_sans-serif] text-[10px] text-[#adb5bd]">
                                {employee.displayId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="h-[48px]">
                        <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                          <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            {employee.position}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="h-[48px]">
                        <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                          <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            {employee.jobTitle}
                          </span>
                        </div>
                      </td>

                      {/* Competency Score */}
                      <td className="h-[48px]">
                        <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                          <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            {employee.competencyScore}%
                          </span>
                        </div>
                      </td>

                      {/* Readiness Score */}
                      <td className="h-[48px]">
                        <div className="px-[12px] py-[8px] flex gap-[6px] items-center">
                          <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            {employee.readinessScore !== undefined ? `${employee.readinessScore}%` : '-'}
                          </span>
                          {employee.activeIDP && employee.readinessScore !== undefined && (
                            <TrendingUp 
                              className="w-[12px] h-[12px] text-[#016699]" 
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                      </td>

                      {/* Critical Position */}
                      <td className="h-[48px]">
                        <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                          <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            {employee.criticalPosition ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </td>

                      {/* Gender */}
                      {visibleColumns.gender && (
                        <td className="h-[48px]">
                          <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                            <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              {employee.gender || '-'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* City */}
                      {visibleColumns.city && (
                        <td className="h-[48px]">
                          <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                            <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              {employee.city || '-'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Marital Status */}
                      {visibleColumns.maritalStatus && (
                        <td className="h-[48px]">
                          <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                            <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              {employee.maritalStatus || '-'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Performance */}
                      {visibleColumns.performance && (
                        <td className="h-[48px]">
                          <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                            <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              {employee.performance !== undefined ? `${employee.performance}%` : '-'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* IQ */}
                      {visibleColumns.iq && (
                        <td className="h-[48px]">
                          <div className="px-[12px] py-[8px] flex gap-[12px] items-center">
                            <span className="font-['Open_Sans',_sans-serif] text-[12px] text-[#495057]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              {employee.iq || '-'}
                            </span>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variable Selection Dialog */}
      <Dialog open={isVariableDialogOpen} onOpenChange={setIsVariableDialogOpen}>
        <DialogContent className="max-w-[500px] font-['Open_Sans',_sans-serif]">
          <DialogHeader>
            <DialogTitle className="font-['Open_Sans',_sans-serif] font-bold text-[#495057]">
              Add/Remove Variables
            </DialogTitle>
            <DialogDescription className="text-[#6c757d] text-[12px] mt-2">
              Select which columns you want to display in the table
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-[16px] mt-4">
            {/* Gender */}
            <div className="flex items-center gap-[12px]">
              <Checkbox 
                id="gender" 
                checked={visibleColumns.gender}
                onCheckedChange={() => toggleColumn('gender')}
              />
              <Label 
                htmlFor="gender" 
                className="font-['Open_Sans',_sans-serif] text-[14px] text-[#495057] cursor-pointer"
              >
                Gender
              </Label>
            </div>

            {/* City */}
            <div className="flex items-center gap-[12px]">
              <Checkbox 
                id="city" 
                checked={visibleColumns.city}
                onCheckedChange={() => toggleColumn('city')}
              />
              <Label 
                htmlFor="city" 
                className="font-['Open_Sans',_sans-serif] text-[14px] text-[#495057] cursor-pointer"
              >
                City
              </Label>
            </div>

            {/* Marital Status */}
            <div className="flex items-center gap-[12px]">
              <Checkbox 
                id="maritalStatus" 
                checked={visibleColumns.maritalStatus}
                onCheckedChange={() => toggleColumn('maritalStatus')}
              />
              <Label 
                htmlFor="maritalStatus" 
                className="font-['Open_Sans',_sans-serif] text-[14px] text-[#495057] cursor-pointer"
              >
                Marital Status
              </Label>
            </div>

            {/* Performance */}
            <div className="flex items-center gap-[12px]">
              <Checkbox 
                id="performance" 
                checked={visibleColumns.performance}
                onCheckedChange={() => toggleColumn('performance')}
              />
              <Label 
                htmlFor="performance" 
                className="font-['Open_Sans',_sans-serif] text-[14px] text-[#495057] cursor-pointer"
              >
                Performance
              </Label>
            </div>

            {/* IQ */}
            <div className="flex items-center gap-[12px]">
              <Checkbox 
                id="iq" 
                checked={visibleColumns.iq}
                onCheckedChange={() => toggleColumn('iq')}
              />
              <Label 
                htmlFor="iq" 
                className="font-['Open_Sans',_sans-serif] text-[14px] text-[#495057] cursor-pointer"
              >
                IQ
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
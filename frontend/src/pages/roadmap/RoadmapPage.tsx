import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Search,
  Plus,
  Target,
  UserCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  X,
  ExternalLink,
  Briefcase,
  BookOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useCareerProfile, useActiveRoadmap } from '@/features/roadmap/components/useRoadmap';
import { roadmapService, type RoadmapNode } from '@/services/roadmap/roadmapService';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

// ─── Custom Node Component ───────────────────────────────────────────────────
const RoadmapNodeComponent = ({ data }: { data: any }) => {
  const statusColors = [
    'border-muted bg-card text-muted-foreground',
    'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600',
    'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600'
  ];
  
  const StatusIcon = [Circle, Clock, CheckCircle2][data.status];

  return (
    <div 
      onClick={() => data.onClick(data.rawNode)}
      className={`relative px-4 py-4 rounded-2xl border-2 shadow-xl w-[240px] h-[120px] bg-card cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 flex flex-col justify-between ${statusColors[data.status]}`}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1 rounded-md ${data.status === 2 ? 'bg-emerald-500/20' : 'bg-muted'}`}>
            <StatusIcon className="h-3 w-3 shrink-0" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">{data.category || 'Skill'}</span>
        </div>
        <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-2 pr-10">{data.label}</h4>
      </div>

      {data.isCustom && (
        <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
          Tự chọn
        </span>
      )}
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <span className="text-[9px] font-bold opacity-40 uppercase">Bấm để xem chi tiết</span>
        <div className="flex gap-0.5 w-16">
          {[0, 1, 2].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${data.status >= s ? (data.status === 2 ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const RoadmapHeaderComponent = ({ data }: { data: any }) => {
  return (
    <div className="w-[240px] text-center py-3 bg-muted/60 dark:bg-muted/20 border-b-4 border-primary/40 rounded-t-2xl shadow-sm">
      <h3 className="font-extrabold text-xs uppercase tracking-[0.2em] text-primary">{data.label}</h3>
    </div>
  );
};

const nodeTypes = { 
  roadmapNode: RoadmapNodeComponent,
  roadmapHeader: RoadmapHeaderComponent
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RoadmapPage() {
  const { profile, refresh: refreshProfile } = useCareerProfile();
  const { roadmap, loading: loadRoadmap, refresh: refreshRoadmap } = useActiveRoadmap();

  const [careerPath, setCareerPath] = useState('');
  const [targetLevel, setTargetLevel] = useState(1); // Default Intermediate
  const [generating, setGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [triggerGenerateAfterProfileSave, setTriggerGenerateAfterProfileSave] = useState(false);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [certUrl, setCertUrl] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editStatus, setEditStatus] = useState<number>(0);
  const [newSkillName, setNewSkillName] = useState('');

  // Custom Node Edit states (inside node detail modal)
  const [editNodeTitle, setEditNodeTitle] = useState('');
  const [editNodeDesc, setEditNodeDesc] = useState('');
  const [editNodeCategory, setEditNodeCategory] = useState('Basic');
  const [editNodePrereqs, setEditNodePrereqs] = useState<string[]>([]);

  // Custom Node Add modal state
  const [showAddCustomNodeModal, setShowAddCustomNodeModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCategory, setCustomCategory] = useState('Basic');
  const [customPrereqs, setCustomPrereqs] = useState<string[]>([]);

  // Profile Edit state
  const [editMajor, setEditMajor] = useState('');
  const [editJob, setEditJob] = useState('');
  const [editExp, setEditExp] = useState(0);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (profile) {
      setEditMajor(profile.major);
      setEditJob(profile.currentJob || '');
      setEditExp(profile.experienceYears || 0);
    }
  }, [profile]);

  useEffect(() => {
    if (roadmap) {
      // 1. Create Stage Headers
      const flowNodes: Node[] = [
        {
          id: 'h-basic',
          type: 'roadmapHeader',
          position: { x: 100, y: 10 },
          data: { label: 'Giai đoạn 1: Basic' },
          draggable: false,
          selectable: false,
        },
        {
          id: 'h-advanced',
          type: 'roadmapHeader',
          position: { x: 450, y: 10 },
          data: { label: 'Giai đoạn 2: Advanced' },
          draggable: false,
          selectable: false,
        },
        {
          id: 'h-master',
          type: 'roadmapHeader',
          position: { x: 800, y: 10 },
          data: { label: 'Giai đoạn 3: Master' },
          draggable: false,
          selectable: false,
        }
      ];

      // 2. Map actual nodes
      const roadmapFlowNodes: Node[] = roadmap.nodes.map((n) => ({
        id: n.id,
        type: 'roadmapNode',
        position: { x: n.positionX || 0, y: n.positionY || 0 },
        data: {
          id: n.id,
          label: n.title,
          description: n.description,
          category: n.category,
          status: n.status,
          certificateUrl: n.certificateUrl,
          isCustom: n.isCustom,
          rawNode: n,
          onStatusChange: handleStatusChange,
          onClick: (node: RoadmapNode) => {
             setSelectedNode(node);
             setEditStatus(node.status);
             setCertUrl(node.certificateUrl || '');
             setEditNote(node.note || '');
             // Load custom node edit states
             setEditNodeTitle(node.title);
             setEditNodeDesc(node.description || '');
             setEditNodeCategory(node.category || 'Basic');
             
             // Map prerequisite keys (strings) back to Guid IDs
             const preIds = (node.prerequisiteKeys || [])
               .map(key => roadmap.nodes.find(rn => rn.nodeKey === key)?.id)
               .filter((id): id is string => !!id);
             setEditNodePrereqs(preIds);
          }
        }
      }));

      flowNodes.push(...roadmapFlowNodes);

      // 3. Map edges
      const flowEdges: Edge[] = [];
      roadmap.nodes.forEach(n => {
        n.prerequisiteKeys.forEach(preKey => {
          const preNode = roadmap.nodes.find(rn => rn.nodeKey === preKey);
          if (preNode) {
            flowEdges.push({
              id: `e-${preNode.id}-${n.id}`,
              source: preNode.id,
              target: n.id,
              animated: preNode.status === 2,
              style: { stroke: preNode.status === 2 ? '#10b981' : '#94a3b8', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: preNode.status === 2 ? '#10b981' : '#94a3b8' }
            });
          }
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [roadmap]);

  const handleStatusChange = async (nodeId: string, status: number) => {
    await roadmapService.updateProgress({ nodeId, status });
    refreshRoadmap();
  };

  const handleGenerate = async () => {
    if (!careerPath.trim()) {
      toast.error("Vui lòng nhập vị trí công việc mơ ước.");
      return;
    }
    if (!profile || !profile.major || profile.major === "Chưa cập nhật") {
      toast.error("Vui lòng cập nhật Hồ sơ năng lực (Chuyên ngành) trước khi tạo lộ trình.");
      setTriggerGenerateAfterProfileSave(true);
      setShowProfileModal(true);
      return;
    }
    setGenerating(true);
    const loadingToast = toast.loading("AI đang nghiên cứu và tạo lộ trình cho bạn...");
    try {
      await roadmapService.generateAiRoadmap(careerPath.trim(), targetLevel);
      await refreshRoadmap();
      toast.success("Lộ trình đã sẵn sàng!", { id: loadingToast });
    } catch (err: any) {
      console.error("handleGenerate error", err);
      toast.error(err.response?.data?.message || "Không thể tạo lộ trình. Vui lòng thử lại sau.", { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteRoadmap = async () => {
    if (!roadmap) return;
    await roadmapService.deleteRoadmap(roadmap.id);
    toast.success('Đã xoá lộ trình');
    refreshRoadmap();
  };

  const handleUpdateProfile = async () => {
    if (!editMajor.trim()) {
      toast.error("Vui lòng nhập chuyên ngành.");
      return;
    }
    const loadingToast = toast.loading("Đang lưu hồ sơ...");
    try {
      await roadmapService.updateProfile({ 
        major: editMajor.trim(), 
        currentJob: editJob.trim(), 
        experienceYears: editExp 
      });
      toast.success("Cập nhật hồ sơ thành công!", { id: loadingToast });
      
      await refreshProfile();
      setShowProfileModal(false);

      if (triggerGenerateAfterProfileSave) {
        setTriggerGenerateAfterProfileSave(false);
        setGenerating(true);
        const genToast = toast.loading("AI đang nghiên cứu và tạo lộ trình cho bạn...");
        try {
          await roadmapService.generateAiRoadmap(careerPath.trim(), targetLevel);
          await refreshRoadmap();
          toast.success("Lộ trình đã sẵn sàng!", { id: genToast });
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Không thể tạo lộ trình. Vui lòng thử lại sau.", { id: genToast });
        } finally {
          setGenerating(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể lưu hồ sơ. Vui lòng kiểm tra lại.", { id: loadingToast });
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    await roadmapService.addSkill({ skillName: newSkillName, skillType: 0 });
    setNewSkillName('');
    refreshProfile();
    setShowAddSkillModal(false);
  };

  const handleDeleteSkill = async (id: string) => {
    await roadmapService.deleteSkill(id);
    refreshProfile();
  };

  const handleSubmitNodeProgress = async () => {
    if (!selectedNode) return;

    if (editStatus === 2 && !certUrl.trim()) {
      toast.error("Vui lòng nhập Link chứng chỉ (URL) để xác nhận đã hoàn thành kỹ năng này.");
      return;
    }

    const loadingToast = toast.loading("Đang lưu tiến trình...");
    try {
      // 1. If it's a custom node, save title, description, category, prerequisites updates
      if (selectedNode.isCustom) {
        if (!editNodeTitle.trim()) {
          toast.error("Tên kỹ năng không được để trống.", { id: loadingToast });
          return;
        }
        await roadmapService.updateCustomNode(selectedNode.id, {
          title: editNodeTitle.trim(),
          description: editNodeDesc.trim(),
          category: editNodeCategory,
          prerequisiteNodeIds: editNodePrereqs
        });
      }

      // 2. Save progress update
      await roadmapService.updateProgress({ 
        nodeId: selectedNode.id, 
        status: editStatus,
        certificateUrl: certUrl,
        note: editNote 
      });

      setCertUrl('');
      setEditNote('');
      setSelectedNode(null);
      refreshRoadmap();
      toast.success("Đã cập nhật thành công!", { id: loadingToast });
    } catch (err: any) {
      toast.error("Không thể lưu tiến trình.", { id: loadingToast });
    }
  };

  const handleAddCustomNode = async () => {
    if (!customTitle.trim()) {
      toast.error("Vui lòng nhập tên kỹ năng.");
      return;
    }
    const loadingToast = toast.loading("Đang thêm kỹ năng tự chọn...");
    try {
      await roadmapService.addCustomNode({
        title: customTitle.trim(),
        description: customDesc.trim(),
        category: customCategory,
        prerequisiteNodeIds: customPrereqs
      });
      toast.success("Đã thêm kỹ năng tự chọn thành công!", { id: loadingToast });
      setCustomTitle('');
      setCustomDesc('');
      setCustomPrereqs([]);
      setShowAddCustomNodeModal(false);
      refreshRoadmap();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể thêm kỹ năng.", { id: loadingToast });
    }
  };

  const handleDeleteCustomNode = async () => {
    if (!selectedNode) return;
    const loadingToast = toast.loading("Đang xóa kỹ năng tự chọn...");
    try {
      await roadmapService.deleteCustomNode(selectedNode.id);
      toast.success("Đã xóa kỹ năng tự chọn!", { id: loadingToast });
      setSelectedNode(null);
      refreshRoadmap();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa kỹ năng.", { id: loadingToast });
    }
  };

  if (loadRoadmap) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 relative">
      <div className="animate-fade-in flex flex-col gap-6 h-full">
      
      {/* ── Header ── */}
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="page-title">Lộ trình nghề nghiệp</h1>
          <p className="page-subtitle">Xây dựng kỹ năng và chinh phục mục tiêu sự nghiệp với AI</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {roadmap && (
            <>
              <button 
                onClick={() => {
                  setCustomCategory('Basic');
                  setCustomPrereqs([]);
                  setShowAddCustomNodeModal(true);
                }}
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold leading-tight text-amber-600 transition hover:bg-amber-500/20 sm:h-9 sm:px-4 sm:text-sm"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="min-w-0 whitespace-normal text-center sm:whitespace-nowrap">Thêm kỹ năng tự chọn</span>
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="inline-flex h-full min-h-9 items-center justify-center rounded-xl border px-3 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive sm:h-9">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button 
            onClick={() => setShowProfileModal(true)}
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold leading-tight text-primary transition hover:bg-primary/20 sm:h-9 sm:px-4 sm:text-sm"
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className="min-w-0 whitespace-normal text-center sm:whitespace-nowrap">Hồ sơ năng lực</span>
          </button>
        </div>
      </div>

      {!roadmap ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-card rounded-3xl border border-dashed p-12 text-center space-y-8">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="h-10 w-10" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-3xl font-black">Bạn muốn trở thành ai?</h2>
            <p className="text-muted-foreground">Nhập vị trí công việc mơ ước và chọn mục tiêu bạn muốn đạt được.</p>
          </div>
          
          <div className="w-full max-w-lg space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                value={careerPath}
                onChange={e => setCareerPath(e.target.value)}
                placeholder="VD: Senior Fullstack Developer, Data Scientist..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-lg shadow-sm"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-muted-foreground uppercase text-left ml-2">Mục tiêu cấp độ</p>
              <div className="grid grid-cols-4 gap-2">
                {['Mới bắt đầu', 'Trung cấp', 'Cao cấp', 'Chuyên gia'].map((l, i) => (
                  <button
                    key={l}
                    onClick={() => setTargetLevel(i)}
                    className={`h-10 rounded-xl text-xs font-bold transition-all border ${targetLevel === i ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-muted/50 hover:bg-muted text-muted-foreground border-transparent'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !careerPath.trim()}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-primary/20"
            >
              {generating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              Bắt đầu hành trình
            </button>
          </div>
        </div>
      ) : (
        <div className={isFullscreen ? "fixed inset-0 z-50 bg-background flex flex-col p-6 animate-fade-in" : "flex-1 bg-card rounded-3xl border shadow-inner relative overflow-hidden group"}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/5"
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls className="!bg-card !border-border !shadow-lg" />
            <Panel position="top-left" className="bg-card/90 backdrop-blur border p-4 rounded-2xl shadow-xl m-4 animate-in slide-in-from-left duration-500">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Mục tiêu hiện tại</p>
                  <p className="font-bold text-sm">{roadmap.careerPath}</p>
                </div>
              </div>
            </Panel>
            
            <Panel position="top-right" className="m-4">
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border shadow-lg text-foreground hover:bg-muted transition"
                title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </Panel>

            <Panel position="bottom-right" className="bg-card/80 backdrop-blur border p-3 rounded-2xl shadow-sm m-4 flex gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-1.5"><Circle className="h-3 w-3" /> CHƯA HỌC</div>
              <div className="flex items-center gap-1.5 text-blue-500"><Clock className="h-3 w-3" /> ĐANG HỌC</div>
              <div className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 className="h-3 w-3" /> HOÀN THÀNH</div>
            </Panel>
          </ReactFlow>
        </div>
      )}

      {/* ── Profile Summary ── */}
      {profile && !isFullscreen && (
        <div className="grid shrink-0 grid-cols-1 gap-3 xl:grid-cols-4 xl:gap-4">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md xl:col-span-1 xl:block xl:space-y-2 group"
          >
            <div className="flex min-w-[112px] items-center gap-2 xl:justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chuyên ngành</p>
              <Briefcase className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="min-w-0 flex-1 break-words text-right text-sm font-bold xl:truncate xl:text-left">{profile.major}</p>
          </button>
          
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md xl:col-span-1 xl:block xl:space-y-2 group"
          >
             <div className="flex min-w-[112px] items-center gap-2 xl:justify-between">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kinh nghiệm</p>
               <Clock className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
             </div>
            <p className="min-w-0 flex-1 text-right text-sm font-bold xl:text-left">{profile.experienceYears || 0} năm làm việc</p>
          </button>

          <div className="rounded-2xl border bg-card p-4 xl:col-span-2">
             <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kỹ năng hiện có</p>
                <button onClick={() => setShowAddSkillModal(true)} className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-2 text-xs font-bold text-primary hover:bg-primary/20 sm:h-6 sm:w-6 sm:px-0">
                  <Plus className="h-3 w-3" />
                  <span className="sm:hidden">Thêm</span>
                </button>
             </div>
             <div className="flex flex-wrap gap-2">
                {profile.skills.filter(s => s.skillType === 0).map(s => (
                  <span key={s.id} className="group relative inline-flex min-h-7 max-w-full items-center rounded-lg bg-muted px-2 py-1 text-[10px] font-bold">
                    <span className="min-w-0 break-words">{s.skillName}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSkill(s.id); }}
                      className="ml-1 shrink-0 text-destructive opacity-100 transition-all hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                {profile.skills.filter(s => s.skillType === 0).length === 0 && <span className="text-[10px] text-muted-foreground italic">Chưa có kỹ năng</span>}
             </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Profile & Skills ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-muted/20">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" /> Hồ sơ năng lực
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Chuyên ngành</label>
                  <input 
                    value={editMajor} 
                    onChange={e => setEditMajor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Số năm kinh nghiệm</label>
                  <input 
                    type="number"
                    value={editExp} 
                    onChange={e => setEditExp(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 bg-muted/10">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="h-11 px-6 rounded-2xl border font-bold hover:bg-muted transition"
              >
                Huỷ
              </button>
              <button 
                onClick={handleUpdateProfile}
                className="h-11 px-8 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
              >
                Lưu hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Node Detail & Certification Submission ── */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">{selectedNode.category || 'Skill'}</p>
                  <h3 className="text-lg font-bold">{selectedNode.isCustom ? "Chỉnh sửa kỹ năng" : selectedNode.title}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* If it's a Custom Node, show editable inputs */}
              {selectedNode.isCustom ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Tên kỹ năng</label>
                    <input 
                      value={editNodeTitle}
                      onChange={e => setEditNodeTitle(e.target.value)}
                      placeholder="Nhập tên kỹ năng..."
                      className="w-full h-11 px-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Mô tả chi tiết</label>
                    <textarea 
                      value={editNodeDesc}
                      onChange={e => setEditNodeDesc(e.target.value)}
                      placeholder="Mô tả kỹ năng..."
                      className="w-full h-20 p-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nhóm giai đoạn (Cột)</label>
                    <select 
                      value={editNodeCategory}
                      onChange={e => setEditNodeCategory(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    >
                      <option value="Basic">Basic (Giai đoạn 1)</option>
                      <option value="Advanced">Advanced (Giai đoạn 2)</option>
                      <option value="Master">Master (Giai đoạn 3)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Kỹ năng học trước (Tiền đề)</label>
                    <select 
                      multiple
                      value={editNodePrereqs}
                      onChange={e => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setEditNodePrereqs(selectedOptions);
                      }}
                      className="w-full h-24 p-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    >
                      {roadmap.nodes.filter(rn => rn.id !== selectedNode.id).map(n => (
                        <option key={n.id} value={n.id}>
                          {n.title} ({n.category})
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-muted-foreground italic">Giữ Ctrl (hoặc Cmd) để chọn nhiều kỹ năng tiền đề.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Mô tả</p>
                  <p className="text-sm leading-relaxed">{selectedNode.description || 'Chưa có mô tả chi tiết cho kỹ năng này.'}</p>
                </div>
              )}

              {/* Progress and status controls */}
              <div className="space-y-4 pt-2 border-t">
                <p className="text-xs font-bold text-muted-foreground uppercase">Trạng thái học tập</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setEditStatus(0)} className={`h-10 rounded-xl text-xs font-bold transition-all border ${editStatus === 0 ? 'bg-muted border-muted-foreground/30' : 'bg-transparent text-muted-foreground'}`}>Chưa học</button>
                  <button onClick={() => setEditStatus(1)} className={`h-10 rounded-xl text-xs font-bold transition-all border ${editStatus === 1 ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' : 'bg-transparent text-muted-foreground'}`}>Đang học</button>
                  <button onClick={() => setEditStatus(2)} className={`h-10 rounded-xl text-xs font-bold transition-all border ${editStatus === 2 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-transparent text-muted-foreground'}`}>Hoàn thành</button>
                </div>

                {editStatus === 1 && (
                  <div className="space-y-1.5 animate-in fade-in zoom-in-95">
                     <p className="text-xs font-bold text-muted-foreground uppercase">Ghi chú học tập <span className="text-[10px] lowercase normal-case font-normal">(tuỳ chọn)</span></p>
                     <textarea 
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      placeholder="Bạn đang học đến đâu? Nguồn tài liệu là gì?"
                      className="w-full h-24 p-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                     />
                  </div>
                )}

                {editStatus === 2 && (
                  <div className="space-y-1.5 animate-in fade-in zoom-in-95">
                     <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-muted-foreground uppercase">Chứng chỉ / Minh chứng <span className="text-destructive">*</span></p>
                       {selectedNode.certificateUrl && (
                          <a href={selectedNode.certificateUrl} target="_blank" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                             Xem hiện tại <ExternalLink className="h-3 w-3" />
                          </a>
                       )}
                     </div>
                     <input 
                      value={certUrl}
                      onChange={e => setCertUrl(e.target.value)}
                      placeholder="https://example.com/certificate.pdf"
                      className="w-full h-11 px-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                     />
                     <p className="text-[10px] text-muted-foreground italic">Bắt buộc cung cấp link URL đến chứng chỉ để xác thực hoàn thành.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-muted/10 flex flex-col gap-3">
              <button 
                onClick={handleSubmitNodeProgress}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
              >
                Lưu thay đổi
              </button>
              {selectedNode.isCustom && (
                <button 
                  onClick={handleDeleteCustomNode}
                  className="w-full h-12 rounded-2xl border border-destructive/30 text-destructive font-bold hover:bg-destructive/10 transition"
                >
                  Xoá kỹ năng tự chọn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Custom Node ── */}
      {showAddCustomNodeModal && roadmap && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Thêm kỹ năng tự chọn
              </h3>
              <button onClick={() => setShowAddCustomNodeModal(false)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Tên kỹ năng</label>
                <input 
                  autoFocus
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="Nhập tên kỹ năng..."
                  className="w-full h-11 px-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Mô tả chi tiết</label>
                <textarea 
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  placeholder="Nhập mô tả chi tiết..."
                  className="w-full h-20 p-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nhóm giai đoạn (Cột)</label>
                <select 
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="Basic">Basic (Giai đoạn 1)</option>
                  <option value="Advanced">Advanced (Giai đoạn 2)</option>
                  <option value="Master">Master (Giai đoạn 3)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Kỹ năng học trước (Tiền đề)</label>
                <select 
                  multiple
                  value={customPrereqs}
                  onChange={e => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setCustomPrereqs(selectedOptions);
                  }}
                  className="w-full h-24 p-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {roadmap.nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.category})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground italic">Giữ Ctrl (hoặc Cmd) để chọn nhiều kỹ năng tiền đề.</p>
              </div>
            </div>

            <button 
              onClick={handleAddCustomNode}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-xl shadow-primary/20"
            >
              Thêm kỹ năng
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Add Skill ── */}
      {showAddSkillModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Thêm kỹ năng mới</h3>
              <button onClick={() => setShowAddSkillModal(false)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input 
              autoFocus
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
              placeholder="Nhập tên kỹ năng..."
              className="w-full h-12 px-4 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button 
              onClick={handleAddSkill}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}

      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteRoadmap}
        title="Xoá lộ trình?"
        description="Bạn có chắc chắn muốn xoá lộ trình hiện tại? Mọi tiến trình của bạn sẽ bị mất."
      />
    </div>
  );
}
